// Client-only — do NOT add 'use server'. Imported only in client components.

// Known Bluetooth service UUIDs for common thermal/receipt printers.
// Must be declared in requestDevice() optionalServices or Chrome blocks access.
export const THERMAL_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Generic Chinese thermal printers (XP-58H, JP-58H, etc.)
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Epson-compatible BLE
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent (BLE serial)
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic UART over BLE
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 BLE module
] as const

export type ReceiptData = {
  clinicName: string
  clinicAddress: string
  clinicTin: string
  clinicLogoUrl?: string | null
  orNumber: string
  transactionDate: Date
  patientName: string
  serviceDescription: string
  toothNumber?: string
  netAmount: number
  vatAmount: number
  grossAmount: number
  discountAmount: number
  discountLabel?: string
  loyaltyCardPurchased?: {
    cardNumber: string
    expiryDate: Date
    amount: number
  }
  paymentMethod: string
  notes?: string
}

function padLine(left: string, right: string, width: number): string {
  const spaces = width - left.length - right.length
  return left + ' '.repeat(Math.max(1, spaces)) + right
}


function fmtMoney(n: number): string {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n)
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Logo target width in dots. Keep it modest — 160px is ~40% of the 58mm
// printable area, large enough to be recognisable but small enough to send
// quickly over BLE without overwhelming the printer buffer.
const LOGO_PX = 160

/**
 * Fetch a logo URL, draw it onto an off-screen canvas scaled to LOGO_PX wide,
 * and return the ImageData. Returns null on any failure so callers can fall back
 * to text. Requires browser environment (canvas + Image API).
 */
async function rasterizeLogo(url: string): Promise<ImageData | null> {
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Logo load failed'))
      img.src = url
    })

    const targetW = LOGO_PX
    const targetH = Math.round((img.naturalHeight / img.naturalWidth) * targetW)

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // White background so transparent logos don't become black blobs
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, targetW, targetH)
    ctx.drawImage(img, 0, 0, targetW, targetH)

    return ctx.getImageData(0, 0, targetW, targetH)
  } catch {
    return null
  }
}

export async function buildReceiptBytes(data: ReceiptData): Promise<Uint8Array> {
  const { default: ThermalPrinterEncoder } = await import('thermal-printer-encoder')
  const W = 48

  // imageMode: 'raster' uses the GS v 0 command — supported by virtually all
  // 58mm ESC/POS printers including cheap Chinese models like the XP-58H.
  // The default 'column' mode (ESC *) is not supported by most of these printers
  // and produces garbled text output.
  const encoder = new ThermalPrinterEncoder({ language: 'esc-pos', width: W, imageMode: 'raster' })

  const dash = '-'.repeat(W)
  const eq = '='.repeat(W)

  // Try to rasterize logo; fall back to bold clinic name text
  const logoImageData = data.clinicLogoUrl ? await rasterizeLogo(data.clinicLogoUrl) : null

  let e = encoder.initialize().align('center')

  if (logoImageData) {
    e = e.image(logoImageData, LOGO_PX, logoImageData.height, 'threshold')
    e = e.newline()
  } else {
    e = e.bold(true).line(data.clinicName.toUpperCase().slice(0, W)).bold(false)
  }

  e = e
    .line(data.clinicAddress.slice(0, W))
    .line(`TIN: ${data.clinicTin}`)
    .line(dash)
    .bold(true)
    .line('OFFICIAL RECEIPT')
    .bold(false)
    .line(`OR No: ${data.orNumber}`)
    .line(fmtDate(data.transactionDate))
    .line(dash)
    .align('left')
    .line(`Patient: ${data.patientName}`.slice(0, W))
    .line(`Service: ${data.serviceDescription}`.slice(0, W))

  if (data.toothNumber) {
    e = e.line(`Tooth:   ${data.toothNumber}`)
  }

  e = e
    .line(dash)
    .line(padLine('Net amount (ex. VAT)', `P${fmtMoney(data.netAmount)}`, W))
    .line(padLine('VAT (12%)', `P${fmtMoney(data.vatAmount)}`, W))

  if (data.discountAmount > 0) {
    const label = data.discountLabel
      ? `Discount (${data.discountLabel})`.slice(0, 28)
      : 'Discount'
    e = e.line(padLine(label, `-P${fmtMoney(data.discountAmount)}`, W))
  }

  if (data.loyaltyCardPurchased) {
    const lc = data.loyaltyCardPurchased
    e = e
      .line(padLine('Loyalty Card', `P${fmtMoney(lc.amount)}`, W))
      .line(`  Card #: ${lc.cardNumber}`)
      .line(`  Valid until: ${fmtDate(lc.expiryDate)}`)
  }

  e = e
    .line(eq)
    .bold(true)
    .line(padLine('TOTAL', `P${fmtMoney(data.grossAmount)}`, W))
    .bold(false)
    .line(padLine('Payment method:', data.paymentMethod, W))
    .line(dash)

  if (data.notes) {
    e = e.line(`Notes: ${data.notes}`.slice(0, W))
  }

  e = e
    .align('center')
    .line('Thank you for your visit!')
    .line('Powered by Sigurado')
    .newline()
    .newline()
    .newline()
    .cut()

  return e.encode()
}

// BLE safe chunk size — standard ATT MTU is 23 bytes (20 payload).
// Sending larger chunks results in silent data corruption on most thermal printers.
const BLE_CHUNK = 20
const BLE_DELAY_MS = 20 // ms between chunks — gives the printer buffer time to drain

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function bleWrite(
  char: BluetoothRemoteGATTCharacteristic,
  chunk: Uint8Array
): Promise<void> {
  // Prefer writeValueWithoutResponse (faster, no ACK round-trip).
  // Fall back to the older writeValue if the newer API isn't available.
  if (char.properties.writeWithoutResponse && 'writeValueWithoutResponse' in char) {
    await char.writeValueWithoutResponse(chunk)
  } else {
    await char.writeValue(chunk)
  }
}

export async function printViaBluetooth(
  device: BluetoothDevice,
  bytes: Uint8Array
): Promise<void> {
  const server = await device.gatt!.connect()

  // Small pause after connect — some printers aren't ready to receive immediately
  await sleep(300)

  // Try each known service UUID — different printer brands use different ones
  for (const serviceUUID of THERMAL_PRINTER_SERVICES) {
    let service: BluetoothRemoteGATTService
    try {
      service = await server.getPrimaryService(serviceUUID)
    } catch {
      continue // service not present on this printer, try next
    }

    const chars = await service.getCharacteristics()
    for (const char of chars) {
      if (char.properties.writeWithoutResponse || char.properties.write) {
        // Send in 20-byte BLE chunks with a small delay between each
        for (let i = 0; i < bytes.length; i += BLE_CHUNK) {
          await bleWrite(char, bytes.slice(i, i + BLE_CHUNK))
          if (i + BLE_CHUNK < bytes.length) await sleep(BLE_DELAY_MS)
        }
        server.disconnect()
        return
      }
    }
  }

  server.disconnect()
  throw new Error('No writable characteristic found. Make sure the printer is on and in range.')
}

export async function printViaSerial(
  port: SerialPort,
  bytes: Uint8Array
): Promise<void> {
  if (!port.writable) {
    await port.open({ baudRate: 9600 })
  }
  const writer = port.writable!.getWriter()
  await writer.write(bytes)
  writer.releaseLock()
}
