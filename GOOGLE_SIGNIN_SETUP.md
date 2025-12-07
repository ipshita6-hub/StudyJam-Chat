# Google Sign-In Setup Guide

## What's Been Configured

### 1. Dependencies Installed
- `expo-auth-session` - For OAuth authentication
- `expo-crypto` - For secure random string generation
- `expo-web-browser` - For web browser integration

### 2. Firebase Configuration
- Updated `FirebaseConfig.ts` with Google Auth provider
- Added environment variable for Web Client ID

### 3. Auth Service
- Added `signInWithGoogle()` method in `services/authService.ts`
- Handles Google credential authentication with Firebase

### 4. Login & Signup Pages
- Integrated Google Sign-In button
- Added loading states
- Proper error handling with alerts
- Auto-redirect to home on successful authentication

## Environment Variables Required

Make sure your `.ENV` file has:
```
EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID=your-web-client-id
```

## Firebase Console Setup

### Step 1: Enable Google Sign-In
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `studyjam2-fbd76`
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Google** provider
5. Enable it and save

### Step 2: Get Web Client ID
Your Web Client ID is already in the `.ENV` file:
```
425970583866-dcpph99do1ldb7bp5ts9782d1knfbu3v.apps.googleusercontent.com
```

### Step 3: Configure OAuth Consent Screen (if needed)
1. Go to Google Cloud Console
2. Select your project
3. Navigate to **APIs & Services** > **OAuth consent screen**
4. Fill in required information

## Testing

### On Web
- Google Sign-In will open a popup window
- User selects their Google account
- Redirects back to your app

### On Mobile (Expo Go)
- Opens the device's browser
- User authenticates with Google
- Returns to the app

### On Production Build
- Native Google Sign-In experience
- Faster and more seamless

## How It Works

1. User clicks "Continue with Google"
2. `promptAsync()` opens Google OAuth flow
3. User authenticates and grants permissions
4. Google returns an ID token
5. Token is sent to Firebase via `signInWithCredential()`
6. Firebase creates/signs in the user
7. App redirects to home screen

## Features Implemented

✅ Email/Password Sign Up
✅ Email/Password Sign In
✅ Google Sign-In (Login & Signup)
✅ Password Reset
✅ Loading states
✅ Error handling
✅ Auto-redirect on success
✅ Session persistence

## Next Steps

To fully test Google Sign-In:
1. Run `npm start` or `expo start`
2. Open in Expo Go or web browser
3. Click "Continue with Google"
4. Sign in with your Google account
