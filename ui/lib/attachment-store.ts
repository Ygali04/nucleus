'use client';

const DB_NAME = 'nucleus-attachments';
const STORE_NAME = 'blobs';
const DB_VERSION = 1;

export interface AttachmentMeta {
  id: string;
  name: string;
  size: number;
  type: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function randomId(): string {
  return `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveAttachment(file: File): Promise<AttachmentMeta> {
  const id = randomId();
  const meta: AttachmentMeta = {
    id,
    name: file.name,
    size: file.size,
    type: file.type,
  };

  if (!isIndexedDbAvailable()) return meta;

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return meta;
}

export async function getAttachment(id: string): Promise<File | null> {
  if (!isIndexedDbAvailable()) return null;
  const db = await openDb();
  const file = await new Promise<File | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as File) ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return file;
}

export async function deleteAttachment(id: string): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
