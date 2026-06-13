// Storage helpers. (Export/import + all data CRUD now live in data/store.tsx,
// backed by Firestore.) Firestore keeps its own offline cache in IndexedDB;
// requesting persistence reduces the chance the browser evicts it.

export async function requestPersistence(): Promise<boolean> {
  if (navigator.storage?.persist) {
    if (await navigator.storage.persisted()) return true
    return navigator.storage.persist()
  }
  return false
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (navigator.storage?.estimate) {
    const e = await navigator.storage.estimate()
    return { usage: e.usage ?? 0, quota: e.quota ?? 0 }
  }
  return null
}
