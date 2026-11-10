import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, parse } from 'node:path';

const PROJECT_ID = 'ping-ce71c';
const DATABASE_ID = '(default)';
const SEED_TAG = 'pingchat-demo-v1';
const DOCUMENTS_RESOURCE = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;
const DOCUMENTS_URL = `https://firestore.googleapis.com/v1/${DOCUMENTS_RESOURCE}`;
const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

const legacyFirstNames = [
  'John',
  'Kira',
  'Daniel',
  'Olivia',
  'Michael',
  'Sophia',
  'Ethan',
  'Isabella',
  'Noah',
  'Ava',
  'Liam',
  'Mia',
  'Lucas',
  'Amelia',
  'Mason',
  'Harper',
  'Logan',
  'Evelyn',
  'James',
  'Aria',
];

const legacyLastNames = [
  'Doe',
  'Jones',
  'Smith',
  'Brown',
  'Johnson',
  'Williams',
  'Davis',
  'Wilson',
  'Martinez',
  'Thompson',
  'Garcia',
  'Anderson',
  'Taylor',
  'Thomas',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Clark',
];

const profileFirstNames = [
  'Aisha',
  'Alicia',
  'Amara',
  'Andre',
  'Anika',
  'Arjun',
  'Beatrice',
  'Bianca',
  'Caleb',
  'Camila',
  'Carmen',
  'Celeste',
  'Chloe',
  'Darius',
  'Diego',
  'Elena',
  'Elias',
  'Emilia',
  'Farah',
  'Felix',
  'Freya',
  'Gabriel',
  'Hana',
  'Hugo',
  'Iris',
  'Javier',
  'Jordan',
  'Julian',
  'Kaito',
  'Leila',
  'Lucia',
  'Malik',
  'Maya',
  'Mateo',
  'Nadia',
  'Naomi',
  'Nia',
  'Omar',
  'Oscar',
  'Priya',
  'Rafael',
  'Rina',
  'Roman',
  'Safiya',
  'Talia',
  'Theo',
  'Valeria',
  'Xavier',
  'Yara',
  'Zoe',
];

const profileLastNames = [
  'Abbott',
  'Acosta',
  'Adler',
  'Agnew',
  'Ali',
  'Alvarez',
  'Archer',
  'Armstrong',
  'Avery',
  'Ayala',
  'Banks',
  'Barker',
  'Barrett',
  'Bates',
  'Baxter',
  'Becker',
  'Bellamy',
  'Bennett',
  'Berg',
  'Bishop',
  'Blair',
  'Bolton',
  'Boone',
  'Boyd',
  'Brady',
  'Brandt',
  'Brewer',
  'Briggs',
  'Brooks',
  'Burke',
  'Byrne',
  'Calder',
  'Campos',
  'Cannon',
  'Carey',
  'Carr',
  'Carson',
  'Castillo',
  'Chan',
  'Chang',
  'Chase',
  'Chen',
  'Choi',
  'Cline',
  'Cohen',
  'Cole',
  'Collier',
  'Conway',
  'Cortez',
  'Costa',
  'Cross',
  'Cruz',
  'Dalton',
  'Dean',
  'Delaney',
  'Delgado',
  'Dorsey',
  'Douglas',
  'Drake',
  'Dunn',
  'Eaton',
  'Edwards',
  'Ellis',
  'Emerson',
  'Evans',
  'Everett',
  'Farley',
  'Farrell',
  'Fischer',
  'Flynn',
  'Foley',
  'Franco',
  'Franklin',
  'Frost',
  'Fuller',
  'Gaines',
  'Gallagher',
  'Galloway',
  'Gardner',
  'Garrett',
  'Garrison',
  'Gibbs',
  'Gilbert',
  'Gill',
  'Glover',
  'Goodwin',
  'Gordon',
  'Graham',
  'Graves',
  'Gray',
  'Green',
  'Griffin',
  'Guerrero',
  'Hall',
  'Han',
  'Hardy',
  'Harper',
  'Hart',
  'Hayes',
  'Hinton',
];

type DialogueLine = { speaker: 0 | 1; text: string };

