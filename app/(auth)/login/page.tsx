'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#cfe2f8]">
      {/* Wrapper is exactly the rendered size of the image, so the input
          positioned with % coordinates tracks the image as it scales. */}
      <div className="relative h-screen">
        <Image
          src="/images/login-image.png"
          alt="Sigurado login"
          width={954}
          height={1635}
          priority
          className="h-screen w-auto max-w-full object-contain"
        />

        {/* Floating email input — positioned over the drawn email box.
            TUNE these 4 values until it lines up perfectly:
              left  = distance from left edge of image (% of image width)
              width = box width (% of image width)
              top   = distance from top of image (% of image height)
              height= box height (% of image height) */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="absolute rounded-[14px] bg-white text-gray-800 text-[1.6vh] outline-none focus:ring-2 focus:ring-blue-300"
          style={{
            left: '20.5%',
            width: '57.5%',
            top: '41.2%',
            height: '3.6%',
            paddingLeft: '12%',
            paddingRight: '4%',
          }}
        />
      </div>
    </main>
  )
}
