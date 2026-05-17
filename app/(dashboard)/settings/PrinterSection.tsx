'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { CheckCircle, Bluetooth, Usb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type PrinterType = 'bluetooth' | 'serial'

type PrinterState = {
  type: PrinterType
  name: string
} | null

export function PrinterSection() {
  const [printer, setPrinter] = useState<PrinterState>(null)
  const [connected, setConnected] = useState(false)
  const [btDevice, setBtDevice] = useState<BluetoothDevice | null>(null)
  const [serialPort, setSerialPort] = useState<SerialPort | null>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const type = localStorage.getItem('printer_type') as PrinterType | null
    const name = localStorage.getItem('printer_name')
    if (type && name) {
      setPrinter({ type, name })
      setConnected(true)
    }
    if (typeof navigator !== 'undefined') {
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
    }
  }, [])

  const connectBluetooth = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      toast.error('Web Bluetooth not supported in this browser')
      return
    }
    try {
      const device = await (navigator as Navigator & {
        bluetooth: { requestDevice: (o: object) => Promise<BluetoothDevice> }
      }).bluetooth.requestDevice({ acceptAllDevices: true })

      const name = device.name ?? 'Bluetooth Printer'
      localStorage.setItem('printer_type', 'bluetooth')
      localStorage.setItem('printer_name', name)
      setBtDevice(device)
      setPrinter({ type: 'bluetooth', name })
      setConnected(true)
      toast.success(`Connected to ${name}`)
    } catch (err) {
      if (err instanceof Error && err.name !== 'NotFoundError') {
        toast.error('Bluetooth connection failed')
      }
    }
  }, [])

  const connectSerial = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serial' in navigator)) {
      toast.error('Web Serial not supported in this browser')
      return
    }
    try {
      const port = await (navigator as Navigator & {
        serial: { requestPort: () => Promise<SerialPort> }
      }).serial.requestPort()

      const name = 'USB Serial Printer'
      localStorage.setItem('printer_type', 'serial')
      localStorage.setItem('printer_name', name)
      setSerialPort(port)
      setPrinter({ type: 'serial', name })
      setConnected(true)
      toast.success('Connected to USB Serial Printer')
    } catch (err) {
      if (err instanceof Error && err.name !== 'NotFoundError') {
        toast.error('Serial connection failed')
      }
    }
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem('printer_type')
    localStorage.removeItem('printer_name')
    setPrinter(null)
    setConnected(false)
    setBtDevice(null)
    setSerialPort(null)
    toast.success('Printer disconnected')
  }, [])

  const testPrint = useCallback(async () => {
    if (!printer) return
    try {
      const { buildReceiptBytes, printViaBluetooth, printViaSerial } = await import(
        '@/lib/thermal'
      )
      const bytes = await buildReceiptBytes({
        clinicName: 'SiguradoPH Clinic',
        clinicAddress: '123 Main St, City, Province 1000',
        clinicTin: '000-000-000-000',
        orNumber: 'TEST-0001',
        transactionDate: new Date(),
        patientName: 'Test Patient',
        serviceDescription: 'Test Print',
        netAmount: 89.29,
        vatAmount: 10.71,
        grossAmount: 100.0,
        discountAmount: 0,
        paymentMethod: 'CASH',
      })

      if (printer.type === 'bluetooth') {
        if (!btDevice) throw new Error('Bluetooth device not connected')
        await printViaBluetooth(btDevice, bytes)
      } else {
        if (!serialPort) throw new Error('Serial port not connected')
        await printViaSerial(serialPort, bytes)
      }
      toast.success('Test receipt printed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Print failed')
    }
  }, [printer, btDevice, serialPort])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Receipt Printer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Use Chrome browser on your Android tablet for printer connection. Pair
          the printer in Android Bluetooth settings first.
        </p>

        {isIOS && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            Web Bluetooth and Web Serial are not supported on iOS. The{' '}
            <strong>Print</strong> button in checkout will use AirPrint instead.
          </div>
        )}

        {connected && printer ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{printer.name} connected</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 min-h-[48px]"
                onClick={testPrint}
              >
                Test Print
              </Button>
              <Button
                variant="destructive"
                className="flex-1 min-h-[48px]"
                onClick={disconnect}
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="min-h-[56px] gap-2 flex-col h-auto py-3"
              onClick={connectBluetooth}
              disabled={isIOS}
            >
              <Bluetooth className="w-5 h-5" />
              <span className="text-xs">Connect via Bluetooth</span>
            </Button>
            <Button
              variant="outline"
              className="min-h-[56px] gap-2 flex-col h-auto py-3"
              onClick={connectSerial}
              disabled={isIOS}
            >
              <Usb className="w-5 h-5" />
              <span className="text-xs">Connect via USB</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