const conversations: DialogueLine[][] = [
  [
    { speaker: 0, text: 'Hey {b}, how is your day going?' },
    { speaker: 1, text: 'Pretty good! Just finished work. How about you?' },
    { speaker: 0, text: 'Not bad. Are you still coming tomorrow?' },
    { speaker: 1, text: 'Yes! I should be there around 10.' },
  ],
  [
    { speaker: 1, text: 'Do you have a minute to look over the launch notes?' },
    { speaker: 0, text: 'Sure, send them over. I have a few minutes before my next call.' },
    { speaker: 1, text: 'Just shared the doc. The timeline section is the one I am unsure about.' },
    { speaker: 0, text: 'I will review it now and leave comments before lunch.' },
  ],
  [
    { speaker: 0, text: 'Coffee this weekend? I found a little place on Pine Street.' },
    { speaker: 1, text: 'That sounds lovely. Saturday afternoon works for me.' },
    { speaker: 0, text: 'Perfect, how about 2:30?' },
    { speaker: 1, text: 'Booked. Send me the name and I will meet you there.' },
  ],
  [
    { speaker: 1, text: 'The train is running about ten minutes late.' },
    { speaker: 0, text: 'Thanks for letting me know. I will wait by the main entrance.' },
    { speaker: 1, text: 'I am on the next one, should be there at 6:20.' },
    { speaker: 0, text: 'No rush, I have the tickets already.' },
  ],
  [
    { speaker: 0, text: 'I tried the pasta recipe you sent me last night.' },
    { speaker: 1, text: 'How did it turn out?' },
    { speaker: 0, text: 'Really good! I added lemon and a little extra garlic.' },
    { speaker: 1, text: 'That is exactly how I make it now too.' },
  ],
  [
    { speaker: 1, text: 'Could we move our check-in to Thursday?' },
    { speaker: 0, text: 'Thursday is good. Morning or afternoon?' },
    { speaker: 1, text: 'Would 11:30 work?' },
    { speaker: 0, text: 'Yes, I will update the invite.' },
  ],
  [
    { speaker: 0, text: 'Are you still up for the hike on Sunday?' },
    { speaker: 1, text: 'Definitely. I checked the forecast and it looks clear.' },
    { speaker: 0, text: 'Great! The trailhead is about an hour away.' },
    { speaker: 1, text: 'I can drive if you want to split gas.' },
    { speaker: 0, text: 'That would be awesome, thank you.' },
  ],
  [
    { speaker: 1, text: 'I finally watched the film you recommended.' },
    { speaker: 0, text: 'Oh nice, what did you think?' },
    { speaker: 1, text: 'The ending caught me completely off guard.' },
    { speaker: 0, text: 'Right? I had to sit with it for a while.' },
  ],
  [
    { speaker: 0, text: 'The client liked the first draft.' },
    { speaker: 1, text: 'That is great news. Did they have any changes?' },
    { speaker: 0, text: 'Just a few edits to the opening and one new chart.' },
    { speaker: 1, text: 'I can take the chart. Send me the latest file.' },
  ],
  [
    { speaker: 1, text: 'Happy birthday, {a}! Hope you have something fun planned.' },
    { speaker: 0, text: 'Thank you! Keeping it low-key with family tonight.' },
    { speaker: 1, text: 'That sounds perfect. We should celebrate properly soon.' },
    { speaker: 0, text: 'Absolutely, let us pick a day next week.' },
  ],
  [
    { speaker: 0, text: 'Do you remember where we parked last time?' },
    { speaker: 1, text: 'Level two, near the blue elevator.' },
    { speaker: 0, text: 'Found it, thank you. I was about to start wandering.' },
    { speaker: 1, text: 'Glad I remembered. See you in a few!' },
  ],
  [
    { speaker: 1, text: 'I have a dentist appointment that overlaps with our call.' },
    { speaker: 0, text: 'No problem at all. Want to try Friday instead?' },
    { speaker: 1, text: 'Friday after 1 would be ideal.' },
    { speaker: 0, text: 'I will send a new invite for 1:30.' },
  ],
  [
    { speaker: 0, text: 'The package arrived today!' },
    { speaker: 1, text: 'Already? That was quick. Is everything okay?' },
    { speaker: 0, text: 'All in one piece, and the color looks even better in person.' },
    { speaker: 1, text: 'I cannot wait to see it.' },
  ],
  [
    { speaker: 1, text: 'Would you mind sharing your notes from the workshop?' },
    { speaker: 0, text: 'Of course. I will tidy them up and send the link this afternoon.' },
    { speaker: 1, text: 'Thanks, especially the section on customer interviews.' },
    { speaker: 0, text: 'I wrote down a few good questions there too.' },
  ],
  [
    { speaker: 0, text: 'We got a table for six at 7:00.' },
    { speaker: 1, text: 'Perfect. Should I bring anything?' },
    { speaker: 0, text: 'Just yourself. I will order a couple of things for the table.' },
    { speaker: 1, text: 'Sounds good, looking forward to it.' },
  ],
  [
    { speaker: 1, text: 'Have you seen the new photos from the trip?' },
    { speaker: 0, text: 'Not yet, where did you post them?' },
    { speaker: 1, text: 'I put the album in our shared folder.' },
    { speaker: 0, text: 'Found it. That sunset shot is incredible.' },
  ],
  [
    { speaker: 0, text: 'I am running behind, sorry!' },
    { speaker: 1, text: 'No worries, we have not ordered yet.' },
    { speaker: 0, text: 'Traffic is finally moving. I should be there in 15.' },
    { speaker: 1, text: 'Take your time. I saved you a seat by the window.' },
  ],
  [
    { speaker: 1, text: 'The new build is ready for a quick test.' },
    { speaker: 0, text: 'Great, I can try it after my meeting.' },
    { speaker: 1, text: 'The login flow is the main thing to check.' },
    { speaker: 0, text: 'Got it. I will send you anything I notice.' },
  ],
  [
    { speaker: 0, text: 'Do you know a good place to get a bike tuned up?' },
    { speaker: 1, text: 'Try Northside Cycles. They have been great with mine.' },
    { speaker: 0, text: 'I will give them a call tomorrow.' },
    { speaker: 1, text: 'Ask for Sam, and mention you need it before the weekend.' },
  ],
  [
    { speaker: 1, text: 'Thanks again for helping me move those boxes.' },
    { speaker: 0, text: 'Anytime! Glad we got it done before the rain.' },
    { speaker: 1, text: 'I owe you dinner.' },
    { speaker: 0, text: 'I will hold you to that. Next week?' },
  ],
  [
    { speaker: 0, text: 'The meeting notes are in the project folder now.' },
    { speaker: 1, text: 'Thanks. I will add the action items I took.' },
    { speaker: 0, text: 'Could you also confirm the owner for the last task?' },
    { speaker: 1, text: 'Yes, I will check with the team and update it today.' },
  ],
  [
    { speaker: 1, text: 'Is the farmers market still open on Sundays?' },
    { speaker: 0, text: 'Until 1, I think. We should go early for the good bread.' },
    { speaker: 1, text: 'Want to meet there around 9:30?' },
    { speaker: 0, text: 'Works for me. I will bring a tote bag.' },
  ],
  [
    { speaker: 0, text: 'I started that book on the flight.' },
    { speaker: 1, text: 'Did it hook you right away?' },
    { speaker: 0, text: 'A little slowly, but now I am halfway through.' },
    { speaker: 1, text: 'It gets even better in the second half.' },
  ],
  [
    { speaker: 1, text: 'Could you send me the address for the studio?' },
    { speaker: 0, text: 'Sure, it is 18 Willow Lane, above the bakery.' },
    { speaker: 1, text: 'Got it. Is there parking nearby?' },
    { speaker: 0, text: 'There is a small lot behind the building.' },
  ],
  [
    { speaker: 0, text: 'We should plan a proper catch-up soon.' },
    { speaker: 1, text: 'Agreed. The last few weeks have flown by.' },
    { speaker: 0, text: 'How does next Wednesday evening look?' },
    { speaker: 1, text: 'Free after 6. Let us do dinner.' },
  ],
  [
    { speaker: 1, text: 'I made the changes from the review.' },
    { speaker: 0, text: 'Nice, thank you. The new flow reads much more clearly.' },
    { speaker: 1, text: 'I also added the missing edge case.' },
    { speaker: 0, text: 'Great catch. I will take another look this morning.' },
  ],
  [
    { speaker: 0, text: 'Did you get home okay?' },
    { speaker: 1, text: 'Yes, just walked in. Thanks for checking.' },
    { speaker: 0, text: 'Glad you made it. That was a fun night.' },
    { speaker: 1, text: 'It really was. Let us do it again soon.' },
  ],
  [
    { speaker: 1, text: 'What time should we leave for the airport?' },
    { speaker: 0, text: 'The flight is at noon, so I would leave by 8:30.' },
    { speaker: 1, text: 'That gives us plenty of time.' },
    { speaker: 0, text: 'Exactly. I will book the ride tonight.' },
  ],
  [
    { speaker: 0, text: 'I found the playlist you mentioned.' },
    { speaker: 1, text: 'Any early favorites?' },
    { speaker: 0, text: 'The third track is already stuck in my head.' },
    { speaker: 1, text: 'That one has been on repeat for me all week.' },
  ],
  [
    { speaker: 1, text: 'Can you cover the first half of the presentation?' },
    { speaker: 0, text: 'Sure. I can take the intro and the customer results.' },
    { speaker: 1, text: 'Perfect, I will handle the roadmap and wrap-up.' },
    { speaker: 0, text: 'I will share a draft outline before the end of the day.' },
  ],
  [
    { speaker: 0, text: 'The garden is finally starting to come in.' },
    { speaker: 1, text: 'What are you growing this year?' },
    { speaker: 0, text: 'Tomatoes, basil, and a few peppers.' },
    { speaker: 1, text: 'Fresh basil makes everything better.' },
  ],
  [
    { speaker: 1, text: 'I left your charger in the front desk drawer.' },
    { speaker: 0, text: 'Thank you! I was wondering where it went.' },
    { speaker: 1, text: 'No problem. I will be at the office tomorrow if you need anything else.' },
    { speaker: 0, text: 'That is great, I will pick it up then.' },
  ],
];

