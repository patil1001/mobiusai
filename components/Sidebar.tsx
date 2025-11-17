"use client"
import { useEffect, useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { useSession } from 'next-auth/react'

type Chat = { id: string; title: string; createdAt?: string; updatedAt?: string }

export default function Sidebar() {
  const [chats, setChats] = useState<Chat[]>([])
  const { setCurrent } = useProjectStore()
  const { data: session, status } = useSession()

  // CRITICAL: Refetch projects whenever session changes (sign in/out)
  useEffect(() => {
    // Clear projects when not authenticated
    if (status === 'loading') return
    if (status === 'unauthenticated' || !session?.user) {
      setChats([])
      setCurrent(undefined)
      return
    }
    
    // Fetch projects for authenticated user
    ;(async () => {
      try {
        const res = await fetch('/api/projects')
        if (!res.ok) { 
          console.error(`Failed to fetch projects: ${res.status}`)
          setChats([])
          return
        }
        const text = await res.text()
        if (!text) {
          setChats([])
          return
        }
        const data = JSON.parse(text)
        const projects = Array.isArray(data.items) ? data.items : []
        console.log(`Loaded ${projects.length} projects for user ${(session.user as any)?.id}`)
        setChats(projects)
      } catch (err) {
        console.error('Error fetching projects:', err)
        setChats([])
      }
    })()
  }, [session, status, setCurrent]) // CRITICAL: Re-run when session changes

  const add = () => {
    setCurrent(undefined)
  }

  return (
    <aside className="h-full border-r border-white/10 p-2 flex flex-col">
      <button onClick={add} className="mb-2 h-10 rounded-md bg-primary text-black font-semibold">New</button>
      <div className="flex-1 overflow-y-auto space-y-1">
        {chats.map(c => (
          <button key={c.id} onClick={() => setCurrent({ id: c.id, title: c.title })} className="w-full text-left px-3 py-2 rounded-md hover:bg-white/5 border border-white/10">
            <div className="truncate text-sm font-medium">{c.title}</div>
            {c.updatedAt && <div className="text-xs opacity-50">{new Date(c.updatedAt).toLocaleString()}</div>}
          </button>
        ))}
      </div>
    </aside>
  )
}

