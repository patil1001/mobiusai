"use client"
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'
import Link from 'next/link'

interface MagneticButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export default function MagneticButton({ href, children, variant = 'primary' }: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springX = useSpring(x, { stiffness: 150, damping: 15 })
  const springY = useSpring(y, { stiffness: 150, damping: 15 })

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.3)
    y.set((e.clientY - centerY) * 0.3)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }

  const isPrimary = variant === 'primary'

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className="relative"
    >
      <Link
        ref={ref}
        href={href}
        className={`
          group relative px-10 py-4 rounded-xl font-semibold text-lg overflow-hidden block
          ${isPrimary 
            ? 'bg-primary text-white shadow-[0_10px_40px_rgba(230,0,122,0.4)]' 
            : 'border-2 border-white/20 backdrop-blur-sm'
          }
        `}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Shimmer effect */}
        {isPrimary && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: isHovered ? [-200, 200] : [-200, -200],
            }}
            transition={{
              duration: 1.5,
              repeat: isHovered ? Infinity : 0,
              ease: "easeInOut"
            }}
            style={{
              transform: 'skewX(-20deg)',
            }}
          />
        )}

        {/* Gradient overlay on hover */}
        <motion.div
          className={`absolute inset-0 ${isPrimary ? 'bg-gradient-to-r from-primary-light to-secondary' : 'bg-primary/10'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Expanding circle effect */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              background: isPrimary 
                ? 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)' 
                : 'radial-gradient(circle, rgba(230, 0, 122, 0.3) 0%, transparent 70%)',
            }}
          />
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2 justify-center">
          {children}
          {isPrimary && (
            <motion.svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              animate={{ x: isHovered ? [0, 5, 0] : 0 }}
              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </motion.svg>
          )}
        </span>

        {/* Glow effect */}
        {isPrimary && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            animate={{
              boxShadow: isHovered 
                ? '0 0 30px rgba(230, 0, 122, 0.6), 0 0 60px rgba(230, 0, 122, 0.3)' 
                : '0 10px 40px rgba(230, 0, 122, 0.4)'
            }}
            transition={{ duration: 0.3 }}
          />
        )}
      </Link>
    </motion.div>
  )
}