type SeedUser = {
  uid: string;
  username: string;
  email: string;
  createdAt: Date;
};

type SeedDocument = {
  path: string;
  kind: 'profile' | 'username' | 'chat' | 'message';
  fields: Record<string, unknown>;
};

type FirebaseCliAccount = {
  tokens?: { refresh_token?: string };
};

type FirebaseCliAuth = {
  getGlobalDefaultAccount(): FirebaseCliAccount | undefined;
  getAccessToken(refreshToken: string, scopes: string[]): Promise<{ access_token: string }>;
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
  updateTime?: string;
};

type FirestoreValue = {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  timestampValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

type FirestoreBatchGetResult = {
  found?: FirestoreDocument;
  missing?: string;
};

type FirestoreListResult = {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
};

type FirestoreError = { error?: { status?: string; message?: string } };

function makeUsers(): SeedUser[] {
  const legacyUsernames = new Set(
    Array.from({ length: 100 }, (_, index) => {
      const firstName = legacyFirstNames[index % legacyFirstNames.length];
      const lastName =
        legacyLastNames[
          (index * 7 + Math.floor(index / legacyFirstNames.length) * 3) % legacyLastNames.length
        ];
      return `${firstName}_${lastName}`.toLowerCase();
    })
  );
  const users = Array.from({ length: 100 }, (_, index) => {
    const legacyFirstName = legacyFirstNames[index % legacyFirstNames.length];
    const legacyLastName =
      legacyLastNames[
        (index * 7 + Math.floor(index / legacyFirstNames.length) * 3) % legacyLastNames.length
      ];
    const firstName = profileFirstNames[index % profileFirstNames.length];
    const lastName = profileLastNames[(index * 37) % profileLastNames.length];
    const username = `${firstName}_${lastName}`.toLowerCase();
    const createdAt = new Date(Date.now() - ((index * 37) % 180) * 24 * 60 * 60 * 1000);
    return {
      uid: `demo_${legacyFirstName}_${legacyLastName}`.toLowerCase(),
      username,
      email: `${username}@example.invalid`,
      createdAt,
    };
  });
  if (
    new Set(profileFirstNames).size !== profileFirstNames.length ||
    new Set(profileLastNames).size !== profileLastNames.length ||
    new Set(users.map((user) => user.uid)).size !== users.length ||
    new Set(users.map((user) => user.username)).size !== users.length ||
    new Set(users.map((user) => user.username.split('_').slice(1).join('_'))).size !==
      users.length ||
    users.some((user) => user.username.length > 20) ||
    users.some((user) => legacyUsernames.has(user.username))
  ) {
    throw new Error(
      'Generated demo profiles contain duplicate, invalid, or conflicting usernames.'
    );
  }
  return users;
}

function directChatId(firstUid: string, secondUid: string): string {
  return firstUid > secondUid ? `${firstUid}_${secondUid}` : `${secondUid}_${firstUid}`;
}

function dateBefore(date: Date, milliseconds: number): Date {
  return new Date(date.getTime() - milliseconds);
}

function makeConversationDocuments(
  firstUid: string,
  firstUsername: string,
  secondUid: string,
  secondUsername: string,
  lines: DialogueLine[],
  index: number,
  now: Date
): SeedDocument[] {
  const chatId = directChatId(firstUid, secondUid);
  const lastMessageAt = dateBefore(now, (((index * 17) % 240) + 1) * 60 * 60 * 1000);
  const messages = lines.map((line, messageIndex) => {
    const uid = line.speaker === 0 ? firstUid : secondUid;
    const username = line.speaker === 0 ? firstUsername : secondUsername;
    const firstName = username.split('_')[0];
    const otherUsername = line.speaker === 0 ? secondUsername : firstUsername;
    const otherName = otherUsername.split('_')[0];
    const text = line.text
      .replaceAll('{a}', firstName.charAt(0).toUpperCase() + firstName.slice(1))
      .replaceAll('{b}', otherName.charAt(0).toUpperCase() + otherName.slice(1));
    const createdAt = dateBefore(lastMessageAt, (lines.length - messageIndex - 1) * 8 * 60 * 1000);
    return {
      path: `chats/${chatId}/messages/demo_message_${String(messageIndex + 1).padStart(2, '0')}`,
      kind: 'message' as const,
      fields: {
        text,
        uid,
        username,
        createdAt,
        seedTag: SEED_TAG,
      },
    };
  });
  const lastMessage = messages[messages.length - 1];
  const participantIds = [firstUid, secondUid].sort();
  const chatDocument: SeedDocument = {
    path: `chats/${chatId}`,
    kind: 'chat',
    fields: {
      members: participantIds,
      createdAt: dateBefore(messages[0].fields.createdAt, ((index % 12) + 1) * 24 * 60 * 60 * 1000),
      updatedAt: lastMessageAt,
      lastMessage: lastMessage.fields.text,
      lastMessageAt,
      lastMessageSenderId: lastMessage.fields.uid,
      seedTag: SEED_TAG,
    },
  };
  return [chatDocument, ...messages];
}

function createSeedPlan(
  users: SeedUser[],
  currentUser?: { uid: string; username: string },
  now = new Date()
): SeedDocument[] {
  const documents: SeedDocument[] = [];
  for (const user of users) {
    documents.push(
      {
        path: `users/${user.uid}`,
        kind: 'profile',
        fields: {
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          isDemo: true,
          seedTag: SEED_TAG,
        },
      },
      { path: `usernames/${user.username}`, kind: 'username', fields: { uid: user.uid } }
    );
  }

  for (let index = 0; index < 32; index += 1) {
    const first = users[(index * 3) % users.length];
    const second = users[(index * 3 + 13) % users.length];
    documents.push(
      ...makeConversationDocuments(
        first.uid,
        first.username,
        second.uid,
        second.username,
        conversations[index],
        index,
        now
      )
    );
  }

  if (currentUser) {
    for (let index = 0; index < 8; index += 1) {
      const peer = users[(index * 11 + 5) % users.length];
      documents.push(
        ...makeConversationDocuments(
          currentUser.uid,
          currentUser.username,
          peer.uid,
          peer.username,
          conversations[index],
          index + 32,
          now
        )
      );
    }
  }

  const paths = new Set(documents.map((document) => document.path));
  if (paths.size !== documents.length) {
    throw new Error('Generated seed data contains duplicate document paths.');
  }
  const chatMembers = new Map<string, string[]>();
  for (const document of documents.filter((candidate) => candidate.kind === 'chat')) {
    const members = document.fields.members;
    if (!Array.isArray(members) || !members.every((member) => typeof member === 'string')) {
      throw new Error('Generated chat contains invalid participant IDs.');
    }
    chatMembers.set(document.path, members);
  }
  for (const document of documents.filter((candidate) => candidate.kind === 'message')) {
    const parentPath = document.path.slice(0, document.path.indexOf('/messages/'));
    const senderUid = document.fields.uid;
    if (typeof senderUid !== 'string' || !chatMembers.get(parentPath)?.includes(senderUid)) {
      throw new Error('Generated message sender is not a participant in its chat.');
    }
  }

  return documents;
}

function findFirebaseToolsRoot(): string {
  const command = process.platform === 'win32' ? 'where' : 'which';
  const binary = execFileSync(command, ['firebase'], { encoding: 'utf8' })
    .split(/\r?\n/)
    .find(Boolean);
  if (!binary) {
    throw new Error('Firebase CLI was not found. Install it and run `firebase login` first.');
  }

  let directory = dirname(realpathSync(binary.trim()));
  const root = parse(directory).root;
  while (directory !== root) {
    const packagePath = join(directory, 'package.json');
    if (existsSync(packagePath)) {
      const packageInfo = JSON.parse(readFileSync(packagePath, 'utf8')) as { name?: string };
      if (packageInfo.name === 'firebase-tools') {
        return directory;
      }
    }
    directory = dirname(directory);
  }
  throw new Error('Could not locate Firebase CLI authentication support from the installed CLI.');
}

async function getAccessToken(): Promise<string> {
  const requireFromWorkspace = createRequire(join(process.cwd(), 'package.json'));
  const authModule = requireFromWorkspace(
    join(findFirebaseToolsRoot(), 'lib', 'auth.js')
  ) as FirebaseCliAuth;
  const account = authModule.getGlobalDefaultAccount();
  const refreshToken = account?.tokens?.refresh_token;
  if (!refreshToken) {
    throw new Error(
      'No Firebase CLI login is available. Run `firebase login` with an account that can write to ping-ce71c.'
    );
  }
  const result = await authModule.getAccessToken(refreshToken, [CLOUD_PLATFORM_SCOPE]);
  return result.access_token;
}

function encodeValue(value: unknown): FirestoreValue {
  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    return { integerValue: String(value) };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeValue) } };
  }
  if (value && typeof value === 'object') {
    return { mapValue: { fields: encodeFields(value as Record<string, unknown>) } };
  }
  throw new Error('Unsupported Firestore field value in seed data.');
}

