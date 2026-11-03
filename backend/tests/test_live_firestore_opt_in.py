r"""
Opt-in live Cloud Firestore integration test.
SKIPPED BY DEFAULT to guarantee zero accidental writes to live or production collections.

To execute this test explicitly against your configured Firebase project:
$env:RUN_LIVE_FIRESTORE_TESTS="1"; .\venv\Scripts\python.exe -m pytest -k "test_live_firestore" -v
"""

import os
import pytest
from app.core.firebase import firebase_manager


@pytest.mark.skipif(
    not os.getenv("RUN_LIVE_FIRESTORE_TESTS"),
    reason="Opt-in live Firestore tests are disabled by default to protect live collections from unapproved writes.",
)
def test_live_firestore_connectivity_and_project_id():
    """Validates live Firestore connection without writing test records."""
    assert firebase_manager.initialize() is True
    db = firebase_manager.get_db()
    assert db is not None
    assert db.project is not None
    # Read-only check
    collections = list(db.collections())
    assert isinstance(collections, list)
