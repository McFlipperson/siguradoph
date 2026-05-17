// Minimal type declarations for Web Bluetooth and Web Serial APIs
// These are not yet in the TypeScript DOM lib as of TS 5.x

// ─── Web Bluetooth ───────────────────────────────────────────────────────────

interface BluetoothRemoteGATTCharacteristic {
  properties: {
    write: boolean
    writeWithoutResponse: boolean
    notify: boolean
    read: boolean
    indicate: boolean
  }
  writeValue(value: ArrayBuffer | ArrayBufferView): Promise<void>
}

interface BluetoothRemoteGATTService {
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>
}

interface BluetoothDevice {
  name?: string
  gatt?: BluetoothRemoteGATTServer
}

interface Bluetooth {
  requestDevice(options: { acceptAllDevices: boolean; optionalServices?: string[] }): Promise<BluetoothDevice>
}

// ─── Web Serial ──────────────────────────────────────────────────────────────

interface SerialPortOpenOptions {
  baudRate: number
}

interface SerialPort {
  open(options: SerialPortOpenOptions): Promise<void>
  writable: WritableStream<Uint8Array> | null
}

interface Serial {
  requestPort(options?: object): Promise<SerialPort>
}

// ─── Navigator extensions ─────────────────────────────────────────────────────

interface Navigator {
  bluetooth: Bluetooth
  serial: Serial
}
