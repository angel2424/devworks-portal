/**
 * Knowledge Base — Offline Cache (IndexedDB)
 *
 * Strategy:
 *  - When online: fetch from Supabase → sync to IDB
 *  - When offline: serve from IDB (read-only)
 *  - Pending mutations: queued in IDB, flushed on reconnect
 *
 * Uses raw IndexedDB API — no extra packages needed.
 */

export type KBFolder = {
  id: string;
  name: string;
  parent_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type KBArticle = {
  id: string;
  title: string;
  content: string | null;
  folder_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PendingUpdate = {
  id: string; // article id
  title: string;
  content: string;
  timestamp: number;
};

// ─── DB Bootstrap ─────────────────────────────────────────────────────────────

const DB_NAME = "devworks-kb";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("folders")) {
        db.createObjectStore("folders", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("articles")) {
        db.createObjectStore("articles", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending")) {
        // Pending article saves: keyed by article id (last write wins)
        db.createObjectStore("pending", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Generic Helpers ──────────────────────────────────────────────────────────

async function getAll<T>(store: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function putAll<T>(store: string, items: T[]): Promise<void> {
  if (items.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const s = tx.objectStore(store);
    items.forEach((item) => s.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteOne(store: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function putOne<T>(store: string, item: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function setMeta(key: string, value: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("meta", "readwrite");
    tx.objectStore("meta").put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getMeta(key: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction("meta", "readonly");
    const req = tx.objectStore("meta").get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => resolve(null);
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Replace all cached folders with fresh data from Supabase */
export async function syncFolders(folders: KBFolder[]): Promise<void> {
  // Clear existing, then put new batch
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("folders", "readwrite");
    tx.objectStore("folders").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await putAll("folders", folders);
  await setMeta("folders_synced_at", new Date().toISOString());
}

/** Replace all cached articles with fresh data from Supabase */
export async function syncArticles(articles: KBArticle[]): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("articles", "readwrite");
    tx.objectStore("articles").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await putAll("articles", articles);
  await setMeta("articles_synced_at", new Date().toISOString());
}

export async function getCachedFolders(): Promise<KBFolder[]> {
  return getAll<KBFolder>("folders");
}

export async function getCachedArticles(): Promise<KBArticle[]> {
  return getAll<KBArticle>("articles");
}

/** Update a single article in the cache (after edit) */
export async function updateCachedArticle(article: KBArticle): Promise<void> {
  await putOne("articles", article);
}

/** Add a folder to the cache (after creation) */
export async function addCachedFolder(folder: KBFolder): Promise<void> {
  await putOne("folders", folder);
}

/** Add an article to the cache (after creation) */
export async function addCachedArticle(article: KBArticle): Promise<void> {
  await putOne("articles", article);
}

export async function removeCachedFolder(id: string): Promise<void> {
  await deleteOne("folders", id);
}

export async function removeCachedArticle(id: string): Promise<void> {
  await deleteOne("articles", id);
}

// ─── Pending Saves Queue (offline edits) ──────────────────────────────────────

export async function queuePendingUpdate(update: PendingUpdate): Promise<void> {
  await putOne("pending", update);
}

export async function getPendingUpdates(): Promise<PendingUpdate[]> {
  return getAll<PendingUpdate>("pending");
}

export async function removePendingUpdate(id: string): Promise<void> {
  await deleteOne("pending", id);
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function getLastSynced(): Promise<string | null> {
  return getMeta("articles_synced_at");
}
