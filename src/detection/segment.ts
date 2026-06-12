import * as cvModule from '@techstark/opencv-js'
import type { Mat, MatVector } from '@techstark/opencv-js'
import type { SegmentResult } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cv = ((cvModule as any).default ?? cvModule) as typeof cvModule

/** Convert an OpenCV Mat to ImageData (assumes mat is BGR or BGRA) */
function matToImageData(mat: Mat): ImageData {
  // Convert BGR → RGBA for canvas-compatible ImageData
  const rgba = new cv.Mat()
  if (mat.channels() === 3) {
    cv.cvtColor(mat, rgba, cv.COLOR_BGR2RGBA)
  } else {
    cv.cvtColor(mat, rgba, cv.COLOR_BGRA2RGBA)
  }
  const imageData = new ImageData(
    new Uint8ClampedArray(rgba.data),
    mat.cols,
    mat.rows,
  )
  rgba.delete()
  return imageData
}

/**
 * Port of segment_roi.find_sample.
 *
 * Input: ImageData in BGRA layout (as produced by OpenCV.js Mat.data conversion).
 * Returns the segmentation mask overlay and a center 200×200 ROI sample.
 *
 * Throws if OpenCV.js is not ready or no melon contour is found.
 */
export function findSample(inputBGRA: ImageData): SegmentResult {
  // Guard: ensure cv runtime is loaded
  if (typeof cv === 'undefined' || !cv.Mat) {
    throw new Error('OpenCV.js is not ready')
  }

  // Collect all Mats/MatVectors for cleanup in finally
  const mats: Mat[] = []
  const mk = <T extends Mat>(m: T): T => { mats.push(m); return m }
  const vecs: MatVector[] = []
  const mkv = <T extends MatVector>(m: T): T => { vecs.push(m); return m }

  try {
    // Step 1: Create a Mat from the BGRA ImageData
    const src = mk(cv.matFromImageData(inputBGRA))

    // Step 2: Resize to 640×480
    const resized = mk(new cv.Mat())
    cv.resize(src, resized, new cv.Size(640, 480))

    // Step 3: Convert BGRA → BGR
    const bgr = mk(new cv.Mat())
    cv.cvtColor(resized, bgr, cv.COLOR_BGRA2BGR)

    // Step 4: Convert BGR → HSV
    // H∈[0,180], S∈[0,255], V∈[0,255] — same convention as Python OpenCV
    const hsv = mk(new cv.Mat())
    cv.cvtColor(bgr, hsv, cv.COLOR_BGR2HSV)

    // Step 5: Build candidate masks with exact Python bounds.
    // OpenCV.js inRange only accepts Mat bounds (passing cv.Scalar throws
    // 'Cannot pass ... as a Mat'), so build full-size bound Mats per call.
    const inRange = (low: [number, number, number], high: [number, number, number], dst: Mat) => {
      const lo = mk(new cv.Mat(hsv.rows, hsv.cols, hsv.type(), new cv.Scalar(...low, 0)))
      const hi = mk(new cv.Mat(hsv.rows, hsv.cols, hsv.type(), new cv.Scalar(...high, 0)))
      cv.inRange(hsv, lo, hi, dst)
    }

    // Green masks
    const maskGreen1 = mk(new cv.Mat())
    inRange([30, 100, 170], [179, 255, 255], maskGreen1)
    const maskGreen2 = mk(new cv.Mat())
    inRange([0, 88, 120], [38, 150, 255], maskGreen2)
    const maskGreen = mk(new cv.Mat())
    cv.bitwise_or(maskGreen1, maskGreen2, maskGreen)

    // Yellow masks
    const maskOrangeA = mk(new cv.Mat()) // mask_yallow1 in Python source — used as orange mask component
    inRange([0, 110, 88], [30, 255, 255], maskOrangeA)
    const maskYellow2 = mk(new cv.Mat())
    inRange([0, 67, 185], [35, 255, 255], maskYellow2)
    const maskYellow3 = mk(new cv.Mat())
    inRange([0, 0, 0], [100, 70, 214], maskYellow3)
    // Python: mask_yallow = cv.max(mask_yallow2, mask_yallow3)
    const maskYellow = mk(new cv.Mat())
    cv.bitwise_or(maskYellow2, maskYellow3, maskYellow)

    // Orange mask
    const maskOrange0 = mk(new cv.Mat())
    inRange([0, 84, 178], [179, 255, 255], maskOrange0)
    // Python: mask_orange = cv.max(mask_yallow1, mask_orange0)
    const maskOrange = mk(new cv.Mat())
    cv.bitwise_or(maskOrangeA, maskOrange0, maskOrange)

    // Step 6: Count white pixels in each mask and pick the winner
    const val1 = cv.countNonZero(maskGreen)
    const val2 = cv.countNonZero(maskYellow)
    const val3 = cv.countNonZero(maskOrange)

    let mask: Mat
    if (val1 > val2 && val1 > val3) {
      mask = maskGreen
    } else if (val2 > val1 && val2 > val3) {
      mask = maskYellow
    } else {
      mask = maskOrange
    }

    // Step 7: Find contours on the selected mask
    const contours = mkv(new cv.MatVector())
    const hierarchy = mk(new cv.Mat())
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    const contoursSize = contours.size() as unknown as number
    if (contoursSize === 0) {
      throw new Error('No melon contour found in segment')
    }

    // Step 8: Create masked result with bitwise_and (mask keeps melon region)
    const maskedResultMat = mk(new cv.Mat())
    cv.bitwise_and(bgr, bgr, maskedResultMat, mask)

    // Step 9: Find the largest contour by area
    let largestContour: Mat | null = null
    let largestArea = -1
    for (let i = 0; i < contoursSize; i++) {
      const cnt = contours.get(i) as unknown as Mat
      const area = cv.contourArea(cnt)
      if (area > largestArea) {
        largestArea = area
        largestContour = cnt
      }
    }

    if (!largestContour) {
      throw new Error('No melon contour found in segment')
    }

    // Step 10: Bounding rect → crop BGR → resize to 500×500
    const rect = cv.boundingRect(largestContour)
    const crop = mk(bgr.roi(new cv.Rect(rect.x, rect.y, rect.width, rect.height)))
    const roi500 = mk(new cv.Mat())
    cv.resize(crop, roi500, new cv.Size(500, 500))

    // Step 11: Crop center 200×200
    // Python: c_x=250, c_y=250, r=100 → roi[150:350, 150:350]
    const roiSampleMat = mk(roi500.roi(new cv.Rect(150, 150, 200, 200)))

    // Step 12: Convert results to ImageData
    const maskedResult = matToImageData(maskedResultMat)
    const roiSample = matToImageData(roiSampleMat)

    return { maskedResult, roiSample }
  } finally {
    // Step 13: Delete all Mats/MatVectors to prevent WASM heap leaks
    for (const m of mats) {
      try { m.delete() } catch { /* already deleted or never allocated */ }
    }
    for (const v of vecs) {
      try { v.delete() } catch { /* already deleted or never allocated */ }
    }
  }
}
