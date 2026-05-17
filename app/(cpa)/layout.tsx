import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import Link from 'next/link'

export default async function CpaLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user || user.role !== 'CPA') redirect('/')

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col py-6 px-4 gap-1 shrink-0">
        <div className="font-bold text-sm text-primary mb-4 px-2">SiguradoPH CPA</div>
        <Link href="/cpa/clinics" className="px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
          My Clinics
        </Link>
        <div className="flex-1" />
        <div className="text-xs text-muted-foreground px-2 truncate">{user.email}</div>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
            Log out
          </button>
        </form>
      </aside>
      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
