# Faculty Workload & Timetable Management System
### Visvesvaraya Technological University (VTU) Engineering College Portal

A modern, automated academic scheduling and faculty workload distribution system designed for VTU engineering colleges. Built with **React (Vite)**, **Python (FastAPI)**, **Google Cloud Firestore**, and **Google OR-Tools CP-SAT**.

---

## 📌 Project Architecture & Highlights

- **Frontend**: React 18 with Vite, modern glassmorphic administration UI, and Lucide icons.
- **Backend API**: Python FastAPI with Pydantic v2 schemas and modular clean architecture.
- **Database**: Google Cloud Firestore (NoSQL document store).
- **Authentication**: Firebase Authentication (Role-based access).
- **Optimization Solver**: Google OR-Tools CP-SAT for conflict-free room, faculty, and lab allocation.
- **AI Scheduling Assistant (Optional)**: Google Gemini API for natural-language scheduling assistance.

---

## 📂 Project Directory Structure

```text
FacultyTimetableSystem/
├── .gitignore                   # Excludes venv, node_modules, .env, and service account keys
├── README.md                    # Setup guide and PowerShell instructions
├── docs/
│   ├── ARCHITECTURE.md          # VTU system architecture and data model specifications
│   └── FIREBASE_SETUP.md        # Step-by-step beginner guide to Firebase Console configuration
├── frontend/
│   ├── index.html               # Semantic HTML entry with Google Fonts (Outfit & Inter)
│   ├── package.json             # React, Vite, and Lucide icon dependencies
│   ├── vite.config.js           # Vite dev server with /api and /health reverse proxies
│   ├── .env.example             # Safe placeholder template for Firebase Web SDK
│   └── src/
│       ├── main.jsx             # React application bootstrap
│       ├── App.jsx              # Collegiate administration landing & live diagnostics dashboard
│       ├── App.css              # Glassmorphic, responsive administration styles
│       ├── index.css            # CSS reset, typography, and theme tokens
│       └── components/
│           ├── Navbar.jsx       # Header with academic term and coordinator badges
│           └── StatusBadge.jsx  # Live status indicator component
└── backend/
    ├── requirements.txt         # FastAPI, Uvicorn, Firebase Admin, OR-Tools, Pytest
    ├── .env.example             # Safe placeholder template for backend variables
    ├── app/
    │   ├── __init__.py
    │   ├── main.py              # FastAPI app instance, CORS middleware, and lifecycle
    │   ├── core/
    │   │   ├── config.py        # Settings loaded via pydantic-settings
    │   │   └── firebase.py      # Safe Firebase Admin initialization (non-crashing)
    │   ├── models/
    │   │   └── entities.py      # Firestore collection models (Faculty, Subjects, Rooms, Timetables)
    │   ├── schemas/
    │   │   └── health.py        # Health and diagnostics schemas
    │   ├── repositories/
    │   │   └── base.py          # Guarded Firestore repository base class
    │   └── routers/
    │       ├── health.py        # /health diagnostic endpoint
    │       └── system.py        # /api/v1/system/info endpoint
    └── tests/
        └── test_health.py       # Pytest tests for root and health checks
```

---

## 🛡️ Critical Safety Rules

1. **Never commit secrets**: All `.env` files, `.key` files, and `serviceAccountKey*.json` files are ignored by `.gitignore`.
2. **Never expose Admin SDK keys in the frontend**: Firebase Admin private keys belong **only** in `backend/secrets/` and must never be imported in React.
3. **Safe Startup Mode**: If Firebase is not yet configured, the backend starts normally and reports `unconfigured_database` on `/health` instead of crashing or falsely claiming it is connected.
4. **No unrestricted Firestore rules**: Always start Firestore in production mode.
5. **No dummy coordinator accounts**: Coordinator accounts are created securely through Firebase Authentication.

---

## 🚀 Step-by-Step Setup Instructions (Windows PowerShell)

Open **PowerShell** and navigate to your project directory:
```powershell
cd C:\Users\ankita\Desktop\FacultyTimetableSystem
```

---

### Step 1: Backend Setup (Python FastAPI)

#### 1.1 Create and activate a Python Virtual Environment
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(If PowerShell shows an execution policy error, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` and re-run the activate command).*

#### 1.2 Install Backend Dependencies
```powershell
pip install -r requirements.txt
```

#### 1.3 Create Local Environment File
```powershell
Copy-Item .env.example .env
```

#### 1.4 Run Backend Unit Tests
```powershell
pytest
```

#### 1.5 Start the FastAPI Development Server
```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Health Diagnostic: `http://127.0.0.1:8000/health`

---

### Step 2: Frontend Setup (React & Vite)

Open a **new PowerShell terminal window**:

#### 2.1 Navigate to frontend folder
```powershell
cd C:\Users\ankita\Desktop\FacultyTimetableSystem\frontend
```

#### 2.2 Install Frontend Dependencies
```powershell
npm install
```

#### 2.3 Start the Vite Development Server
```powershell
npm run dev
```
- Frontend UI: `http://localhost:5173`

The frontend dashboard will automatically communicate with the running FastAPI backend and display live diagnostic statuses for the API server, Firebase, and OR-Tools CP-SAT.

---

### Step 3: Firebase Console Setup (Manual Action Required)

When you are ready to link your actual Firebase Cloud Firestore database:

1. Open the [Firebase Console](https://console.firebase.google.com/) and create your project.
2. Enable **Authentication** (Email/Password).
3. Enable **Cloud Firestore** in **Production Mode**.
4. In **Project Settings** -> **Service accounts** -> **Generate new private key**.
5. Save the downloaded JSON file as:
   ```
   FacultyTimetableSystem/backend/secrets/serviceAccountKey.json
   ```
6. In `backend/.env`, set:
   ```ini
   FIREBASE_PROJECT_ID=your-actual-firebase-project-id
   FIREBASE_CREDENTIALS_PATH=secrets/serviceAccountKey.json
   ```
7. Restart your FastAPI server. The `/health` endpoint and frontend dashboard will turn green with **Connected** status.

*For complete details, see [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md).*
