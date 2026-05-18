import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/logo.png"
          alt="Sigurado"
          width={160}
          height={100}
          className="object-contain"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coming Soon</h1>
          <p className="text-gray-500 mt-2 max-w-sm">
            Practice management built for Philippine dental clinics. Receipts, payroll, and BIR compliance — handled.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/register"
          className="block w-full bg-blue-600 text-white rounded-xl py-4 font-semibold text-base"
        >
          Register your clinic
        </Link>
        <Link
          href="/login"
          className="block w-full border border-gray-200 text-gray-700 rounded-xl py-4 font-semibold text-base"
        >
          Sign in
        </Link>
      </div>

      <p className="text-xs text-gray-400">Powered by Sigurado</p>
    </div>
  )
}
