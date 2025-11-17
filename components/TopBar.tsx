"use client"
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'

export default function TopBar() {
  const { data: session } = useSession()
  const [avatar, setAvatar] = useState<string | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const user = {
    name: session?.user?.name || 'Guest',
    email: session?.user?.email || undefined,
    image: session?.user?.image || avatar
  }

  const onAvatarPick = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="h-14 px-6 border-b border-white/5 flex items-center justify-between bg-black">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative w-8 h-8 transition-all duration-300 group-hover:scale-110">
          <Image 
            src="/logo.png" 
            alt="MobiusAI" 
            width={32} 
            height={32}
            className="object-contain drop-shadow-[0_0_8px_rgba(230,0,122,0.4)] group-hover:drop-shadow-[0_0_12px_rgba(230,0,122,0.6)]"
          />
        </div>
        <span className="font-bold text-lg text-white group-hover:text-primary transition-colors duration-300">
          MobiusAI
        </span>
      </Link>
      <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <button className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/40 overflow-hidden hover:scale-110 hover:shadow-[0_0_20px_rgba(230,0,122,0.7)] transition-all duration-300">
          {user.image ? (
            <img src={user.image} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary font-bold">
              {user.name[0]?.toUpperCase()}
            </div>
          )}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-72 glass rounded-xl p-5 z-20 border border-primary/30 shadow-[0_8px_32px_rgba(230,0,122,0.3)]">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/40 overflow-hidden">
                {user.image ? (
                  <img src={user.image} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xl">
                    {user.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold text-base">{user.name}</div>
                <div className="text-sm opacity-70">{user.email || 'No email'}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button 
                onClick={() => inputRef.current?.click()} 
                className="px-3 py-2 text-sm rounded-lg border border-white/15 hover:bg-white/5 hover:border-primary/50 transition-all duration-200"
              >
                Edit avatar
              </button>
              <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={e => { const f=e.target.files?.[0]; if (f) onAvatarPick(f) }} />
              <button 
                onClick={() => signOut({ callbackUrl: '/signin' })} 
                className="ml-auto px-3 py-2 text-sm rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

