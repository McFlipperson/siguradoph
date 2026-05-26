import Image from 'next/image'
import Link from 'next/link'

export default function TrialExpiredPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-12 text-center"
      style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)', background: '#F5F8FF' }}
    >
      <Image src="/logo.png" alt="Sigurado" width={180} height={120} className="object-contain mb-8" />

      <h1 className="font-black text-2xl mb-3" style={{ color: '#0B1627', letterSpacing: '-0.02em' }}>
        Your free month has ended.
      </h1>
      <p className="text-sm leading-relaxed mb-8 max-w-xs" style={{ color: '#5C6A85' }}>
        Choose a plan to keep your clinic running. Your data is safe — nothing has been deleted.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {/* Basic */}
        <div className="rounded-2xl bg-white p-5 text-left" style={{ border: '1.5px solid #E0E8F8' }}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-black text-lg" style={{ color: '#0B1627' }}>Basic</p>
              <p className="text-xs" style={{ color: '#9AAABB' }}>Everything your clinic needs to run smoothly.</p>
            </div>
            <p className="font-black text-2xl" style={{ color: '#0B1627', fontFamily: 'var(--font-geist-mono, monospace)' }}>₱999<span className="text-sm font-semibold">/mo</span></p>
          </div>
          <a
            href="https://m.me/sigurado"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center font-bold text-sm py-3.5 rounded-xl"
            style={{ background: '#E8EEFB', color: '#1A3FD0' }}
          >
            Message us to upgrade
          </a>
        </div>

        {/* Pro */}
        <div className="rounded-2xl bg-white p-5 text-left" style={{ border: '2px solid #1A3FD0' }}>
          <div className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest inline-block mb-3" style={{ background: '#F5C018', color: '#0B1627' }}>
            Most Popular
          </div>
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-black text-lg" style={{ color: '#0B1627' }}>Pro</p>
              <p className="text-xs" style={{ color: '#9AAABB' }}>With Bookkeeping Support.</p>
            </div>
            <p className="font-black text-2xl" style={{ color: '#0B1627', fontFamily: 'var(--font-geist-mono, monospace)' }}>₱1,500<span className="text-sm font-semibold">/mo</span></p>
          </div>
          <a
            href="https://m.me/sigurado"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center font-bold text-sm py-3.5 rounded-xl"
            style={{ background: '#1A3FD0', color: '#ffffff' }}
          >
            Message us to upgrade
          </a>
        </div>
      </div>

      <p className="mt-8 text-xs" style={{ color: '#9AAABB' }}>
        Questions?{' '}
        <a href="https://m.me/sigurado" target="_blank" rel="noopener noreferrer" className="underline">
          Message us on Messenger
        </a>
        {' '}— 9am–4pm.
      </p>

      <Link href="/login" className="mt-4 text-xs underline" style={{ color: '#9AAABB' }}>
        Sign in to a different account
      </Link>
    </div>
  )
}
