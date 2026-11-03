"""Health check response schema."""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class FirebaseStatusSchema(BaseModel):
    configured: bool = Field(description="True if Firebase credentials are valid and Firestore client is active")
    project_id: Optional[str] = Field(default=None, description="Active Firebase project ID")
    message: str = Field(description="Honest status explanation")
    credentials_path_provided: bool = Field(description="Whether a credentials path is set in settings")


class HealthResponse(BaseModel):
    status: str = Field(description="'healthy' or 'unconfigured'", json_schema_extra={"example": "healthy"})
    app_name: str
    version: str
    environment: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    firebase: FirebaseStatusSchema
    solver_available: bool = Field(description="True if Google OR-Tools CP-SAT is available in the environment")
