'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#cfe2f8]">
      {/* Wrapper matches the rendered image size; children positioned with
          % coordinates track the image as it scales. */}
      <div className="relative h-screen">
        <Image
          src="/images/login-image.png"
          alt="Sigurado login"
          width={954}
          height={1635}
          priority
          className="h-screen w-auto max-w-full object-contain"
        />

        {/* ── Email (confirmed good) ──────────────────────────── */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="absolute rounded-[14px] bg-white text-gray-800 text-[1.6vh] outline-none focus:ring-2 focus:ring-blue-300"
          style={{ left: '20.5%', width: '57.5%', top: '41.2%', height: '3.6%', paddingLeft: '12%', paddingRight: '4%' }}
        />

        {/* ── Password ────────────────────────────────────────── */}
        <input
          type={showPass ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="current-password"
          className="absolute rounded-[14px] bg-white text-gray-800 text-[1.6vh] outline-none focus:ring-2 focus:ring-blue-300"
          style={{ left: '20.5%', width: '57.5%', top: '49.4%', height: '3.6%', paddingLeft: '12%', paddingRight: '12%' }}
        />
        {/* Show / hide toggle over the drawn eye icon */}
        <button
          type="button"
          aria-label="Toggle password visibility"
          onClick={() => setShowPass((v) => !v)}
          className="absolute"
          style={{ left: '70%', width: '8%', top: '49.4%', height: '3.6%' }}
        />

        {/* ── Remember me (transparent clickable over the checkbox + label) ── */}
        <button
          type="button"
          aria-label="Toggle remember me"
          aria-pressed={remember}
          onClick={() => setRemember((v) => !v)}
          className="absolute"
          style={{ left: '20.5%', width: '28%', top: '54.4%', height: '3.2%' }}
        />

        {/* ── Forgot password ─────────────────────────────────── */}
        <button
          type="button"
          aria-label="Forgot password"
          onClick={() => { /* TODO: wire reset */ }}
          className="absolute"
          style={{ left: '60%', width: '18%', top: '54.4%', height: '3.2%' }}
        />

        {/* ── Log in button (transparent, over the drawn blue button) ── */}
        <button
          type="button"
          aria-label="Log in"
          onClick={() => { /* TODO: wire sign-in */ }}
          className="absolute active:opacity-80"
          style={{ left: '20.5%', width: '57.5%', top: '58.7%', height: '3.8%' }}
        />
      </div>
    </main>
  )
}
