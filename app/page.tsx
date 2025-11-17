import AnimatedHero from '@/components/AnimatedHero'
import InteractiveBackground from '@/components/InteractiveBackground'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-black min-h-screen">
      {/* Interactive cursor-following background */}
      <InteractiveBackground />
      
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      {/* Clean Navigation */}
      <nav className="relative mx-auto max-w-7xl px-6 py-5 flex items-center justify-between border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 transition-all duration-300 group-hover:scale-110">
            <Image 
              src="/logo.png" 
              alt="MobiusAI" 
              width={40} 
              height={40}
              className="object-contain drop-shadow-[0_0_10px_rgba(230,0,122,0.4)] group-hover:drop-shadow-[0_0_15px_rgba(230,0,122,0.6)]"
            />
          </div>
          <span className="font-bold text-xl text-white group-hover:text-primary transition-colors duration-300">
            MobiusAI
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link 
            href="/signin" 
            className="hidden sm:block text-white/70 hover:text-white font-medium transition-colors duration-200"
          >
            Sign in
          </Link>
          <Link 
            href="/signup" 
            className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-light transition-all duration-200 shadow-lg hover:shadow-primary/50"
          >
            Get started
          </Link>
        </div>
      </nav>
      
      <AnimatedHero />
    </main>
  )
}

