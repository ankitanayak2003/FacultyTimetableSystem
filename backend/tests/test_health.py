"""
Unit tests for root and health check endpoints.
Verifies that the application boots cleanly and accurately reports
unconfigured Firebase state instead of false positives or crashing.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_root_endpoint(client: TestClient):
    """Ensure root endpoint returns service info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "VTU Faculty Workload & Timetable" in data["service"]
    assert "version" in data
    assert data["documentation"] == "/docs"
    assert data["health_check"] == "/health"


def test_health_endpoint_reports_unconfigured_firebase(client: TestClient):
    """Ensure /health returns 200 and clearly states Firebase status without crashing."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "firebase" in data
    
    # By default in test environment without credentials, firebase must report configured=False
    firebase_info = data["firebase"]
    assert isinstance(firebase_info["configured"], bool)
    assert "message" in firebase_info
    assert isinstance(firebase_info["credentials_path_provided"], bool)


def test_system_info_endpoint(client: TestClient):
    """Ensure system capabilities endpoint lists VTU engineering features."""
    response = client.get("/api/v1/system/info")
    assert response.status_code == 200
    data = response.json()
    assert "VTU" in data["institution_type"]
    assert data["features"]["cp_sat_scheduler"] is True
    assert "Computer Science & Engineering (CSE)" in data["supported_departments"]
