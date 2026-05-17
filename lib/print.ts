// Client-only — do NOT import in server components or actions

import { buildReceiptBytes } from './thermal'

export type PrintableInvoice = {
  orNumber: string
  transactionDate: Date | string
  netAmount: number
  vatAmount: number
  grossAmount: number
  discountAmount: number
  discountLabel?: string
  paymentMethod: string
  notes?: string | null
  serviceDescription: string
  toothNumber?: string | null
  patientFirstName: string
  patientLastName: string
  clinicName: string
  clinicStreet: string
  clinicCity: string
  clinicProvince: string
  clinicZip: string
  clinicTin: string
  newLoyaltyCard?: {
    cardNumber: string
    expiryDate: Date | string
    amount: number
  }
}

export async function printReceipt(data: PrintableInvoice): Promise<void> {
  const printerType = localStorage.getItem('printer_type') as 'bluetooth' | 'serial' | null
  if (!printerType) throw new Error('No printer configured. Set up a printer in Settings.')

  const clinicAddress = `${data.clinicStreet}, ${data.clinicCity}, ${data.clinicProvince} ${data.clinicZip}`

  const bytes = await buildReceiptBytes({
    clinicName: data.clinicName,
    clinicAddress,
    clinicTin: data.clinicTin,
    orNumber: data.orNumber,
    transactionDate: new Date(data.transactionDate),
    patientName: `${data.patientFirstName} ${data.patientLastName}`,
    serviceDescription: data.serviceDescription,
    toothNumber: data.toothNumber ?? undefined,
    netAmount: data.netAmount,
    vatAmount: data.vatAmount,
    grossAmount: data.grossAmount,
    discountAmount: data.discountAmount,
    discountLabel: data.discountLabel,
    loyaltyCardPurchased: data.newLoyaltyCard
      ? {
          cardNumber: data.newLoyaltyCard.cardNumber,
          expiryDate: new Date(data.newLoyaltyCard.expiryDate),
          amount: data.newLoyaltyCard.amount,
        }
      : undefined,
    paymentMethod: data.paymentMethod,
    notes: data.notes ?? undefined,
  })

  if (printerType === 'bluetooth') {
    const { printViaBluetooth } = await import('./thermal')
    const nav = navigator as Navigator & {
      bluetooth: { requestDevice: (o: object) => Promise<BluetoothDevice> }
    }
    const device = await nav.bluetooth.requestDevice({ acceptAllDevices: true })
    await printViaBluetooth(device, bytes)
  } else if (printerType === 'serial') {
    const { printViaSerial } = await import('./thermal')
    const nav = navigator as Navigator & {
      serial: { requestPort: () => Promise<SerialPort> }
    }
    const port = await nav.serial.requestPort()
    await printViaSerial(port, bytes)
  }
}
