# Firestore demo data

The demo seeder targets Firebase project `ping-ce71c` and the `(default)`
Firestore database. It creates 100 clearly marked demo profiles, matching
username reservations, 32 one-to-one demo chats, and their nested messages.
Profiles are Firestore-only; the script does not create Firebase Authentication
accounts.

Run a local plan without contacting Firestore:

```sh
npm run seed:database
```

Apply the plan explicitly:

```sh
npm run seed:database -- --apply
```

The script requires an installed Firebase CLI login with Firestore read and
create access to the target project. It reuses that login in memory; do not
export or commit access tokens or service-account credentials. Writes use
create-only preconditions, existing records are checked before writing, and
conflicting records stop the run without being changed. A second run verifies
the seeded records and creates no duplicates.

The default plan creates conversations between demo users only. To also create
eight conversations that appear in a signed-in user's chat list, pass that
user's existing Firestore profile UID:

```sh
npm run seed:database -- --apply --current-user-uid YOUR_FIREBASE_AUTH_UID
```

The optional UID must belong to an existing `users/{uid}` profile. Never use a
different person's UID for demo conversations. Demo emails use the reserved
`.invalid` domain, and all demo records carry a `pingchat-demo-v1` marker.

To replace the original repetitive demo usernames with a more varied set while
preserving their UIDs, conversations, and message timestamps, inspect the plan
and then explicitly apply the name refresh:

```sh
npm run seed:database -- --refresh-demo-names
npm run seed:database -- --refresh-demo-names --apply
```

The refresh only proceeds when every profile, username mapping, chat, and
message it touches is verified as seeded demo data. It updates profile
usernames/emails, their username reservations, seeded message sender names and
text, and matching chat previews in one guarded Firestore commit.
