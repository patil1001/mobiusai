"use client"
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AnimatedHero() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 blur-3xl">
        <motion.div
          className="w-96 h-96 rounded-full bg-primary/40 absolute -top-20 -left-10"
          animate={{ x: [0, 40, -20, 0], y: [0, -20, 30, 0] }}
          transition={{ repeat: Infinity, duration: 12 }}
        />
        <motion.div
          className="w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/30 absolute -bottom-24 right-0"
          animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0] }}
          transition={{ repeat: Infinity, duration: 14 }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-28 pb-20 text-center">
        <motion.h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Build Polkadot dApps at the speed of thought
        </motion.h1>
        <motion.p
          className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          MobiusAI turns your idea into a working full‑stack dApp — spec, code,
          and draft deploy — powered by GPT‑5 class reasoning via Groq and Azure.
        </motion.p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/dashboard" className="px-5 py-3 rounded-md bg-primary text-black font-semibold">
            Launch Studio
          </Link>
          <Link href="/signin" className="px-5 py-3 rounded-md border border-white/15">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

