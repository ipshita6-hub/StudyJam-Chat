# StudyJam — Expo + Firebase

StudyJam is a learning / study-group mobile app built with Expo (React Native) and Firebase (Authentication, Firestore, Storage). This repository contains the app source under the `app/` folder, an admin area under `app/admin`, UI components under `components/`, and service helpers under `services/`.

## Features

- Email/password + Google authentication
- Password reset flow
- Course creation, membership, and messaging (Firestore + subcollections)
- Announcements with admin controls
- Real-time listeners for courses, messages, announcements and user presence

## Prerequisites

- Node.js (14+ recommended)
- npm or yarn
- Expo CLI (optional): `npm install -g expo-cli` (or use `npx expo`)
- A Firebase project with Firestore, Authentication and Storage enabled

## Quick start

1. Install dependencies

```bash
npm install
```

2. Configure Firebase

- Create a Firebase project and enable Email/Password and Google sign-in (if needed).
- Create a Web App in Firebase and copy configuration values.
- Provide the Firebase environment variables used by `FirebaseConfig.ts` (example `.env` variables used by the project):

  - `EXPO_PUBLIC_FIREBASE_API_KEY`
  - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
  - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `EXPO_PUBLIC_FIREBASE_APP_ID`
  - `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)

Place these in your environment (for Expo, you can use a `.env` and a loader like `expo-constants` or set them in `app.json`/`eas.json` depending on your workflow). `FirebaseConfig.ts` reads them from `process.env` already.

3. Run the app

```bash
npx expo start
# or run for web
npx expo start --web
```

Open on device/emulator or in the browser.

## Important files & structure

- `app/` — main app pages (file-based routing)
- `app/admin` — admin pages (create-course, dashboard, user management)
- `components/` — UI components (buttons, inputs, cards)
- `components/ui` — shared UI primitives
- `services/` — application services (authService, realtimeService, socketService)
- `FirebaseConfig.ts` — Firebase initialization (reads env vars)

## Firebase indexes and known issues

### Composite index required (common)

If you see an error like:

```
FirebaseError: [code=failed-precondition]: The query requires an index. You can create it here: <console-url>
```

It means a Firestore composite index is required for a query that combines `where()` and `orderBy()` on different fields (for example: `where('isActive','==',true)` + `orderBy('createdAt','desc')`). Open the URL in the error message and click **Create index** — Firestore will build it automatically.

You can also declare the index in `firestore.indexes.json` (or `indexes.json`) for CI:

```json
{
  "indexes": [
    {
      "collectionGroup": "announcements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy indexes with the Firebase CLI:

```bash
npx firebase-tools deploy --only firestore:indexes
```

### BloomFilter error (local cache)

If you see logs like `@firebase/firestore: Firestore (12.6.0): BloomFilter error`, this comes from Firestore's local persistence (IndexedDB / SQLite on native). Remedies:

- For web: clear your app's IndexedDB (DevTools → Application → IndexedDB → delete Firestore DB) and reload.
- For Expo / React Native: uninstall the app or clear app storage for persistence reset.
- Ensure SDK is updated to the latest patch if the error persists.

## Development notes

- The password reset flow uses `authService.resetPassword(email)` which wraps `sendPasswordResetEmail` from Firebase Auth.
- Real-time listeners live in `services/realtimeService.ts` and return Firestore `Unsubscribe` functions — always call them when components unmount.

## Tests & linting

- This project includes ESLint configuration. Run linting with your usual commands (e.g. `npm run lint`) if present in `package.json`.

## Deployment

- Use Expo's build and publish flows or EAS if you target production mobile builds.
- Keep Firebase `indexes.json` in source control and deploy indexes as part of CI.

## Troubleshooting

- If a screen crashes on a Firebase call, check Metro / browser console for the full stack and the Firestore index URL.
- For auth issues, confirm the Firebase web client ID and OAuth setup for Google sign-in.

## Contributing

Open issues or PRs. Small, focused changes and tests are appreciated.

## References

- `FirebaseConfig.ts` — Firebase initialization and env var usage
- `services/authService.ts` — auth helpers (signIn, signUp, resetPassword)
- `services/realtimeService.ts` — Firestore listeners and data operations

---
If you want, I can also:

- Add a `.env.example` with variable names,
- Add the `firestore.indexes.json` file to the repo,
- Or generate a short developer guide for onboarding contributors.
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
