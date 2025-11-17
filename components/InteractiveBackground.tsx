"use client"
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function InteractiveBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      
      // Add particle trail
      const newParticle = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY
      }
      setParticles(prev => [...prev.slice(-15), newParticle])
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <>
      {/* Interactive gradient that follows cursor */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(230, 0, 122, 0.15), transparent 40%)`
        }}
        transition={{ type: "tween", ease: "linear", duration: 0.2 }}
      />

      {/* Mesh gradient overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <motion.div
          className="absolute w-full h-full"
          animate={{
            background: typeof window !== 'undefined' 
              ? `radial-gradient(at ${(mousePosition.x / window.innerWidth) * 100}% ${(mousePosition.y / window.innerHeight) * 100}%, 
              rgba(230, 0, 122, 0.2) 0%, 
              rgba(85, 43, 191, 0.15) 30%, 
              rgba(0, 178, 255, 0.1) 60%, 
              transparent 80%)`
              : `radial-gradient(at 50% 50%, 
              rgba(230, 0, 122, 0.2) 0%, 
              rgba(85, 43, 191, 0.15) 30%, 
              rgba(0, 178, 255, 0.1) 60%, 
              transparent 80%)`
          }}
          transition={{ type: "tween", ease: "linear", duration: 0.3 }}
        />
      </div>

      {/* Cursor trail particles */}
      {particles.map((particle, i) => (
        <motion.div
          key={particle.id}
          className="fixed w-2 h-2 rounded-full pointer-events-none z-0"
          style={{
            left: particle.x,
            top: particle.y,
            background: `rgba(230, 0, 122, ${0.8 - i * 0.05})`
          }}
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      ))}

      {/* Interactive dots grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(20)].map((_, i) => {
          const x = (i % 5) * 25
          const y = Math.floor(i / 5) * 25
          const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
          const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1080
          const distance = Math.hypot(
            mousePosition.x - (x * windowWidth / 100),
            mousePosition.y - (y * windowHeight / 100)
          )
          const scale = Math.max(0.5, 1 - distance / 500)
          const opacity = Math.max(0.1, 1 - distance / 400)

          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary"
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
              animate={{
                scale: scale,
                opacity: opacity,
              }}
              transition={{ type: "spring", stiffness: 150, damping: 15 }}
            />
          )
        })}
      </div>
    </>
  )
}

