"""
Firebase Admin SDK and Cloud Firestore Initialization Module.

Safely handles Firebase configuration without crashing if credentials are
missing or invalid, and reports true connection status to health checks.
"""

import logging
from typing import Optional, Dict, Any
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings

logger = logging.getLogger("faculty_timetable.firebase")


class FirebaseManager:
    """Manages Firebase Admin SDK and Cloud Firestore client lifecycle."""

    def __init__(self):
        self._app: Optional[firebase_admin.App] = None
        self._db: Optional[firestore.Client] = None
        self._is_initialized: bool = False
        self._status_message: str = "Uninitialized"
        self._project_id: Optional[str] = None

    @property
    def is_initialized(self) -> bool:
        """Returns True only if Firebase Admin SDK and Firestore client are active."""
        return self._is_initialized

    @property
    def status_message(self) -> str:
        """Human-readable explanation of the current Firebase connection status."""
        return self._status_message

    @property
    def project_id(self) -> Optional[str]:
        return self._project_id

    def initialize(self) -> bool:
        """
        Attempts to initialize Firebase Admin SDK using service account credentials.
        Never crashes the application if credentials are not configured or invalid.
        """
        if self._is_initialized:
            return True

        cred_path = settings.resolved_firebase_credentials_path

        # Step 1: Check if credentials path is configured
        if not settings.FIREBASE_CREDENTIALS_PATH:
            self._is_initialized = False
            self._status_message = (
                "Firebase is not configured: FIREBASE_CREDENTIALS_PATH is missing in backend/.env. "
                "See docs/FIREBASE_SETUP.md for instructions."
            )
            logger.warning(self._status_message)
            return False

        # Step 2: Check if credentials file actually exists
        if cred_path is None or not cred_path.is_file():
            self._is_initialized = False
            self._status_message = (
                f"Firebase credentials file not found at: '{settings.FIREBASE_CREDENTIALS_PATH}'. "
                "Please place your serviceAccountKey.json file in the configured path."
            )
            logger.warning(self._status_message)
            return False

        # Step 3: Attempt initialization with provided credentials
        try:
            logger.info("Attempting Firebase Admin SDK initialization from %s", cred_path)
            cred = credentials.Certificate(str(cred_path))
            
            # Use project ID if specified, or let the certificate provide it
            options: Dict[str, Any] = {}
            if settings.FIREBASE_PROJECT_ID:
                options["projectId"] = settings.FIREBASE_PROJECT_ID

            # Initialize Firebase App
            if not firebase_admin._apps:
                self._app = firebase_admin.initialize_app(cred, options=options or None)
            else:
                self._app = firebase_admin.get_app()

            # Initialize Firestore Client
            self._db = firestore.client(app=self._app)
            self._is_initialized = True
            self._project_id = (
                settings.FIREBASE_PROJECT_ID 
                or (self._app.project_id if hasattr(self._app, "project_id") else "Configured")
            )
            self._status_message = f"Firebase Firestore successfully connected (Project: {self._project_id})"
            logger.info(self._status_message)
            return True

        except Exception as exc:
            self._is_initialized = False
            self._db = None
            self._status_message = f"Firebase initialization failed: {str(exc)}"
            logger.error(self._status_message, exc_info=True)
            return False

    def get_db(self) -> firestore.Client:
        """
        Retrieves the Firestore client instance.
        Raises RuntimeError if accessed before successful configuration.
        """
        if not self._is_initialized or self._db is None:
            raise RuntimeError(
                f"Cannot access Cloud Firestore: {self._status_message}. "
                "Configure valid credentials in backend/.env to enable database operations."
            )
        return self._db

    def get_status_info(self) -> Dict[str, Any]:
        """Provides an honest status report for system health checks."""
        return {
            "configured": self._is_initialized,
            "project_id": self._project_id if self._is_initialized else None,
            "message": self._status_message,
            "credentials_path_provided": bool(settings.FIREBASE_CREDENTIALS_PATH),
        }


# Singleton manager instance
firebase_manager = FirebaseManager()
