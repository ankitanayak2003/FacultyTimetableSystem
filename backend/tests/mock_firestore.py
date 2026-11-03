"""
In-memory Mock Firestore client for isolated unit and repository testing.
Supports atomic .create(), pagination .limit() / .offset(), .count() aggregations,
and batched writes.
"""

from typing import Dict, Any, List, Optional


class MockDocumentSnapshot:
    def __init__(self, doc_id: str, data: Dict[str, Any] = None):
        self.id = doc_id
        self._data = dict(data) if data is not None else None

    @property
    def exists(self) -> bool:
        return self._data is not None

    def to_dict(self) -> Dict[str, Any]:
        return dict(self._data) if self._data is not None else {}


class MockDocumentReference:
    def __init__(self, collection_data: Dict[str, Dict[str, Any]], doc_id: str):
        self._store = collection_data
        self.id = doc_id

    def get(self) -> MockDocumentSnapshot:
        data = self._store.get(self.id)
        return MockDocumentSnapshot(self.id, data)

    def create(self, data: Dict[str, Any]):
        """Atomic creation: fails if document already exists."""
        if self.id in self._store:
            # Emulates Google Cloud Firestore Conflict / AlreadyExists exception
            raise Exception(f"409 Document already exists: {self.id}")
        self._store[self.id] = dict(data)

    def set(self, data: Dict[str, Any], merge: bool = False):
        if merge and self.id in self._store:
            self._store[self.id].update(data)
        else:
            self._store[self.id] = dict(data)

    def update(self, updates: Dict[str, Any]):
        if self.id not in self._store:
            raise Exception(f"404 Document not found: {self.id}")
        self._store[self.id].update(updates)

    def delete(self):
        if self.id in self._store:
            del self._store[self.id]


class MockAggregationResult:
    def __init__(self, value: int):
        self.value = value


class MockAggregationQuery:
    def __init__(self, count_val: int):
        self._count = count_val

    def get(self):
        # Emulates Firestore aggregation query result: [[AggregationResult(value=N)]]
        return [[MockAggregationResult(self._count)]]


class MockCollectionReference:
    def __init__(
        self,
        collection_data: Dict[str, Dict[str, Any]],
        filters: List[tuple] = None,
        offset_val: int = 0,
        limit_val: Optional[int] = None,
    ):
        self._store = collection_data
        self._filters = filters or []
        self._offset_val = offset_val
        self._limit_val = limit_val

    def document(self, doc_id: str) -> MockDocumentReference:
        return MockDocumentReference(self._store, doc_id)

    def where(self, field: str, op: str, value: Any) -> "MockCollectionReference":
        new_filters = list(self._filters)
        new_filters.append((field, op, value))
        return MockCollectionReference(self._store, new_filters, self._offset_val, self._limit_val)

    def offset(self, offset: int) -> "MockCollectionReference":
        return MockCollectionReference(self._store, self._filters, offset, self._limit_val)

    def limit(self, limit: int) -> "MockCollectionReference":
        return MockCollectionReference(self._store, self._filters, self._offset_val, limit)

    def count(self) -> MockAggregationQuery:
        # Match filters
        matched = 0
        for doc_id, data in self._store.items():
            match = True
            for field, op, val in self._filters:
                if op == "==" and data.get(field) != val:
                    match = False
                    break
            if match:
                matched += 1
        return MockAggregationQuery(matched)

    def stream(self):
        matched_docs = []
        for doc_id, data in list(self._store.items()):
            match = True
            for field, op, val in self._filters:
                if op == "==" and data.get(field) != val:
                    match = False
                    break
            if match:
                matched_docs.append(MockDocumentSnapshot(doc_id, data))

        # Apply offset and limit
        if self._offset_val > 0:
            matched_docs = matched_docs[self._offset_val:]
        if self._limit_val is not None:
            matched_docs = matched_docs[:self._limit_val]

        for doc in matched_docs:
            yield doc


class MockBatch:
    """Emulates Firestore WriteBatch."""
    def __init__(self):
        self._operations = []

    def set(self, doc_ref: MockDocumentReference, data: Dict[str, Any]):
        self._operations.append(("set", doc_ref, data))

    def update(self, doc_ref: MockDocumentReference, data: Dict[str, Any]):
        self._operations.append(("update", doc_ref, data))

    def delete(self, doc_ref: MockDocumentReference):
        self._operations.append(("delete", doc_ref, None))

    def commit(self):
        for op, doc_ref, data in self._operations:
            if op == "delete":
                doc_ref.delete()
            elif op == "set":
                doc_ref.set(data)
            elif op == "update":
                doc_ref.update(data)
        self._operations.clear()


class MockFirestoreClient:
    """Mock client mimicking firebase_admin.firestore.Client."""
    def __init__(self):
        self._collections: Dict[str, Dict[str, Dict[str, Any]]] = {}

    def collection(self, name: str) -> MockCollectionReference:
        if name not in self._collections:
            self._collections[name] = {}
        return MockCollectionReference(self._collections[name])

    def batch(self) -> MockBatch:
        return MockBatch()

    def reset(self):
        self._collections.clear()
