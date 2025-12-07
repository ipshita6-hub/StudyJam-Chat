# Firebase Cloud Functions Setup for User Deletion

## Why Cloud Functions?

Firebase Authentication users can only be deleted using the Firebase Admin SDK, which requires server-side code. Cloud Functions provide a secure way to delete users from both Firestore and Firebase Authentication.

## Setup Instructions

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Cloud Functions

In your project root:

```bash
firebase init functions
```

Select:
- Use an existing project (select your StudyJam project)
- JavaScript or TypeScript (your choice)
- Install dependencies with npm: Yes

### 4. Install Admin SDK

```bash
cd functions
npm install firebase-admin
cd ..
```

### 5. Create the Delete User Function

Edit `functions/index.js` (or `functions/src/index.ts` for TypeScript):

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Check if the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  // Check if caller is admin
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users');
  }

  const { userId } = data;

  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }

  try {
    // Delete user from Firestore
    await admin.firestore().collection('users').doc(userId).delete();

    // Remove user from all course enrollments
    const coursesSnapshot = await admin.firestore().collection('courses').get();
    const deletePromises = [];
    
    for (const courseDoc of coursesSnapshot.docs) {
      const enrollmentsQuery = await admin.firestore()
        .collection('courses')
        .doc(courseDoc.id)
        .collection('enrollments')
        .where('userId', '==', userId)
        .get();
      
      enrollmentsQuery.forEach((enrollmentDoc) => {
        deletePromises.push(enrollmentDoc.ref.delete());
      });
    }
    
    await Promise.all(deletePromises);

    // Delete user from Firebase Authentication
    await admin.auth().deleteUser(userId);

    return { success: true, message: 'User deleted successfully from Auth and Firestore' };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### 6. Deploy the Function

```bash
firebase deploy --only functions
```

### 7. Update Your React Native App

Install the Firebase Functions package:

```bash
npm install firebase/functions
```

Update `FirebaseConfig.ts`:

```typescript
import { getFunctions } from 'firebase/functions';

// ... existing code ...

const functions = getFunctions(app);

export { app, auth, db, storage, functions };
```

Update `remove-users.tsx` to call the Cloud Function:

```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../FirebaseConfig';

// In confirmRemoveUser function:
const confirmRemoveUser = async () => {
  if (!selectedUser) return;

  try {
    setDeleting(true);
    
    // Call Cloud Function to delete user
    const deleteUserFunction = httpsCallable(functions, 'deleteUser');
    const result = await deleteUserFunction({ userId: selectedUser.id });
    
    // Update local state
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setModalVisible(false);
    setSelectedUser(null);
    
    Alert.alert('Success', 'User has been completely removed from the platform.');
  } catch (error: any) {
    console.error('Error removing user:', error);
    Alert.alert('Error', error.message || 'Failed to remove user. Please try again.');
  } finally {
    setDeleting(false);
  }
};
```

## Alternative: Manual Deletion from Firebase Console

If you don't want to set up Cloud Functions, you can manually delete users:

1. Go to Firebase Console → Authentication
2. Find the user by email
3. Click the three dots menu → Delete account

This is fine for occasional deletions but not scalable for production.

## Cost

Firebase Cloud Functions have a free tier:
- 2M invocations/month
- 400,000 GB-seconds, 200,000 GHz-seconds of compute time

For a small app, this should be sufficient.