function encodeFields(fields: Record<string, unknown>): Record<string, FirestoreValue> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, encodeValue(value)])
  );
}

function decodeValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue?.values ?? []).map(decodeValue);
  if ('mapValue' in value) return decodeFieldsFromFirestore(value.mapValue?.fields ?? {});
  return null;
}

function decodeFieldsFromFirestore(
  fields: Record<string, FirestoreValue>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeValue(value)])
  );
}

async function firestoreRequest<T>(token: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${DOCUMENTS_URL}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const responseText = await response.text();
  if (!response.ok) {
    let error: FirestoreError = {};
    try {
      error = JSON.parse(responseText) as FirestoreError;
    } catch {
      error = {};
    }
    const status = error.error?.status ?? `HTTP_${response.status}`;
    const message = error.error?.message ?? responseText.trim().slice(0, 300);
    throw new Error(
      `Firestore request failed (${status})${message ? `: ${message}` : ''}. Confirm the Firebase CLI account has access to ${PROJECT_ID}.`
    );
  }
  return JSON.parse(responseText) as T;
}

async function readExistingDocuments(
  token: string,
  documents: SeedDocument[]
): Promise<Map<string, Record<string, unknown>>> {
  const existing = new Map<string, Record<string, unknown>>();
  for (let offset = 0; offset < documents.length; offset += 100) {
    const chunk = documents.slice(offset, offset + 100);
    const result = await firestoreRequest<FirestoreBatchGetResult[]>(token, ':batchGet', {
      documents: chunk.map((document) => `${DOCUMENTS_RESOURCE}/${document.path}`),
      mask: {
        fieldPaths: [
          'username',
          'uid',
          'text',
          'isDemo',
          'seedTag',
          'members',
          'lastMessage',
          'lastMessageSenderId',
        ],
      },
    });
    for (const item of result) {
      if (item.found) {
        existing.set(item.found.name, {
          ...decodeFieldsFromFirestore(item.found.fields ?? {}),
          ...(item.found.updateTime ? { __updateTime: item.found.updateTime } : {}),
        });
      }
    }
  }
  return existing;
}

