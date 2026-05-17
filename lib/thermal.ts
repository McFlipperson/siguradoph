// Client-only — do NOT add 'use server'. Imported only in client components.

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
    .line('Powered by SiguradoPH')
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
  const services = await server.getPrimaryServices()

  for (const service of services) {
    const chars = await service.getCharacteristics()
    for (const char of chars) {
      if (char.properties.writeWithoutResponse || char.properties.write) {
        const CHUNK = 512
        for (let i = 0; i < bytes.length; i += CHUNK) {
          await char.writeValue(bytes.slice(i, i + CHUNK))
        }
        return
      }
    }
  }
  throw new Error('No writable characteristic found on printer')
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
