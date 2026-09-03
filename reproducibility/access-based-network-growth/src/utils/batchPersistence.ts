import type { BatchResult, SavedBatchResult } from '../types/model';

const DB_NAME = 'general-attachment-lab';
const STORE_NAME = 'batch-results';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBatchResult(label: string, result: BatchResult): Promise<SavedBatchResult> {
  const db = await openDb();
  const record: SavedBatchResult = {
    id: `batch-${Date.now()}`,
    createdAt: new Date().toISOString(),
    label,
    result,
  };

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
  return record;
}

export async function loadBatchResults(): Promise<SavedBatchResult[]> {
  const db = await openDb();
  const results = await new Promise<SavedBatchResult[]>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as SavedBatchResult[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
