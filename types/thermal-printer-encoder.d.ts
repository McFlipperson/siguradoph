declare module 'thermal-printer-encoder' {
  interface ThermalPrinterEncoderOptions {
    language?: 'esc-pos' | 'star-prnt' | 'star-line'
    width?: number
    imageMode?: 'column' | 'raster'
    [key: string]: unknown
  }

  type Alignment = 'left' | 'center' | 'right'

  interface ImageLike {
    width: number
    height: number
    data: Uint8ClampedArray
  }

  type DitherAlgorithm = 'threshold' | 'bayer' | 'floydsteinberg' | 'atkinson'

  class ThermalPrinterEncoder {
    constructor(options?: ThermalPrinterEncoderOptions)
    initialize(): this
    align(align: Alignment): this
    bold(value: boolean): this
    line(text: string): this
    newline(): this
    image(image: ImageLike, width: number, height: number, algorithm?: DitherAlgorithm): this
    cut(): this
    encode(): Uint8Array
  }

  export default ThermalPrinterEncoder
}
