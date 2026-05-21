export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen overflow-y-auto px-4 py-12 flex flex-col items-center justify-start sm:justify-center"
      style={{
        background: 'linear-gradient(145deg, oklch(0.93 0.05 240) 0%, oklch(0.985 0.006 240) 45%, oklch(0.94 0.04 260) 100%)',
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl shadow-blue-100/60 px-8 py-10 border border-white/80">
        {children}
      </div>
    </div>
  )
}