function matchesSeed(document: SeedDocument, existing: Record<string, unknown>): boolean {
  switch (document.kind) {
    case 'profile':
      return (
        existing.seedTag === SEED_TAG &&
        existing.isDemo === true &&
        existing.username === document.fields.username
      );
    case 'username':
      return existing.uid === document.fields.uid;
    case 'chat': {
      const members = existing.members;
      const expectedMembers = document.fields.members;
      return (
        existing.seedTag === SEED_TAG &&
        Array.isArray(members) &&
        Array.isArray(expectedMembers) &&
        members.length === expectedMembers.length &&
        expectedMembers.every((member) => members.includes(member)) &&
        existing.lastMessage === document.fields.lastMessage &&
        existing.lastMessageSenderId === document.fields.lastMessageSenderId
      );
    }
    case 'message':
      return (
        existing.seedTag === SEED_TAG &&
        existing.text === document.fields.text &&
        existing.uid === document.fields.uid &&
        existing.username === document.fields.username
      );
  }
}

function reportDryRun(documents: SeedDocument[], currentUserIncluded: boolean): void {
  const count = (kind: SeedDocument['kind']) =>
    documents.filter((document) => document.kind === kind).length;
  console.log(`Project: ${PROJECT_ID} / ${DATABASE_ID}`);
  console.log('Mode: dry run (no Firestore reads or writes)');
  console.log(`Demo profiles: ${count('profile')}`);
  console.log(`Username mappings: ${count('username')}`);
  console.log(
    `One-to-one chats: ${count('chat')} (${currentUserIncluded ? 'includes the supplied account' : 'demo users only'})`
  );
  console.log(`Nested messages: ${count('message')}`);
  console.log('To create missing records, rerun with --apply.');
}

