'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'sigurado.xyz'

export function QRSection({ clinicId, slug }: { clinicId: string; slug?: string | null }) {
  const intakeUrl = slug
    ? `https://${slug}.${ROOT_DOMAIN}/intake`
    : `https://${ROOT_DOMAIN}/intake/${clinicId}`

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrReady, setQrReady] = useState(false)

  useEffect(() => {
    setQrReady(false)
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, intakeUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' },
    }).then(() => setQrReady(true))
  }, [intakeUrl])

  function handleCopy() {
    navigator.clipboard.writeText(intakeUrl).then(() => {
      toast.success('Link copied to clipboard')
    })
  }

  function handleDownload() {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = 'patient-intake-qr.png'
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Patient Intake Form</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Display this QR code in your waiting room. Patients scan it to fill
          out their intake form.
        </p>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-3 border rounded-xl bg-white inline-block">
            <canvas ref={canvasRef} className={qrReady ? '' : 'opacity-0'} />
          </div>
        </div>

        {/* URL display */}
        <div className="bg-muted rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground mb-0.5">Intake link</p>
          <p className="text-sm font-mono break-all">{intakeUrl}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 min-h-[48px]"
            onClick={handleCopy}
          >
            Copy link
          </Button>
          <Button
            className="flex-1 min-h-[48px]"
            onClick={handleDownload}
            disabled={!qrReady}
          >
            Download QR Code
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
