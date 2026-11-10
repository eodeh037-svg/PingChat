import {
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  startAt,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

export type UserProfile = {
  id: string;
  username: string;
  email?: string;
};

export type UserSearchPage = {
  users: UserProfile[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
};

export class UsernameTakenError extends Error {}

const USER_PAGE_SIZE = 40;
const userProfileCache = new Map<string, Promise<UserProfile | null>>();

export function formatDisplayName(username: string): string {
  return username
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getUserProfile(uid: string): Promise<UserProfile | null> {
  const cached = userProfileCache.get(uid);
  if (cached) {
    return cached;
  }

  const request = getDoc(doc(db, 'users', uid)).then((snapshot) => {
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    if (typeof data.username !== 'string' || !data.username.trim()) {
      return null;
    }

    return {
      id: snapshot.id,
      username: data.username,
      ...(typeof data.email === 'string' ? { email: data.email } : {}),
    };
  });
  userProfileCache.set(uid, request);
  void request.catch(() => {
    if (userProfileCache.get(uid) === request) {
      userProfileCache.delete(uid);
    }
  });
  return request;
}

export async function searchUsers({
  search,
  excludeUid,
  after,
}: {
  search: string;
  excludeUid: string;
  after?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<UserSearchPage> {
  const cleanSearch = search.trim().toLowerCase().replace(/\s+/g, '_');
  const baseQuery = cleanSearch
    ? query(
        collection(db, 'users'),
        orderBy('username'),
        startAt(cleanSearch),
        endAt(`${cleanSearch}\uf8ff`)
      )
    : query(collection(db, 'users'), orderBy('username'));
  const usersQuery = after
    ? query(baseQuery, startAfter(after), limit(USER_PAGE_SIZE))
    : query(baseQuery, limit(USER_PAGE_SIZE));
  const snapshot = await getDocs(usersQuery);
  const users = snapshot.docs.flatMap((document) => {
    const data = document.data();
    return document.id !== excludeUid && typeof data.username === 'string'
      ? [{ id: document.id, username: data.username }]
      : [];
  });

  return {
    users,
    cursor: snapshot.docs.at(-1) ?? null,
    hasMore: snapshot.docs.length === USER_PAGE_SIZE,
  };
}

export async function registerUserProfile({
  uid,
  username,
  email,
}: {
  uid: string;
  username: string;
  email: string;
}): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const usernameRef = doc(db, 'usernames', username);
    const profileRef = doc(db, 'users', uid);
    const usernameSnapshot = await transaction.get(usernameRef);
    if (usernameSnapshot.exists()) {
      throw new UsernameTakenError('That username is already taken.');
    }

    transaction.set(usernameRef, { uid });
    transaction.set(profileRef, {
      username,
      email,
      createdAt: serverTimestamp(),
    });
  });
}