async function applySeed(documents: SeedDocument[], currentUserUid?: string): Promise<void> {
  const token = await getAccessToken();
  const currentUserDocuments = currentUserUid
    ? await readExistingDocuments(token, [
        {
          path: `users/${currentUserUid}`,
          kind: 'profile',
          fields: {},
        },
      ])
    : new Map<string, Record<string, unknown>>();
  let currentUserUsername: string | undefined;
  if (currentUserUid) {
    const currentUser = currentUserDocuments.get(`${DOCUMENTS_RESOURCE}/users/${currentUserUid}`);
    if (typeof currentUser?.username !== 'string') {
      throw new Error(
        'The supplied current-user UID does not have a readable users/{uid} profile.'
      );
    }
    currentUserUsername = currentUser.username;
  }

  const plan =
    currentUserUid && currentUserUsername
      ? createSeedPlan(makeUsers(), { uid: currentUserUid, username: currentUserUsername })
      : documents;
  const existing = await readExistingDocuments(token, plan);
  const conflicts: string[] = [];
  const missing: SeedDocument[] = [];
  let alreadyPresent = 0;
  for (const document of plan) {
    const name = `${DOCUMENTS_RESOURCE}/${document.path}`;
    const record = existing.get(name);
    if (!record) {
      missing.push(document);
    } else if (matchesSeed(document, record)) {
      alreadyPresent += 1;
    } else {
      conflicts.push(document.path);
    }
  }

  if (conflicts.length > 0) {
    throw new Error(
      `${conflicts.length} existing record(s) conflict with the seed plan. Nothing was written; existing data was left unchanged.`
    );
  }

  let created = 0;
  const createdByKind: Record<SeedDocument['kind'], number> = {
    profile: 0,
    username: 0,
    chat: 0,
    message: 0,
  };
  for (let offset = 0; offset < missing.length; offset += 450) {
    const chunk = missing.slice(offset, offset + 450);
    await firestoreRequest(token, ':commit', {
      writes: chunk.map((document) => ({
        update: {
          name: `${DOCUMENTS_RESOURCE}/${document.path}`,
          fields: encodeFields(document.fields),
        },
        currentDocument: { exists: false },
      })),
    });
    created += chunk.length;
    for (const document of chunk) {
      createdByKind[document.kind] += 1;
    }
  }

  console.log(`Project: ${PROJECT_ID} / ${DATABASE_ID}`);
  console.log(`Created profiles: ${createdByKind.profile}`);
  console.log(`Created username mappings: ${createdByKind.username}`);
  console.log(`Created chats: ${createdByKind.chat}`);
  console.log(`Created nested messages: ${createdByKind.message}`);
  console.log(`Already present and verified: ${alreadyPresent}`);
  console.log(`Total created: ${created}`);
}

async function listCollectionDocuments(
  token: string,
  collectionPath: string
): Promise<FirestoreDocument[]> {
  const documents: FirestoreDocument[] = [];
  let pageToken = '';
  do {
    const query = new URLSearchParams({ pageSize: '1000' });
    if (pageToken) {
      query.set('pageToken', pageToken);
    }
    const result = await firestoreRequest<FirestoreListResult>(
      token,
      `/${collectionPath}?${query.toString()}`
    );
    documents.push(...(result.documents ?? []));
    pageToken = result.nextPageToken ?? '';
  } while (pageToken);
  return documents;
}

function requireUpdateTime(document: Record<string, unknown> | undefined, path: string): string {
  const updateTime = document?.__updateTime;
  if (typeof updateTime !== 'string') {
    throw new Error(`Could not verify the latest version of ${path}; no changes were written.`);
  }
  return updateTime;
}

