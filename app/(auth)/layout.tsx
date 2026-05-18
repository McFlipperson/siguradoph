export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-y-auto bg-background px-4 py-12 flex flex-col items-center justify-start sm:justify-center">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
