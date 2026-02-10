# Firebase Security Rules (TESTING ONLY)

Copy these rules to your Firebase Console to allow testing:

**Go to:** Firebase Console → Firestore Database → Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ⚠️ TESTING ONLY - Allow all reads and writes
    match /{document=**} {
      allow read, write: if true;
    }
    
  }
}
```

**Click "Publish"**

---

## Production Rules (After Testing)

Replace with these secure rules before going live:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user is owner
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Challenges - Public read, admin write only
    match /challenges/{challengeId} {
      allow read: if true;
      allow write: if false; // Only via Cloud Functions
    }
    
    // Challenge Participants - Users can join/update their own
    match /challenge_participants/{participantId} {
      allow read: if true;
      allow create: if isSignedIn() && 
                      request.resource.data.userId == request.auth.uid;
      allow update: if isSignedIn() && 
                      resource.data.userId == request.auth.uid;
      allow delete: if false;
    }
    
    // Activities - Users create their own, all can read
    match /activities/{activityId} {
      allow read: if true;
      allow create: if isSignedIn() && 
                      request.resource.data.userId == request.auth.uid;
      allow update: if isSignedIn() && 
                      resource.data.userId == request.auth.uid;
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Users - Read all, update own only
    match /users/{userId} {
      allow read: if true;
      allow update: if isOwner(userId);
      allow delete: if false;
    }
    
    // Friendships - Create/delete own friendships
    match /friendships/{friendshipId} {
      allow read: if true;
      allow create: if isSignedIn() && 
                      (request.resource.data.userId1 == request.auth.uid ||
                       request.resource.data.userId2 == request.auth.uid);
      allow delete: if isSignedIn() && 
                      (resource.data.userId1 == request.auth.uid ||
                       resource.data.userId2 == request.auth.uid);
    }
    
  }
}
```
