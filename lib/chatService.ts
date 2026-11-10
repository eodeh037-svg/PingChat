import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { formatDisplayName, getUserProfile } from './userService';

export type ChatMessage = {
  id: string;
  text: string;
  uid: string;
  username: string;
  createdAt: Timestamp | null;
};

export type ChatSummary = {
  id: string;
  title: string;
  preview: string;
  participantIds: string[];
  peerIds: string[];
  lastMessageAt: Timestamp | null;
  lastMessageSenderId: string | null;
};

const MAX_RECENT_MESSAGES = 50;
const legacyMessagesCache = new Map<string, Promise<ChatMessage[]>>();

function getStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string'))]
    : [];
}

function messageFromDocument(snapshot: QueryDocumentSnapshot<DocumentData>): ChatMessage {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    text: typeof data.text === 'string' ? data.text : '',
    uid: typeof data.uid === 'string' ? data.uid : '',
    username: typeof data.username === 'string' ? data.username : '',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
  };
}

export function getDirectChatId(firstUid: string, secondUid: string): string {
  return firstUid > secondUid ? `${firstUid}_${secondUid}` : `${secondUid}_${firstUid}`;
}

async function getRecentMessages(chatId: string): Promise<ChatMessage[]> {
  const snapshot = await getDocs(
    query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(MAX_RECENT_MESSAGES)
    )
  );
  return snapshot.docs.map(messageFromDocument);
}

async function hasMessageFrom(chatId: string, uid: string): Promise<boolean> {
  const snapshot = await getDocs(
    query(collection(db, 'chats', chatId, 'messages'), where('uid', '==', uid), limit(1))
  );
  return !snapshot.empty;
}

function getLegacyMessages(chatId: string): Promise<ChatMessage[]> {
  const cached = legacyMessagesCache.get(chatId);
  if (cached) {
    return cached;
  }

  const request = getRecentMessages(chatId);
  legacyMessagesCache.set(chatId, request);
  void request.catch(() => {
    if (legacyMessagesCache.get(chatId) === request) {
      legacyMessagesCache.delete(chatId);
    }
  });
  return request;
}

async function preserveParticipants(chatId: string, participantIds: string[]): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(chatRef);
    if (!snapshot.exists()) {
      transaction.set(chatRef, {
        members: participantIds,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const existing = getStringList(snapshot.data().members);
    if (participantIds.every((participantId) => existing.includes(participantId))) {
      return;
    }

    transaction.set(chatRef, { members: arrayUnion(...participantIds) }, { merge: true });
  });
}

export async function getOrCreateDirectChat(currentUid: string, otherUid: string): Promise<string> {
  if (!currentUid || !otherUid || currentUid === otherUid) {
    throw new Error('Choose a different user to start a conversation.');
  }

  const deterministicChatId = getDirectChatId(currentUid, otherUid);
  const deterministicChat = await getDoc(doc(db, 'chats', deterministicChatId));
  if (deterministicChat.exists()) {
    await preserveParticipants(deterministicChatId, [currentUid, otherUid]);
    return deterministicChatId;
  }

  const currentChats = await getDocs(
    query(collection(db, 'chats'), where('members', 'array-contains', currentUid))
  );

  for (const chat of currentChats.docs) {
    const memberIds = getStringList(chat.data().members);
    if (memberIds.length === 2 && memberIds.includes(otherUid)) {
      await preserveParticipants(chat.id, [currentUid, otherUid]);
      return chat.id;
    }

    if (memberIds.length !== 1 || !memberIds.includes(currentUid)) {
      continue;
    }

    if (await hasMessageFrom(chat.id, otherUid)) {
      await preserveParticipants(chat.id, [currentUid, otherUid]);
      return chat.id;
    }
  }

  await preserveParticipants(deterministicChatId, [currentUid, otherUid]);
  return deterministicChatId;
}

export async function getChatSummaries(
  chatDocuments: QueryDocumentSnapshot<DocumentData>[],
  currentUid: string
): Promise<ChatSummary[]> {
  const chats = await Promise.all(
    chatDocuments.map(async (snapshot) => {
      const data = snapshot.data();
      const participantIds = getStringList(data.members);
      const needsLegacyMessages = typeof data.lastMessage !== 'string' || participantIds.length < 2;
      const recentMessages = needsLegacyMessages ? await getLegacyMessages(snapshot.id) : [];
      const fullParticipantIds = [
        ...new Set([
          ...participantIds,
          ...recentMessages.map((message) => message.uid).filter(Boolean),
        ]),
      ];
      const peerIds = fullParticipantIds.filter((uid) => uid !== currentUid);
      const peerProfiles = await Promise.all(peerIds.map(getUserProfile));
      const namesFromMessages = new Map(
        recentMessages
          .filter((message) => message.uid && message.username)
          .map((message) => [message.uid, message.username])
      );
      const names = peerIds.map((uid, index) => {
        const username = peerProfiles[index]?.username ?? namesFromMessages.get(uid);
        return username ? formatDisplayName(username) : 'Unknown user';
      });
      const title =
        names.length === 0
          ? 'Conversation'
          : `${names.slice(0, 2).join(', ')}${names.length > 2 ? ` +${names.length - 2}` : ''}`;
      const latestMessage = recentMessages[0];
      const lastMessageAt =
        data.lastMessageAt instanceof Timestamp
          ? data.lastMessageAt
          : (latestMessage?.createdAt ??
            (data.updatedAt instanceof Timestamp ? data.updatedAt : null));
      const lastMessageSenderId =
        typeof data.lastMessageSenderId === 'string'
          ? data.lastMessageSenderId
          : latestMessage?.uid || null;

      return {
        id: snapshot.id,
        title,
        preview:
          typeof data.lastMessage === 'string'
            ? data.lastMessage
            : latestMessage?.text || 'No messages yet',
        participantIds: fullParticipantIds,
        peerIds,
        lastMessageAt,
        lastMessageSenderId,
      };
    })
  );

  return chats.sort(
    (first, second) =>
      (second.lastMessageAt?.toMillis() ?? 0) - (first.lastMessageAt?.toMillis() ?? 0)
  );
}

export async function sendChatMessage({
  chatId,
  uid,
  username,
  text,
  participantIds,
}: {
  chatId: string;
  uid: string;
  username: string;
  text: string;
  participantIds: string[];
}): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) {
    return;
  }

  const batch = writeBatch(db);
  const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
  batch.set(messageRef, {
    text: cleanText,
    uid,
    username,
    createdAt: serverTimestamp(),
  });
  batch.set(
    doc(db, 'chats', chatId),
    {
      members: arrayUnion(...new Set([uid, ...participantIds])),
      lastMessage: cleanText,
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  await batch.commit();
  legacyMessagesCache.delete(chatId);
}

export { messageFromDocument };
