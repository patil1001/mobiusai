import AnimatedHero from '@/components/AnimatedHero'
import Link from 'next/link'

export default function Home() {
  return (
    <main>
      <nav className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-xl">MobiusAI</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/signin" className="opacity-80 hover:opacity-100">Sign in</Link>
          <Link href="/signup" className="px-3 py-1.5 rounded-md bg-primary text-black font-semibold">Get started</Link>
        </div>
      </nav>
      <AnimatedHero />
    </main>
  )
}

