// Client-only — do NOT import in server components or actions

import { buildReceiptBytes, THERMAL_PRINTER_SERVICES } from './thermal'

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
  clinicLogoUrl?: string | null
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
    clinicLogoUrl: data.clinicLogoUrl ?? null,
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
    const bt = (navigator as Navigator & {
      bluetooth: {
        requestDevice: (o: object) => Promise<BluetoothDevice>
        getDevices: () => Promise<BluetoothDevice[]>
      }
    }).bluetooth

    // Try to reconnect to previously paired printer without prompting
    let device: BluetoothDevice | undefined
    const savedName = localStorage.getItem('printer_name')
    if (savedName && 'getDevices' in bt) {
      const granted = await bt.getDevices()
      device = granted.find((d) => d.name === savedName)
    }

    // Fall back to picker if no previously granted device found
    if (!device) {
      device = await bt.requestDevice({
        acceptAllDevices: true,
        optionalServices: [...THERMAL_PRINTER_SERVICES],
      })
      // Save name in case it changed
      if (device.name) localStorage.setItem('printer_name', device.name)
    }

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