async function refreshDemoNames(apply: boolean): Promise<void> {
  const users = makeUsers();
  const seedPlan = createSeedPlan(users);
  const count = (kind: SeedDocument['kind']) =>
    seedPlan.filter((document) => document.kind === kind).length;
  if (!apply) {
    console.log(`Project: ${PROJECT_ID} / ${DATABASE_ID}`);
    console.log('Mode: name-refresh dry run (no Firestore reads or writes)');
    console.log(`Demo profiles in the refresh plan: ${count('profile')}`);
    console.log(`Username mappings in the refresh plan: ${count('username')}`);
    console.log(`Seeded conversations in the refresh plan: ${count('chat')}`);
    console.log(`Seeded messages in the refresh plan: ${count('message')}`);
    console.log('To apply these changes, rerun with --apply.');
    return;
  }

  const token = await getAccessToken();
  const profileDocuments = users.map((user) => ({
    path: `users/${user.uid}`,
    kind: 'profile' as const,
    fields: {},
  }));
  const existingProfiles = await readExistingDocuments(token, profileDocuments);
  const oldUsernames = new Map<string, string>();
  for (const user of users) {
    const path = `users/${user.uid}`;
    const profile = existingProfiles.get(`${DOCUMENTS_RESOURCE}/${path}`);
    if (
      profile?.seedTag !== SEED_TAG ||
      profile.isDemo !== true ||
      typeof profile.username !== 'string'
    ) {
      throw new Error(`Expected a marked demo profile at ${path}; no records were changed.`);
    }
    oldUsernames.set(user.uid, profile.username);
  }

  const chatDocuments = seedPlan.filter((document) => document.kind === 'chat');
  const messagePlan = new Map(
    seedPlan
      .filter((document) => document.kind === 'message')
      .map((document) => [document.path, document])
  );
  const existingChats = await readExistingDocuments(token, chatDocuments);
  const chatMessages = await Promise.all(
    chatDocuments.map(async (chat) => {
      const currentChat = existingChats.get(`${DOCUMENTS_RESOURCE}/${chat.path}`);
      const currentMembers = currentChat?.members;
      const expectedMembers = chat.fields.members;
      if (
        currentChat?.seedTag !== SEED_TAG ||
        !Array.isArray(currentMembers) ||
        !Array.isArray(expectedMembers) ||
        currentMembers.length !== expectedMembers.length ||
        !expectedMembers.every((member) => currentMembers.includes(member))
      ) {
        throw new Error(
          `Expected a marked demo conversation at ${chat.path}; no records were changed.`
        );
      }
      const collectionPath = `${chat.path}/messages`;
      return {
        chat,
        currentChat,
        messages: await listCollectionDocuments(token, collectionPath),
      };
    })
  );

  const oldAndNewUsernamePaths = new Set<string>();
  for (const user of users) {
    oldAndNewUsernamePaths.add(`usernames/${oldUsernames.get(user.uid)}`);
    oldAndNewUsernamePaths.add(`usernames/${user.username}`);
  }
  const usernameDocuments = [...oldAndNewUsernamePaths].map((path) => ({
    path,
    kind: 'username' as const,
    fields: {},
  }));
  const existingUsernames = await readExistingDocuments(token, usernameDocuments);
  const demoUidSet = new Set(users.map((user) => user.uid));
  const targetUidByUsernamePath = new Map(
    users.map((user) => [`usernames/${user.username}`, user.uid])
  );
  const writes: Record<string, unknown>[] = [];
  const writePaths = new Set<string>();
  const addWrite = (path: string, write: Record<string, unknown>) => {
    if (writePaths.has(path)) {
      throw new Error(
        `The name refresh would modify ${path} more than once; no records were changed.`
      );
    }
    writePaths.add(path);
    writes.push(write);
  };

  for (const user of users) {
    const profilePath = `users/${user.uid}`;
    const profile = existingProfiles.get(`${DOCUMENTS_RESOURCE}/${profilePath}`);
    const oldUsername = oldUsernames.get(user.uid);
    if (!oldUsername) {
      throw new Error(`Missing the current username for ${profilePath}; no records were changed.`);
    }
    const oldUsernamePath = `usernames/${oldUsername}`;
    const newUsernamePath = `usernames/${user.username}`;
    const oldMapping = existingUsernames.get(`${DOCUMENTS_RESOURCE}/${oldUsernamePath}`);
    const newMapping = existingUsernames.get(`${DOCUMENTS_RESOURCE}/${newUsernamePath}`);
    if (oldMapping && oldMapping.uid !== user.uid) {
      throw new Error(
        `The current username mapping at ${oldUsernamePath} does not match ${profilePath}; no records were changed.`
      );
    }
    if (
      newMapping &&
      newMapping.uid !== user.uid &&
      (!demoUidSet.has(String(newMapping.uid)) ||
        oldUsernames.get(String(newMapping.uid)) !== user.username)
    ) {
      throw new Error(
        `The requested username ${user.username} is already reserved; no records were changed.`
      );
    }

    if (oldUsername !== user.username) {
      addWrite(`${DOCUMENTS_RESOURCE}/${profilePath}`, {
        update: {
          name: `${DOCUMENTS_RESOURCE}/${profilePath}`,
          fields: encodeFields({ username: user.username, email: user.email }),
        },
        updateMask: { fieldPaths: ['username', 'email'] },
        currentDocument: {
          updateTime: requireUpdateTime(profile, profilePath),
        },
      });
    }
  }

  for (const usernamePath of oldAndNewUsernamePaths) {
    const mapping = existingUsernames.get(`${DOCUMENTS_RESOURCE}/${usernamePath}`);
    const targetUid = targetUidByUsernamePath.get(usernamePath);
    if (!mapping) {
      if (targetUid) {
        addWrite(`${DOCUMENTS_RESOURCE}/${usernamePath}`, {
          update: {
            name: `${DOCUMENTS_RESOURCE}/${usernamePath}`,
            fields: encodeFields({ uid: targetUid }),
          },
          currentDocument: { exists: false },
        });
      }
      continue;
    }

    if (!targetUid) {
      const currentUid = mapping.uid;
      if (
        typeof currentUid !== 'string' ||
        oldUsernames.get(currentUid) !== usernamePath.slice(10)
      ) {
        throw new Error(
          `The old username mapping at ${usernamePath} is not safe to release; no records were changed.`
        );
      }
      addWrite(`${DOCUMENTS_RESOURCE}/${usernamePath}`, {
        delete: `${DOCUMENTS_RESOURCE}/${usernamePath}`,
        currentDocument: {
          updateTime: requireUpdateTime(mapping, usernamePath),
        },
      });
      continue;
    }

    if (mapping.uid === targetUid) {
      continue;
    }
    if (
      typeof mapping.uid !== 'string' ||
      !demoUidSet.has(mapping.uid) ||
      oldUsernames.get(mapping.uid) !== usernamePath.slice(10)
    ) {
      throw new Error(
        `The username mapping at ${usernamePath} belongs to a non-migrating account; no records were changed.`
      );
    }
    addWrite(`${DOCUMENTS_RESOURCE}/${usernamePath}`, {
      update: {
        name: `${DOCUMENTS_RESOURCE}/${usernamePath}`,
        fields: encodeFields({ uid: targetUid }),
      },
      updateMask: { fieldPaths: ['uid'] },
      currentDocument: {
        updateTime: requireUpdateTime(mapping, usernamePath),
      },
    });
  }

  const profileUsernames = new Map(users.map((user) => [user.uid, user.username]));
  const changedChatPreviews = new Map<string, string>();
  for (const { chat, currentChat, messages } of chatMessages) {
    const updatedMessages = messages
      .filter((message) => message.fields?.seedTag?.stringValue === SEED_TAG)
      .map((message) => {
        const path = message.name.split('/documents/')[1];
        const planned = messagePlan.get(path);
        const uid = message.fields?.uid?.stringValue;
        const username = uid ? profileUsernames.get(uid) : undefined;
        if (
          !planned ||
          !username ||
          typeof message.updateTime !== 'string' ||
          !demoUidSet.has(uid ?? '')
        ) {
          throw new Error(
            `Found an unexpected seeded message at ${path}; no records were changed.`
          );
        }
        const text = planned.fields.text;
        if (typeof text !== 'string') {
          throw new Error(`Could not regenerate the sample message at ${path}.`);
        }
        const oldText = message.fields?.text?.stringValue;
        if (message.fields?.username?.stringValue !== username || oldText !== text) {
          addWrite(message.name, {
            update: {
              name: message.name,
              fields: encodeFields({ username, text }),
            },
            updateMask: { fieldPaths: ['username', 'text'] },
            currentDocument: { updateTime: message.updateTime },
          });
        }
        return {
          createdAt: message.fields?.createdAt?.timestampValue ?? '',
          oldText: oldText ?? '',
          newText: text,
          uid,
        };
      });

    const latestMessage = updatedMessages
      .slice()
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))[0];
    if (
      latestMessage &&
      currentChat.lastMessage === latestMessage.oldText &&
      currentChat.lastMessageSenderId === latestMessage.uid
    ) {
      if (latestMessage.newText !== latestMessage.oldText) {
        addWrite(`${DOCUMENTS_RESOURCE}/${chat.path}`, {
          update: {
            name: `${DOCUMENTS_RESOURCE}/${chat.path}`,
            fields: encodeFields({ lastMessage: latestMessage.newText }),
          },
          updateMask: { fieldPaths: ['lastMessage'] },
          currentDocument: {
            updateTime: requireUpdateTime(currentChat, chat.path),
          },
        });
        changedChatPreviews.set(chat.path, latestMessage.newText);
      }
    }
  }

  if (writes.length > 500) {
    throw new Error(
      'The safe name refresh exceeded Firestore’s atomic write limit; no records were changed.'
    );
  }
  if (writes.length > 0) {
    await firestoreRequest(token, ':commit', { writes });
  }
  console.log(`Project: ${PROJECT_ID} / ${DATABASE_ID}`);
  console.log(
    `Profiles renamed: ${users.filter((user) => oldUsernames.get(user.uid) !== user.username).length}`
  );
  console.log(
    `Username mappings moved: ${users.filter((user) => oldUsernames.get(user.uid) !== user.username).length}`
  );
  console.log(
    `Seeded messages refreshed: ${
      writes.filter((write) => {
        const update = write.update as { name?: string } | undefined;
        return update?.name?.includes('/chats/') && update.name.includes('/messages/');
      }).length
    }`
  );
  console.log(`Chat previews refreshed: ${changedChatPreviews.size}`);
  console.log(`Total atomic updates: ${writes.length}`);
}

