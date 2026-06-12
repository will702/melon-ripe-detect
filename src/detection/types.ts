/** Normalized mean RGB values (each ∈ [0, 255], normalized by channel sum × 255) */
export interface RGBValues {
  b: number  // normalized blue
  g: number  // normalized green
  r: number  // normalized red
}

/** Membership function curve data for one fuzzy variable (for SVG chart rendering) */
export interface MFCurve {
  /** Variable name, e.g. "Blue", "Green", "Red", "Index" */
  name: string
  /** Universe of discourse [min, max] */
  universe: [number, number]
  /** Each linguistic term and its membership values at sampled points */
  terms: Array<{
    label: string         // e.g. "L_blue", "H_blue", "Ripe"
    points: number[]      // membership values at evenly-spaced universe points
    /** The degree to which this term fired in the last inference */
    firingStrength: number
  }>
}

/** Full output of the fuzzy inference step */
export interface FuzzyResult {
  /** Defuzzified ripeness index (0–10). -1 if inference failed. */
  index: number
  /** The verdict label */
  verdict: 'Under Ripe' | 'About to Ripe' | 'Ripe' | 'False positive'
  /** MF curves for Blue, Green, Red, Index (for chart rendering) */
  curves: MFCurve[]
}

/** Result of the segmentation step */
export interface SegmentResult {
  /** The HSV-masked image of the full melon crop (640×480 canvas-compatible) */
  maskedResult: ImageData
  /** The center 200×200 ROI sample used for RGB extraction */
  roiSample: ImageData
}

/** Bounding box from the detector (pixel coords in the 480×360 resized image) */
export interface BBox {
  left: number
  top: number
  right: number
  bottom: number
  /** Detection confidence score */
  score: number
}

/** The full result returned by the detector */
export interface DetectionResult {
  /** Whether a melon was found (if false, all other fields may be undefined) */
  melonFound: boolean
  verdict?: FuzzyResult['verdict']
  ripeness?: FuzzyResult
  rgb?: RGBValues
  bbox?: BBox
  sick?: boolean
  /** Diagnostic image: 480×360 with bbox drawn */
  bboxOverlay?: ImageData
  /** Diagnostic image: segmentation mask */
  maskedResult?: ImageData
  /** Diagnostic image: ROI sample */
  roiSample?: ImageData
}

/** Runtime loading state */
export type RuntimeStatus = 'idle' | 'loading' | 'ready' | 'error'
