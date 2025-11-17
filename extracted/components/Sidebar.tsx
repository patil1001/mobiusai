"use client"
import { useEffect, useState } from 'react'

type Chat = { id: string; title: string }

export default function Sidebar() {
  const [chats, setChats] = useState<Chat[]>([])

  useEffect(() => {
    const data = typeof window !== 'undefined' ? localStorage.getItem('mobius.chats') : null
    if (data) setChats(JSON.parse(data))
  }, [])

  const add = () => {
    const chat = { id: crypto.randomUUID(), title: 'New chat' }
    const next = [chat, ...chats]
    setChats(next)
    localStorage.setItem('mobius.chats', JSON.stringify(next))
  }

  return (
    <aside className="h-full border-r border-white/10 p-2 flex flex-col">
      <button onClick={add} className="mb-2 h-10 rounded-md bg-primary text-black font-semibold">New</button>
      <div className="flex-1 overflow-y-auto space-y-1">
        {chats.map(c => (
          <div key={c.id} className="px-3 py-2 rounded-md hover:bg-white/5 cursor-pointer border border-white/10">
            {c.title}
          </div>
        ))}
      </div>
    </aside>
  )
}

