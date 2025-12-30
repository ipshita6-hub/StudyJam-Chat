# 📚 StudyJam

A modern mobile study group app built with Expo (React Native) and Firebase. Create courses, join study groups, chat in real-time, and stay updated with announcements.

![React Native](https://img.shields.io/badge/React_Native-0.81.5-blue?logo=react)
![Expo](https://img.shields.io/badge/Expo-54-black?logo=expo)
![Firebase](https://img.shields.io/badge/Firebase-12.6-orange?logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)

## ✨ Features

### For Students
- 🔐 Email/password & Google authentication
- 📖 Browse and join courses
- 💬 Real-time course chat
- 📢 View announcements
- 👤 Profile management
- 🔔 Notifications

### For Admins
- 📊 Dashboard with platform statistics
- ➕ Create and manage courses
- ✅ Approve/reject join requests
- 📣 Post announcements
- 👥 User management
- 🗑️ Remove users from courses

## 🛠️ Tech Stack

- **Frontend:** React Native, Expo Router (file-based routing)
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Real-time:** Firestore listeners, Socket.io
- **UI:** Custom components with Ionicons

## 📁 Project Structure

```
studyjam/
├── app/                    # App screens (file-based routing)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── home.tsx       # Home dashboard
│   │   ├── courses.tsx    # My courses
│   │   ├── chats.tsx      # Chat list
│   │   └── profile.tsx    # User profile
│   ├── admin/             # Admin screens
│   │   ├── dashboard.tsx  # Admin dashboard
│   │   ├── create-course.tsx
│   │   ├── join-requests.tsx
│   │   └── ...
│   ├── login.tsx
│   ├── signup.tsx
│   └── ...
├── components/            # Reusable UI components
├── services/              # Business logic
│   ├── authService.ts     # Authentication
│   └── realtimeService.ts # Firestore operations
├── constants/             # App constants & colors
└── FirebaseConfig.ts      # Firebase initialization
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli` (optional, can use `npx expo`)
- Firebase project with Firestore & Authentication enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/studyjam.git
   cd studyjam
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the app**
   ```bash
   npx expo start
   ```

   Then:
   - Press `w` for web
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

## 🔥 Firebase Setup

### Enable Authentication
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Email/Password
3. Enable Google (optional)

### Firestore Collections

The app uses these collections:
- `users` - User profiles
- `courses` - Study groups/courses
- `courses/{id}/messages` - Chat messages
- `announcements` - Platform announcements
- `joinRequests` - Course join requests

### Firestore Rules

Deploy the included `firestore.rules` or use:
```bash
firebase deploy --only firestore:rules
```

### Composite Indexes

If you see index errors, click the link in the error message or create indexes for:
- `announcements`: `isActive` (ASC) + `createdAt` (DESC)
- `joinRequests`: `status` (ASC) + `createdAt` (DESC)

## 📱 Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm run lint       # Run ESLint
npm run build      # Export for web
```

## 🔧 Troubleshooting

### Firestore Index Error
```
FirebaseError: The query requires an index
```
Click the URL in the error to create the required index automatically.

### BloomFilter Error
Clear app data or reinstall the app to reset local Firestore cache.

### Google Sign-In Issues
Ensure your OAuth client ID is configured correctly in Firebase Console and `app.json`.

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request
