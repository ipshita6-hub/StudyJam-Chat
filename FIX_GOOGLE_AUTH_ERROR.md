# Fix Google Auth Module Error

## The Problem
The error "Unable to resolve module .../expo-auth-session/providers/google.js" occurs because:
1. Metro bundler cache is outdated
2. The app needs to be restarted after installing new packages

## Solution - Run These Commands

### Step 1: Stop the current Expo server
Press `Ctrl+C` in your terminal to stop the running server

### Step 2: Clear Metro bundler cache
```bash
npx expo start -c
```

OR

```bash
npm start -- --clear
```

### Step 3: If that doesn't work, try a full clean
```bash
# Delete node_modules and reinstall
rmdir /s /q node_modules
npm install

# Clear cache and start
npx expo start -c
```

## Alternative: Simplify the Code (Remove Google Auth for now)

If you want to test the app without Google Sign-In first, I can temporarily remove the Google auth code and you can add it back later after proper setup.

Would you like me to:
1. Wait for you to restart the server with cache cleared?
2. Temporarily remove Google auth code so you can test email/password login?
