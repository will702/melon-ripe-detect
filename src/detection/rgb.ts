import type { RGBValues } from './types'

/**
 * Extracts normalized mean RGB values from a ROI ImageData.
 *
 * Channel ordering: the input ImageData is produced by segment.ts
 * matToImageData, which converts the OpenCV Mat to standard canvas RGBA —
 * so pixel layout is [R, G, B, A] per pixel.
 *
 * Mirrors Main_DSS.extract_rgb exactly:
 *   normalized_channel = round(mean_channel / (mean_b + mean_g + mean_r) × 255)
 */
export function extractRGB(roi: ImageData): RGBValues {
  const data = roi.data  // Uint8ClampedArray, layout: [R, G, B, A, R, G, B, A, ...]
  const n = roi.width * roi.height

  let sumB = 0, sumG = 0, sumR = 0
  for (let i = 0; i < data.length; i += 4) {
    sumR += data[i]       // channel 0 = Red
    sumG += data[i + 1]   // channel 1 = Green
    sumB += data[i + 2]   // channel 2 = Blue
    // Alpha (i+3) ignored
  }

  const meanB = sumB / n
  const meanG = sumG / n
  const meanR = sumR / n
  const total = meanB + meanG + meanR

  if (total === 0) return { b: 0, g: 0, r: 0 }

  return {
    b: Math.round(meanB / total * 255),
    g: Math.round(meanG / total * 255),
    r: Math.round(meanR / total * 255),
  }
}
