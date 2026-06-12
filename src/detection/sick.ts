import * as cvModule from '@techstark/opencv-js'
import type { Mat, MatVector } from '@techstark/opencv-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cv = ((cvModule as any).default ?? cvModule) as typeof cvModule

/**
 * Port of sick_melon.find_blob.
 * Returns blob count. count > 20 indicates a sick melon.
 *
 * Input: ROI ImageData in standard canvas RGBA layout
 * (produced by segment.ts matToImageData).
 */
export function findBlob(roiRGBA: ImageData): number {
  // Guard: ensure cv runtime is loaded
  if (typeof cv === 'undefined' || !cv.Mat) {
    throw new Error('OpenCV.js is not ready')
  }

  // Collect all Mats for cleanup in finally
  const mats: Mat[] = []
  const mk = <T extends Mat>(m: T): T => { mats.push(m); return m }
  const mvs: MatVector[] = []
  const mkv = <T extends MatVector>(m: T): T => { mvs.push(m); return m }

  try {
    // Step 1: Create a Mat from the RGBA ImageData
    const src = mk(cv.matFromImageData(roiRGBA))

    // Step 2: Resize to 240×240
    const resized = mk(new cv.Mat())
    cv.resize(src, resized, new cv.Size(240, 240))

    // Step 3: Convert RGBA → GRAY (correct luminance weights for RGBA layout)
    const gray = mk(new cv.Mat())
    cv.cvtColor(resized, gray, cv.COLOR_RGBA2GRAY)

    // Step 4: GaussianBlur (13,13,0)
    const blur = mk(new cv.Mat())
    cv.GaussianBlur(gray, blur, new cv.Size(13, 13), 0, 0, cv.BORDER_DEFAULT)

    // Step 5: threshold (165, 255, THRESH_BINARY) — matches Python but not used further
    const thresh1 = mk(new cv.Mat())
    cv.threshold(blur, thresh1, 165, 255, cv.THRESH_BINARY)

    // Step 6: morphologyEx MORPH_DILATE with 5×5 kernel on blur → img_erosion
    const kernel5 = mk(cv.Mat.ones(5, 5, cv.CV_8U))
    const imgErosion = mk(new cv.Mat())
    cv.morphologyEx(blur, imgErosion, cv.MORPH_DILATE, kernel5)

    // Step 7: morphologyEx MORPH_ERODE with 4×4 kernel on blur → img_delate
    const kernel4 = mk(cv.Mat.ones(4, 4, cv.CV_8U))
    const imgDelate = mk(new cv.Mat())
    cv.morphologyEx(blur, imgDelate, cv.MORPH_ERODE, kernel4)

    // Step 8: morphologyEx MORPH_GRADIENT with 4×4 kernel on blur → gradient
    const gradient = mk(new cv.Mat())
    cv.morphologyEx(blur, gradient, cv.MORPH_GRADIENT, kernel4)

    // Step 9: op2 = img_delate + img_erosion (saturating uint8 add)
    const op2 = mk(new cv.Mat())
    cv.add(imgDelate, imgErosion, op2)

    // Step 10: op = op2 + gradient
    const op = mk(new cv.Mat())
    cv.add(op2, gradient, op)

    // Step 11: adaptiveThreshold(op, 255, ADAPTIVE_THRESH_MEAN_C, THRESH_BINARY, 21, 8)
    const thresh2 = mk(new cv.Mat())
    cv.adaptiveThreshold(op, thresh2, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 21, 8)

    // Step 12: findContours on thresh2
    const contours = mkv(new cv.MatVector())
    const hierarchy = mk(new cv.Mat())
    cv.findContours(thresh2, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

    // Step 13: Filter contours by area/circularity/convexity/inertia
    // matching SimpleBlobDetector params:
    //   minArea=10, maxArea=9e6
    //   minCircularity=0.01, maxCircularity=1
    //   minConvexity=0.1, maxConvexity=1
    //   minInertiaRatio=0.1, maxInertiaRatio=1
    let blobCount = 0

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i)

      try {
        // Area filter
        const area = cv.contourArea(cnt)
        if (area < 10 || area > 9e6) continue

        // Circularity filter: 4π·area / perimeter²
        const perimeter = cv.arcLength(cnt, true)
        if (perimeter === 0) continue
        const circularity = (4 * Math.PI * area) / (perimeter * perimeter)
        if (circularity < 0.01 || circularity > 1) continue

        // Convexity filter: area / hullArea
        const hull = mk(new cv.Mat())
        cv.convexHull(cnt, hull)
        const hullArea = cv.contourArea(hull)
        if (hullArea === 0) continue
        const convexity = area / hullArea
        if (convexity < 0.1 || convexity > 1) continue

        // Inertia ratio filter: lambda_min / lambda_max of covariance matrix
        const m = cv.moments(cnt)
        if (m.m00 === 0) continue

        const mu20 = m.mu20 / m.m00
        const mu02 = m.mu02 / m.m00
        const mu11 = m.mu11 / m.m00

        const half = 0.5 * Math.sqrt((mu20 - mu02) ** 2 + 4 * mu11 ** 2)
        const center = 0.5 * (mu20 + mu02)
        const lambda1 = center + half
        const lambda2 = center - half

        const lambdaMax = Math.max(lambda1, lambda2)
        const lambdaMin = Math.min(lambda1, lambda2)

        if (lambdaMax <= 0) continue
        const inertiaRatio = lambdaMin / lambdaMax
        if (inertiaRatio < 0.1) continue

        blobCount++
      } finally {
        cnt.delete()
      }
    }

    // Step 14: Return count
    return blobCount
  } finally {
    // Delete all Mats to prevent WASM heap leaks
    for (const m of mats) {
      try { m.delete() } catch { /* already deleted or never allocated */ }
    }
    for (const mv of mvs) {
      try { mv.delete() } catch { /* already deleted or never allocated */ }
    }
  }
}
