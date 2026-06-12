import * as ort from 'onnxruntime-web/wasm'
// Static import only — dynamic import() of this CJS module hangs the page:
// the emscripten Module exports a `then` property, so promise resolution
// treats the namespace as a thenable and Module.then self-resolves forever.
import * as cvModule from '@techstark/opencv-js'
import { fetchModel } from './modelCache'
import type { RuntimeStatus } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cv = ((cvModule as any).default ?? cvModule) as typeof cvModule

let ortSession: ort.InferenceSession | null = null
let cvReady = false
let status: RuntimeStatus = 'idle'

/**
 * Load ONNX session + wait for OpenCV.js WASM.
 * @param onProgress Called with 0–1 during model download; values past the
 *   download phase (OpenCV init) are not tracked here.
 */
export async function initRuntime(
  modelUrl: string,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  if (status === 'ready') return
  status = 'loading'
  try {
    // Single-threaded: no SharedArrayBuffer → no COEP required → CDN loads fine
    ort.env.wasm.numThreads = 1
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0/dist/'

    // Fetch model with progress tracking + IndexedDB cache
    const modelBuffer = await fetchModel(modelUrl, onProgress)

    // Load ONNX session from in-memory ArrayBuffer (no second download)
    ortSession = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: ['wasm'],
    })

    // Wait for OpenCV.js to be ready (it loads async via WASM)
    await waitForOpenCV()
    cvReady = true
    status = 'ready'
  } catch (e) {
    status = 'error'
    throw e
  }
}

function waitForOpenCV(): Promise<void> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = cv as any
    if (c?.Mat) {
      resolve()
      return
    }

    // Poll until the emscripten runtime finishes initializing.
    // (Do NOT use Module.then / onRuntimeInitialized — see import comment above.)
    let attempts = 0
    const poll = setInterval(() => {
      if (c?.Mat) {
        clearInterval(poll)
        resolve()
      } else if (++attempts > 150) {
        clearInterval(poll)
        reject(new Error('OpenCV.js failed to initialize after 15s'))
      }
    }, 100)
  })
}

export function getOrtSession(): ort.InferenceSession {
  if (!ortSession) throw new Error('Runtime not initialized — call initRuntime() first')
  return ortSession
}

export function getRuntimeStatus(): RuntimeStatus {
  return status
}

export function isCvReady(): boolean {
  return cvReady
}
