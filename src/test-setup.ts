/**
 * Vitest setup: polyfill browser APIs missing from jsdom.
 */

// jsdom does not implement ImageData — provide a minimal polyfill
if (typeof globalThis.ImageData === 'undefined') {
  class ImageDataPolyfill {
    readonly data: Uint8ClampedArray
    readonly width: number
    readonly height: number
    readonly colorSpace: PredefinedColorSpace = 'srgb'

    constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
      if (typeof dataOrWidth === 'number') {
        // ImageData(width, height)
        this.width = dataOrWidth
        this.height = widthOrHeight
        this.data = new Uint8ClampedArray(dataOrWidth * widthOrHeight * 4)
      } else {
        // ImageData(data, width, height?)
        this.data = dataOrWidth
        this.width = widthOrHeight
        this.height = height ?? dataOrWidth.length / (widthOrHeight * 4)
      }
    }
  }

  ;(globalThis as unknown as Record<string, unknown>).ImageData = ImageDataPolyfill
}
