"use client"
import { useEffect, useRef, useState } from 'react'

type Msg = { id: string; role: 'user' | 'assistant'; content: string; imageUrl?: string }

export default function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [image, setImage] = useState<string | undefined>()
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const data = typeof window !== 'undefined' ? localStorage.getItem('mobius.messages') : null
    if (data) setMessages(JSON.parse(data))
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobius.messages', JSON.stringify(messages))
    }
  }, [messages])

  const onSend = async () => {
    if (!input.trim() && !image) return
    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: input, imageUrl: image }
    setMessages(prev => [...prev, userMsg])
    setInput(''); setImage(undefined)

    const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ messages: [...messages, userMsg] }) })
    const data = await res.json()
    const ai: Msg = { id: crypto.randomUUID(), role: 'assistant', content: data.reply }
    setMessages(prev => [...prev, ai])
  }

  const onPick = async (file: File) => {
    const url = URL.createObjectURL(file)
    setImage(url)
  }

  return (
    <div className="h-full flex flex-col">
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`max-w-3xl ${m.role === 'user' ? 'ml-auto' : ''}`}>
            <div className={`px-4 py-3 rounded-xl ${m.role === 'user' ? 'bg-primary text-black' : 'bg-white/5'}`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.imageUrl && (
                <img src={m.imageUrl} alt="upload" className="mt-2 rounded-lg max-h-64" />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer px-3 h-11 rounded-md border border-white/15 grid place-items-center">+
            <input type="file" className="hidden" accept="image/*" onChange={e => { const f=e.target.files?.[0]; if (f) onPick(f) }} />
          </label>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter instruction or question..."
            className="flex-1 h-11 px-4 rounded-md bg-black/40 border border-white/10 outline-none"
          />
          <button onClick={onSend} className="h-11 px-4 rounded-md bg-primary text-black font-semibold">↑</button>
        </div>
        {image && <div className="mt-2 text-sm opacity-70">Image attached</div>}
      </div>
    </div>
  )
}

