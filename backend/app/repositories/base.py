"""
Base repository pattern for Cloud Firestore collections.
Provides atomic document creation, query-level pagination, aggregation counting,
and field protection.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import logging
from app.core.firebase import firebase_manager
from app.core.exceptions import (
    EntityNotFoundError,
    DuplicateEntityError,
    DatabaseNotReadyError,
)

logger = logging.getLogger("faculty_timetable.repository")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class BaseFirestoreRepository:
    """Base class providing typed CRUD operations on a single Firestore collection."""

    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    @property
    def is_ready(self) -> bool:
        """Checks if Firestore client is initialized and ready."""
        return firebase_manager.is_initialized

    def _get_collection_ref(self):
        """Returns the Firestore collection reference or raises clean exception."""
        if not firebase_manager.is_initialized:
            raise DatabaseNotReadyError(
                f"Firestore is not initialized. Please verify credentials in backend/.env"
            )
        db = firebase_manager.get_db()
        return db.collection(self.collection_name)

    async def get_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single document by ID from Firestore, returning None if not found."""
        col = self._get_collection_ref()
        doc = col.document(doc_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None

    async def get_or_raise(self, doc_id: str) -> Dict[str, Any]:
        """Fetch a single document by ID, raising EntityNotFoundError if missing."""
        data = await self.get_by_id(doc_id)
        if not data:
            raise EntityNotFoundError(self.collection_name, doc_id)
        return data

    async def exists(self, doc_id: str) -> bool:
        """Check whether a document with the given ID exists."""
        col = self._get_collection_ref()
        doc = col.document(doc_id).get()
        return bool(doc.exists)

    async def create(self, doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a new document in Firestore using an ATOMIC create operation.
        Concurrent attempts to create the same document ID will fail atomically
        without overwriting existing documents.
        """
        col = self._get_collection_ref()
        doc_ref = col.document(doc_id)

        payload = dict(data)
        now = utc_now_iso()
        if "created_at" not in payload:
            payload["created_at"] = now
        payload["updated_at"] = now
        payload["id"] = doc_id

        # Use atomic create if available on the document reference
        try:
            if hasattr(doc_ref, "create"):
                doc_ref.create(payload)
            else:
                # Fallback for environments lacking .create(): check-then-set
                existing = doc_ref.get()
                if existing.exists:
                    raise DuplicateEntityError(self.collection_name, doc_id)
                doc_ref.set(payload)
        except Exception as exc:
            err_msg = str(exc).lower()
            if "already exists" in err_msg or "409" in err_msg or "conflict" in err_msg:
                raise DuplicateEntityError(self.collection_name, doc_id)
            raise

        return payload

    async def update(self, doc_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates an existing document in Firestore.
        Protects system fields (id, created_at) from being overwritten.
        Raises EntityNotFoundError if document does not exist.
        """
        col = self._get_collection_ref()
        doc_ref = col.document(doc_id)

        existing = doc_ref.get()
        if not existing.exists:
            raise EntityNotFoundError(self.collection_name, doc_id)

        # Protect immutable system fields
        payload = {k: v for k, v in updates.items() if v is not None}
        payload.pop("id", None)
        payload.pop("created_at", None)
        payload["updated_at"] = utc_now_iso()

        doc_ref.update(payload)

        # Return merged full document
        updated_doc = doc_ref.get().to_dict()
        updated_doc["id"] = doc_id
        return updated_doc

    async def delete(self, doc_id: str) -> bool:
        """
        Deletes a document from Firestore.
        Raises EntityNotFoundError if document does not exist.
        """
        col = self._get_collection_ref()
        doc_ref = col.document(doc_id)

        existing = doc_ref.get()
        if not existing.exists:
            raise EntityNotFoundError(self.collection_name, doc_id)

        doc_ref.delete()
        return True

    async def list_all(
        self,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Queries documents with optional equality filters and query-level pagination.
        """
        query = self._get_collection_ref()

        if filters:
            for field, val in filters.items():
                if val is not None:
                    query = query.where(field, "==", val)

        # Apply query-level offset and limit where supported
        if hasattr(query, "offset") and offset > 0:
            query = query.offset(offset)
        if hasattr(query, "limit") and limit > 0:
            query = query.limit(limit)

        stream = query.stream()
        results: List[Dict[str, Any]] = []

        for doc in stream:
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(data)

        return results

    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Counts documents using Firestore aggregation query where supported,
        avoiding reading entire documents into memory.
        """
        query = self._get_collection_ref()

        if filters:
            for field, val in filters.items():
                if val is not None:
                    query = query.where(field, "==", val)

        # Use native Firestore aggregation count if supported
        if hasattr(query, "count"):
            try:
                agg_result = query.count().get()
                # Returns [[AggregationResult(value=N)]]
                return agg_result[0][0].value
            except Exception as exc:
                logger.debug("Aggregation count query fallback: %s", str(exc))

        # Safe fallback
        docs = await self.list_all(filters=filters, limit=1000)
        return len(docs)
