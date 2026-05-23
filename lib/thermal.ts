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

export async function buildReceiptBytes(data: ReceiptData): Promise<Uint8Array> {
  const { default: ThermalPrinterEncoder } = await import('thermal-printer-encoder')
  const W = 48

  const encoder = new ThermalPrinterEncoder({ language: 'esc-pos', width: W })

  const dash = '-'.repeat(W)
  const eq = '='.repeat(W)

  let e = encoder
    .initialize()
    .align('center')
    .bold(true)
    .line(data.clinicName.toUpperCase().slice(0, W))
    .bold(false)
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

export async function printViaBluetooth(
  device: BluetoothDevice,
  bytes: Uint8Array
): Promise<void> {
  const server = await device.gatt!.connect()

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
        const CHUNK = 512
        for (let i = 0; i < bytes.length; i += CHUNK) {
          const chunk = bytes.slice(i, i + CHUNK)
          if (char.properties.writeWithoutResponse) {
            await char.writeValueWithoutResponse(chunk)
          } else {
            await char.writeValueWithResponse(chunk)
          }
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
