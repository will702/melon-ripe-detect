const DB_NAME = 'melon-app'
const STORE = 'model-cache'
const MODEL_KEY = 'melon_ssd_v1'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function readCached(db: IDBDatabase): Promise<ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(MODEL_KEY)
    req.onsuccess = () => resolve((req.result as ArrayBuffer) ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function writeCache(db: IDBDatabase, buf: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).put(buf, MODEL_KEY)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/**
 * Fetch the model ArrayBuffer, using IndexedDB as a persistent cache.
 * `onProgress` is called with values 0–1 during the network download phase.
 * If served from cache, `onProgress` is called once with 1.
 */
export async function fetchModel(
  url: string,
  onProgress?: (fraction: number) => void,
): Promise<ArrayBuffer> {
  try {
    const db = await openDB()
    const cached = await readCached(db)
    if (cached) {
      onProgress?.(1)
      return cached
    }

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Model fetch failed: ${res.status}`)

    const contentLength = Number(res.headers.get('content-length') ?? 0)
    const reader = res.body!.getReader()
    const chunks: Uint8Array[] = []
    let received = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      received += value.length
      if (contentLength > 0) onProgress?.(received / contentLength)
    }

    const buffer = new ArrayBuffer(received)
    const view = new Uint8Array(buffer)
    let offset = 0
    for (const chunk of chunks) {
      view.set(chunk, offset)
      offset += chunk.length
    }

    // Cache for next visit — fire-and-forget, don't block on it
    writeCache(db, buffer).catch(() => {/* storage quota exceeded or private browsing */})

    return buffer
  } catch (err) {
    // If IndexedDB is unavailable (e.g. Firefox private mode), fall through to plain fetch
    if ((err as Error).message?.startsWith('Model fetch failed')) throw err
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Model fetch failed: ${res.status}`)
    return res.arrayBuffer()
  }
}
