import * as ort from 'onnxruntime-web/wasm'
import { getOrtSession } from './runtime'
import { findSample } from './segment'
import { findBlob } from './sick'
import { extractRGB } from './rgb'
import { fuzzyRipeIndex } from './fuzzy'
import { drawToCanvas, getImageData } from '../lib/canvas'
import type { DetectionResult, BBox } from './types'

const INPUT_W = 480
const INPUT_H = 360
const SCORE_THRESHOLD = 0.7
const MELON_CLASS_ID = 1

/**
 * Run the full melon ripeness detection pipeline on a canvas-compatible image source.
 *
 * Pipeline:
 * 1. Resize to 480×360, extract RGB (RGBA→RGB for model input)
 * 2. Run ONNX SSD model → detect melon bbox
 * 3. Crop melon region → HSV segmentation → center ROI
 * 4. Normalized RGB → fuzzy inference → ripeness index
 * 5. Blob detection → sick flag
 * 6. Return structured DetectionResult
 */
export async function detectMelon(
  source: CanvasImageSource,
): Promise<DetectionResult> {
  const session = getOrtSession()

  // Step 1: Draw to 480×360 canvas
  const resized = drawToCanvas(source, INPUT_W, INPUT_H)
  const ctx = resized.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, INPUT_W, INPUT_H)

  // Extract RGB tensor (uint8, [1, 360, 480, 3]) — strip alpha
  const rgbData = new Uint8Array(1 * INPUT_H * INPUT_W * 3)
  for (let i = 0, j = 0; i < imageData.data.length; i += 4) {
    rgbData[j++] = imageData.data[i]       // R
    rgbData[j++] = imageData.data[i + 1]   // G
    rgbData[j++] = imageData.data[i + 2]   // B
  }

  // Step 2: Run ONNX model
  const inputTensor = new ort.Tensor('uint8', rgbData, [1, INPUT_H, INPUT_W, 3])
  const feeds = { 'image_tensor:0': inputTensor }
  const results = await session.run(feeds)

  // Output shapes: boxes [1,N,4] flat→[N*4], scores [1,N] flat→[N], classes [1,N] flat→[N]
  // N=2 for this model. Indexing as 1D flat arrays is correct per ONNX tensor data layout.
  const boxes   = results['detection_boxes:0'].data as Float32Array   // [1, N, 4]
  const scores  = results['detection_scores:0'].data as Float32Array  // [1, N]
  const classes = results['detection_classes:0'].data as Float32Array // [1, N]
  const numDets = results['num_detections:0'].data as Float32Array    // [1]

  const N = Math.round(numDets[0])

  // Find first valid melon detection (score > 0.7, class === 1)
  let bbox: BBox | undefined
  for (let i = 0; i < N; i++) {
    if (classes[i] === MELON_CLASS_ID && scores[i] > SCORE_THRESHOLD) {
      // boxes are [ymin, xmin, ymax, xmax] normalized
      const ymin = boxes[i * 4 + 0]
      const xmin = boxes[i * 4 + 1]
      const ymax = boxes[i * 4 + 2]
      const xmax = boxes[i * 4 + 3]
      bbox = {
        left:   xmin * INPUT_W,
        top:    ymin * INPUT_H,
        right:  xmax * INPUT_W,
        bottom: ymax * INPUT_H,
        score:  scores[i],
      }
      break
    }
  }

  if (!bbox) {
    return { melonFound: false }
  }

  // Step 3: Crop melon bbox
  const cropW = Math.max(1, Math.round(bbox.right  - bbox.left))
  const cropH = Math.max(1, Math.round(bbox.bottom - bbox.top))
  // Guard against degenerate detections
  if (cropW < 10 || cropH < 10) {
    return { melonFound: false }
  }
  const cropCanvas = document.createElement('canvas')
  cropCanvas.width  = cropW
  cropCanvas.height = cropH
  const cropCtx = cropCanvas.getContext('2d')!
  cropCtx.drawImage(
    resized,
    Math.round(bbox.left), Math.round(bbox.top), cropW, cropH,
    0, 0, cropW, cropH,
  )

  // Convert crop RGBA → BGRA for OpenCV.js (segment.ts expects BGR channel order)
  // Canvas gives RGBA; swap R and B to produce BGRA as OpenCV expects
  const cropImageData = cropCtx.getImageData(0, 0, cropW, cropH)
  const bgraData = new Uint8ClampedArray(cropImageData.data.length)
  for (let i = 0; i < cropImageData.data.length; i += 4) {
    bgraData[i]     = cropImageData.data[i + 2] // B (was R)
    bgraData[i + 1] = cropImageData.data[i + 1] // G
    bgraData[i + 2] = cropImageData.data[i]     // R (was B)
    bgraData[i + 3] = cropImageData.data[i + 3] // A
  }
  const bgraImageData = new ImageData(bgraData, cropW, cropH)

  // Step 4: Segmentation → masked image + center ROI
  const { maskedResult, roiSample } = findSample(bgraImageData)

  // Step 5: RGB extraction + fuzzy inference
  const rgb = extractRGB(roiSample)
  const ripeness = fuzzyRipeIndex(rgb)

  // Step 6: Blob detection (sick flag)
  const blobCount = findBlob(roiSample)
  const sick = blobCount > 20

  // Step 7: Draw bbox overlay on the resized canvas
  const overlayCanvas = drawToCanvas(resized, INPUT_W, INPUT_H)
  const overlayCtx = overlayCanvas.getContext('2d')!
  overlayCtx.strokeStyle = '#FF0000'
  overlayCtx.lineWidth = 2
  overlayCtx.strokeRect(bbox.left, bbox.top, cropW, cropH)
  overlayCtx.font = '14px sans-serif'
  overlayCtx.fillStyle = '#FF0000'
  overlayCtx.fillText(ripeness.verdict, bbox.left, Math.max(bbox.top - 4, 14))

  return {
    melonFound: true,
    verdict: ripeness.verdict,
    ripeness,
    rgb,
    bbox,
    sick,
    bboxOverlay: getImageData(overlayCanvas),
    maskedResult,
    roiSample,
  }
}
