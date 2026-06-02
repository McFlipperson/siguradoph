'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

/**
 * Draw-and-save signature pad. Uploads the drawn PNG to the existing
 * `clinic-logos` storage bucket and returns a public URL via onChange.
 * Used at onboarding and in Settings; the saved image prints on certificates.
 */
export function SignaturePad({
  value,
  onChange,
}: {
  value: string | null
  onChange: (url: string | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [editing, setEditing] = useState(!value)
  const [uploading, setUploading] = useState(false)
  const [hasInk, setHasInk] = useState(false)

  useEffect(() => {
    if (!editing) return
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0B1627'
  }, [editing])

  function point(e: React.MouseEvent | React.TouchEvent) {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    const t = 'touches' in e ? e.touches[0] : e
    return { x: (t.clientX - r.left) * (c.width / r.width), y: (t.clientY - r.top) * (c.height / r.height) }
  }
  function start(e: React.MouseEvent | React.TouchEvent) {
    drawing.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = point(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setHasInk(true)
  }
  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = point(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }
  function end() { drawing.current = false }

  function clear() {
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, c.width, c.height)
    setHasInk(false)
  }

  async function save() {
    if (!hasInk) { toast.error('Please draw your signature first'); return }
    setUploading(true)
    try {
      const blob: Blob = await new Promise((res, rej) =>
        canvasRef.current!.toBlob((b) => (b ? res(b) : rej(new Error('Could not capture signature'))), 'image/png')
      )
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const path = `${user.id}/signature.png`
      const { error } = await supabase.storage.from('clinic-logos').upload(path, blob, { upsert: true, contentType: 'image/png' })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('clinic-logos').getPublicUrl(path)
      onChange(`${publicUrl}?t=${Date.now()}`) // cache-bust on re-save
      setEditing(false)
      toast.success('Signature saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (!editing && value) {
    return (
      <div className="flex items-center gap-4">
        <div className="border rounded-lg bg-white p-2 shrink-0">
          <Image src={value} alt="Signature" width={200} height={70} className="h-16 w-auto object-contain" unoptimized />
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => { setHasInk(false); setEditing(true) }}>Redraw</Button>
          <Button type="button" variant="ghost" className="min-h-[40px] text-destructive hover:text-destructive" onClick={() => onChange(null)}>Remove</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={500}
        height={160}
        className="w-full border-2 border-dashed border-input rounded-lg bg-white"
        style={{ touchAction: 'none' }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1 min-h-[44px]" onClick={clear} disabled={uploading}>Clear</Button>
        <Button type="button" className="flex-1 min-h-[44px]" onClick={save} disabled={uploading}>{uploading ? 'Saving…' : 'Save signature'}</Button>
      </div>
      <p className="text-xs text-muted-foreground">Sign with your finger, stylus, or mouse.</p>
    </div>
  )
}
