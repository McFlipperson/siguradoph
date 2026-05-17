declare module 'thermal-printer-encoder' {
  interface ThermalPrinterEncoderOptions {
    language?: 'esc-pos' | 'star-prnt' | 'star-line'
    width?: number
    [key: string]: unknown
  }

  type Alignment = 'left' | 'center' | 'right'

  class ThermalPrinterEncoder {
    constructor(options?: ThermalPrinterEncoderOptions)
    initialize(): this
    align(align: Alignment): this
    bold(value: boolean): this
    line(text: string): this
    newline(): this
    cut(): this
    encode(): Uint8Array
  }

  export default ThermalPrinterEncoder
}
