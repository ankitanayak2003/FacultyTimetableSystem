# Firebase Setup Guide (Console & Credentials)

This guide walks you step-by-step through configuring **Firebase Authentication** and **Cloud Firestore** for the Faculty Workload & Timetable Management System.

> [!IMPORTANT]
> **Safety Notice:**
> - Never commit your `serviceAccountKey.json` file or any API secrets to Git.
> - Never paste your Firebase Admin private key into the frontend code.
> - The application is designed to run in **unconfigured/safe mode** without crashing if credentials are not yet supplied.

---

## Step 1: Create a Firebase Project

1. Open your browser and go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Enter a project name, e.g., `vtu-timetable-system` (Firebase will generate a unique Project ID like `vtu-timetable-system-xxxx`).
4. (Optional) Disable Google Analytics for this development project if not needed.
5. Click **Create project** and wait for provisioning to finish.

---

## Step 2: Enable Firebase Authentication

1. In the left navigation menu of your Firebase Console, click **Build** -> **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Enable the first toggle: **Email/Password**. Leave "Email link (passwordless sign-in)" disabled.
5. Click **Save**.

---

## Step 3: Enable Cloud Firestore Database

1. In the left navigation menu, click **Build** -> **Firestore Database**.
2. Click **Create database**.
3. Choose a database location closest to your users (for India/VTU colleges, `asia-south1 (Mumbai)` is recommended).
4. For security rules, select **Start in production mode** (all reads/writes locked down by default).
5. Click **Create**.

### Recommended Initial Security Rules
In the **Rules** tab of Firestore, configure rules so only authenticated users with valid tokens can read or write:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access documents
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Step 4: Generate Firebase Admin SDK Private Key (for Backend)

1. In the Firebase Console, click the **Gear icon (Project settings)** in the top-left navigation.
2. Select the **Service accounts** tab.
3. Make sure **Firebase Admin SDK** is selected, with the **Python** snippet selected.
4. Click **Generate new private key**.
5. A confirmation dialog will appear. Click **Generate key**.
6. A JSON file will download to your computer.
7. Rename this file to `serviceAccountKey.json`.
8. Place this file inside the backend directory under a dedicated folder:
   ```
   FacultyTimetableSystem/backend/secrets/serviceAccountKey.json
   ```
   *(Note: This folder and filename pattern are already included in `.gitignore` to prevent accidental commits).*

---

## Step 5: Configure Backend Environment Variables

1. Inside `FacultyTimetableSystem/backend/`, copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Open `backend/.env` and update the following settings:
   ```ini
   FIREBASE_PROJECT_ID=your-actual-firebase-project-id
   FIREBASE_CREDENTIALS_PATH=secrets/serviceAccountKey.json
   ```
3. Restart or reload your FastAPI backend server. The `/health` endpoint will now show:
   ```json
   {
     "status": "healthy",
     "firebase_connected": true,
     "firebase_project_id": "your-actual-firebase-project-id"
   }
   ```

---

## Step 6: Configure Frontend Web App (Optional at this stage)

When ready to connect frontend authentication:
1. In Firebase Console -> **Project settings** -> **General** tab.
2. Scroll to **Your apps** and click the **Web icon (`</>`)**.
3. Register the web app (e.g., `vtu-timetable-web`).
4. Copy the `firebaseConfig` keys into `frontend/.env`:
   ```ini
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=vtu-timetable-system.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=vtu-timetable-system
   VITE_FIREBASE_STORAGE_BUCKET=vtu-timetable-system.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
