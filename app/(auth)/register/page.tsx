import Image from 'next/image'

export default function RegisterPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#cfe2f8]">
      <Image
        src="/images/login-image.png"
        alt="Sigurado register"
        width={954}
        height={1635}
        priority
        className="h-screen w-auto max-w-full object-contain"
      />
    </main>
  )
}
