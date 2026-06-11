'use client'

import { useState } from 'react'
import { Info, X } from 'lucide-react'

interface InfoSheetProps {
  title: string
  children: React.ReactNode
}

export function InfoSheet({ title, children }: InfoSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-foreground shrink-0"
        aria-label={`Info about ${title}`}
      >
        <Info className="w-4 h-4" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />
          {/* Bottom sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background border-t shadow-xl p-5 space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">{title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              {children}
            </div>
          </div>
        </>
      )}
    </>
  )
}
