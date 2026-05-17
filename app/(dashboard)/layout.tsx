export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-screen-sm mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
