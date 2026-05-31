'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Page = { id: string; name: string }

export default function PickPagePage() {
  const router = useRouter()
  const [pages, setPages] = useState<Page[]>([])
  const [selecting, setSelecting] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/auth/facebook/pick-page-data')
      .then(r => r.json())
      .then((d: { pages?: Page[] }) => {
        if (d.pages?.length) setPages(d.pages)
        else setError(true)
      })
      .catch(() => setError(true))
  }, [])

  async function handleSelect(pageId: string) {
    setSelecting(pageId)
    const res = await fetch('/api/auth/facebook/select-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId }),
    })
    const data = await res.json() as { redirect?: string; error?: string }
    if (data.redirect) {
      router.push(data.redirect)
    } else {
      setError(true)
      setSelecting(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold font-heading">Choose your clinic&apos;s Facebook Page</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select the Facebook Page patients will message to connect with your clinic.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive">Something went wrong. Please go back and try again.</p>
        )}

        {pages.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">Loading your pages…</p>
        )}

        <div className="flex flex-col gap-3">
          {pages.map(page => (
            <Card key={page.id} className="cursor-pointer active:opacity-80">
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <p className="font-medium text-sm">{page.name}</p>
                </div>
                <Button
                  size="sm"
                  disabled={selecting !== null}
                  onClick={() => handleSelect(page.id)}
                  className="min-h-[40px] min-w-[80px]"
                >
                  {selecting === page.id ? 'Connecting…' : 'Select'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
