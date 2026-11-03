"""
Domain exceptions for database, relationship validation, and authorization.
"""

class DatabaseNotReadyError(RuntimeError):
    """Raised when Firestore operations are attempted before initialization."""
    pass


class EntityNotFoundError(Exception):
    """Raised when a requested Firestore document does not exist."""
    def __init__(self, entity_name: str, entity_id: str):
        self.entity_name = entity_name
        self.entity_id = entity_id
        super().__init__(f"{entity_name} with ID '{entity_id}' was not found.")


class DuplicateEntityError(Exception):
    """Raised when attempting to create a document with an ID that already exists."""
    def __init__(self, entity_name: str, entity_id: str):
        self.entity_name = entity_name
        self.entity_id = entity_id
        super().__init__(f"{entity_name} with ID '{entity_id}' already exists.")


class RelationshipValidationError(Exception):
    """Raised when a foreign reference (faculty_id, subject_id, room_id) is invalid."""
    def __init__(self, message: str):
        super().__init__(message)


class AuthorizationError(Exception):
    """Raised when caller lacks required permissions."""
    def __init__(self, message: str = "Insufficient permissions for this operation."):
        super().__init__(message)
