'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

// ─── Confetti ─────────────────────────────────────────────────────────────────

const COLORS = ['#1e40af', '#dc2626', '#f59e0b', '#ffffff', '#3b82f6', '#ef4444', '#fcd34d']

type Piece = {
  id: number
  color: string
  left: string
  width: string
  height: string
  delay: string
  duration: string
  rotation: string
}

function generatePieces(n: number): Piece[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    left: `${Math.random() * 100}%`,
    width: `${6 + Math.random() * 8}px`,
    height: `${8 + Math.random() * 8}px`,
    delay: `${Math.random() * 2.5}s`,
    duration: `${2.5 + Math.random() * 2}s`,
    rotation: `${Math.random() * 360}deg`,
  }))
}

function Confetti() {
  const [pieces] = useState<Piece[]>(() => generatePieces(70))

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti-piece {
          position: fixed;
          top: -20px;
          border-radius: 2px;
          animation: confettiFall linear forwards;
          pointer-events: none;
          z-index: 100;
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            backgroundColor: p.color,
            left: p.left,
            width: p.width,
            height: p.height,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `rotate(${p.rotation})`,
          }}
        />
      ))}
    </>
  )
}

// ─── CelebrationStep ──────────────────────────────────────────────────────────

type Props = {
  clinicName: string
  onComplete: () => Promise<void>
  isSaving: boolean
  selectedPlan?: string | null
}

export function CelebrationStep({ clinicName, onComplete, isSaving, selectedPlan }: Props) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    // Small delay so they see the screen before confetti starts
    const t = setTimeout(() => setShowConfetti(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-between relative overflow-hidden">

      {showConfetti && <Confetti />}

      {/* Flag video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      >
        <source src="/videos/ph-flag.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-900/70 to-blue-950/90" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 text-center py-16 space-y-6">

        {/* Sigurado wordmark */}
        <Image
          src="/images/sig-final-ph-logo.png"
          alt="Sigurado"
          width={240}
          height={72}
          className="drop-shadow-2xl"
        />

        {/* Celebration text */}
        <div className="space-y-2">
          <div className="text-6xl">🎉</div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            You&apos;re all set!
          </h1>
          <p className="text-white/80 text-lg">
            Welcome to Sigurado
          </p>
        </div>

        {/* Clinic name badge */}
        <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-6 py-4">
          <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Your clinic is live</p>
          <p className="text-white font-bold text-xl">{clinicName}</p>
        </div>

        {/* What to do first */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-4 text-left space-y-2 w-full max-w-sm">
          <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">First steps</p>
          {[
            '🧑‍⚕️  Add your first patient',
            '📋  Record a visit',
            '🧾  Issue a receipt',
          ].map(step => (
            <p key={step} className="text-white text-sm">{step}</p>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 w-full px-6 pb-12">
        <button
          onClick={onComplete}
          disabled={isSaving}
          className="w-full min-h-[56px] rounded-2xl bg-amber-400 text-blue-900 font-bold text-lg flex items-center justify-center gap-2 shadow-2xl active:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSaving ? 'Setting up…' : (selectedPlan === 'basic' || selectedPlan === 'pro') ? (
            <>Complete your upgrade <ArrowRight className="w-5 h-5" /></>
          ) : (
            <>Add your first patient <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </div>

    </div>
  )
}
