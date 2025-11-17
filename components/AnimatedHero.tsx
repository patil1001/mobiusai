"use client"
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import MagneticButton from './MagneticButton'

export default function AnimatedHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Animated gradient orbs with parallax */}
      <motion.div className="absolute inset-0 opacity-30 blur-3xl" style={{ opacity }}>
        <motion.div
          className="w-[500px] h-[500px] rounded-full bg-primary/50 absolute top-20 left-10"
          animate={{ 
            x: [0, 100, 0], 
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
        />
        <motion.div
          className="w-[400px] h-[400px] rounded-full bg-secondary/40 absolute bottom-20 right-10"
          animate={{ 
            x: [0, -80, 0], 
            y: [0, 50, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Hero Section */}
      <motion.div 
        className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-32"
        style={{ scale }}
      >
        {/* Animated Logo with 3D effect */}
        <motion.div
          className="mb-12 flex justify-center"
          initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        >
          <motion.div 
            className="relative w-32 h-32 md:w-40 md:h-40 group cursor-pointer"
            whileHover={{ scale: 1.1, rotateY: 15, rotateX: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-3xl opacity-40 group-hover:opacity-80 transition-opacity duration-700" />
            <Image 
              src="/logo.png" 
              alt="MobiusAI" 
              width={160} 
              height={160}
              className="relative object-contain drop-shadow-[0_0_30px_rgba(230,0,122,0.6)] group-hover:drop-shadow-[0_0_50px_rgba(230,0,122,1)] transition-all duration-700"
            />
          </motion.div>
        </motion.div>

        {/* Main headline with stagger animation */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="text-center"
        >
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] max-w-6xl mx-auto"
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <motion.span 
              className="block text-white mb-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Build Polkadot dApps
            </motion.span>
            <motion.span 
              className="block bg-gradient-to-r from-primary via-primary-light to-secondary bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: '200% 200%' }}
            >
              at the speed of thought
            </motion.span>
          </motion.h1>

          <motion.p
            className="mt-8 text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            Transform your idea into a <span className="text-primary font-semibold">production‑ready</span> full‑stack dApp in seconds.
            <br className="hidden md:block" />
            AI‑powered specification, code generation, and live deployment.
          </motion.p>

          {/* Magnetic CTA Buttons */}
          <motion.div 
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <MagneticButton href="/dashboard" variant="primary">
              Launch Studio
            </MagneticButton>
            <MagneticButton href="/signin" variant="secondary">
              Sign in
            </MagneticButton>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Features Section with scroll animations */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-32 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to Build
            <span className="text-primary"> Faster</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            From idea to production in minutes, not months. Built for developers who demand speed without sacrificing quality.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: 'AI-Powered Code Generation', 
              desc: 'Advanced AI generates production-ready TypeScript, React, and smart contracts following industry best practices.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              ),
              delay: 0
            },
            { 
              title: 'Instant Live Preview', 
              desc: 'See your dApp running live in an isolated environment within seconds. Test, iterate, and deploy with confidence.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ),
              delay: 0.2
            },
            { 
              title: 'Full-Stack Integration', 
              desc: 'Complete authentication, database schemas, API routes, and UI components. Everything connected and ready to use.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              ),
              delay: 0.4
            },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: feature.delay }}
              whileHover={{ y: -10 }}
              className="group relative p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:border-primary/40 hover:bg-white/10 transition-all duration-500 overflow-hidden"
            >
              {/* Animated gradient on hover */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              
              <div className="relative z-10">
                {/* Icon with background */}
                <motion.div 
                  className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="font-bold text-xl mb-3 text-white group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                <p className="text-sm text-white/60 group-hover:text-white/80 leading-relaxed transition-colors duration-300">{feature.desc}</p>
              </div>

              {/* Glow orb in corner */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/40 transition-all duration-500" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-32 border-t border-white/5">
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          How It <span className="text-primary">Works</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          {[
            { step: '01', title: 'Describe Your Idea', desc: 'Tell us what you want to build in plain English' },
            { step: '02', title: 'AI Generates Code', desc: 'Advanced AI creates your complete dApp with best practices' },
            { step: '03', title: 'Review & Preview', desc: 'See your app running live, make changes instantly' },
            { step: '04', title: 'Deploy & Scale', desc: 'Publish to production when ready, iterate as you grow' },
          ].map((item, i) => (
            <motion.div 
              key={i}
              className="relative"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              {/* Step number with gradient */}
              <motion.div 
                className="relative mb-6"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="absolute inset-0 bg-primary/20 blur-xl" />
                <div className="relative text-7xl font-bold bg-gradient-to-br from-primary to-primary-light bg-clip-text text-transparent opacity-30">
                  {item.step}
                </div>
              </motion.div>
              
              <h3 className="font-bold text-lg mb-2 text-white">{item.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
              
              {/* Step indicator dot */}
              <motion.div 
                className="absolute top-12 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-black hidden md:block"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.3, type: "spring" }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tech Stack with hover effects */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-32 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Production-Ready <span className="text-primary">Tech Stack</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Every dApp built with enterprise-grade technologies and Web3 best practices
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {[
            'Next.js 14', 'TypeScript', 'Prisma ORM', 'NextAuth',
            'Tailwind CSS', 'Polkadot.js', 'PostgreSQL', 'Docker'
          ].map((tech, i) => (
            <motion.div 
              key={i}
              className="group relative px-6 py-4 rounded-lg border border-white/10 bg-white/5 text-center font-medium overflow-hidden"
              whileHover={{ scale: 1.05, borderColor: 'rgba(230, 0, 122, 0.4)' }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
              <span className="relative z-10">{tech}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-32 border-t border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '<60s', label: 'Build Time' },
            { value: '100%', label: 'Type Safe' },
            { value: '90+', label: 'Auto-Fixes' },
            { value: '24/7', label: 'Available' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, type: "spring" }}
              whileHover={{ scale: 1.1 }}
              className="group"
            >
              <motion.div 
                className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-2"
                whileHover={{ 
                  textShadow: "0 0 20px rgba(230, 0, 122, 0.5)" 
                }}
              >
                {stat.value}
              </motion.div>
              <div className="text-white/60 text-sm font-medium group-hover:text-white/80 transition-colors">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Final CTA with glassmorphism */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-20 md:py-32 text-center border-t border-white/5">
        <motion.div
          className="relative p-12 md:p-16 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: '200% 200%' }}
          />

          <div className="relative z-10">
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-6"
              whileInView={{ scale: [0.95, 1] }}
              transition={{ duration: 0.5 }}
            >
              Ready to Build Your dApp?
            </motion.h2>
            <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
              Join developers building the future of Web3 with AI-powered tools
            </p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              whileInView={{ y: [20, 0], opacity: [0, 1] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <MagneticButton href="/dashboard" variant="primary">
                Get Started Free
              </MagneticButton>
              <MagneticButton href="/signin" variant="secondary">
                View Demo
              </MagneticButton>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? 'rgba(230, 0, 122, 0.4)' : i % 3 === 1 ? 'rgba(85, 43, 191, 0.3)' : 'rgba(0, 178, 255, 0.3)'
            }}
            animate={{
              y: [0, -150, 0],
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  )
}