function parseArguments(args: string[]): {
  apply: boolean;
  currentUserUid?: string;
  refreshDemoNames: boolean;
  help: boolean;
} {
  let apply = false;
  let currentUserUid: string | undefined;
  let refreshDemoNames = false;
  let help = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--apply') {
      apply = true;
    } else if (argument === '--refresh-demo-names') {
      refreshDemoNames = true;
    } else if (argument === '--help' || argument === '-h') {
      help = true;
    } else if (argument === '--current-user-uid') {
      currentUserUid = args[index + 1];
      index += 1;
    } else if (argument.startsWith('--current-user-uid=')) {
      currentUserUid = argument.slice('--current-user-uid='.length);
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (currentUserUid && (!currentUserUid.trim() || currentUserUid.includes('/'))) {
    throw new Error('--current-user-uid must be a non-empty Firestore document ID.');
  }
  if (refreshDemoNames && currentUserUid) {
    throw new Error('--refresh-demo-names cannot be combined with --current-user-uid.');
  }
  return { apply, currentUserUid, refreshDemoNames, help };
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(
      'Usage: npm run seed:database [-- --apply] [--current-user-uid <uid> | --refresh-demo-names]'
    );
    console.log('Without --apply, the script prints a local-only dry run.');
    console.log('The optional UID adds demo conversations visible to that existing account.');
    console.log('--refresh-demo-names previews a guarded rename of the existing demo profiles.');
    return;
  }

  if (options.refreshDemoNames) {
    await refreshDemoNames(options.apply);
    return;
  }

  const users = makeUsers();
  const plan = createSeedPlan(
    users,
    options.currentUserUid ? { uid: options.currentUserUid, username: 'you' } : undefined
  );
  if (!options.apply) {
    reportDryRun(plan, Boolean(options.currentUserUid));
    return;
  }
  await applySeed(plan, options.currentUserUid);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Database seeding failed.');
  process.exitCode = 1;
});
