"use client"
import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '@/lib/store'

type Msg = { id: string; role: 'user' | 'assistant'; content: string; imageUrl?: string }

export default function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [awaitingName, setAwaitingName] = useState(false)
  const [input, setInput] = useState('')
  const [image, setImage] = useState<string | undefined>()
  const listRef = useRef<HTMLDivElement>(null)
  const { current, setCurrent } = useProjectStore()

  // Load messages when project changes (from sidebar click)
  useEffect(() => {
    if (current?.id && current.id !== projectId) {
      setProjectId(current.id)
      setAwaitingName(false) // Reset when switching projects
      ;(async () => {
        const res = await fetch(`/api/projects/${current.id}/messages`)
        const msgData = await res.json().catch(() => ({ items: [] }))
        setMessages(msgData.items.map((m: any) => ({ id: m.id, role: m.role, content: m.content })))
      })()
    } else if (!current) {
      // New chat - clear everything
      setProjectId(null)
      setMessages([])
      setAwaitingName(false)
    }
  }, [current?.id, projectId])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
    // Don't store messages in localStorage - causes cross-user contamination
    // if (typeof window !== 'undefined') {
    //   localStorage.setItem('mobius.messages', JSON.stringify(messages))
    // }
  }, [messages])

  const onSend = async () => {
    if (!input.trim() && !image) return
    const prompt = input
    setInput(''); setImage(undefined)
    
    // If awaiting name, send as name response
    const requestBody = awaitingName && projectId
      ? { prompt, projectId, isNameResponse: true }
      : { prompt }
    
    const res = await fetch('/api/agent/start', { 
      method: 'POST', 
      headers: { 'content-type': 'application/json' }, 
      body: JSON.stringify(requestBody) 
    })
    
    if (!res.ok) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Sorry, something went wrong starting your build.' }])
      return
    }
    const text = await res.text()
    if (!text) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'No response received from builder. Please try again.' }])
      return
    }
    const data = JSON.parse(text)
    
    // Update awaiting name state
    if (data.awaitingName) {
      setAwaitingName(true)
    } else {
      setAwaitingName(false)
    }
    
    setProjectId(data.projectId)
    setCurrent({ id: data.projectId, title: data.title })
    
    // Load initial messages from DB
    setTimeout(async () => {
      const res = await fetch(`/api/projects/${data.projectId}/messages`)
      const msgData = await res.json().catch(() => ({ items: [] }))
      setMessages(msgData.items.map((m: any) => ({ id: m.id, role: m.role, content: m.content })))
    }, 500)
  }

  useEffect(() => {
    if (!projectId) return
    const es = new EventSource(`/api/projects/${projectId}/events`)
    let lastMessageCount = messages.length
    es.addEventListener('snapshot', (e: MessageEvent) => {
      const payload = JSON.parse(e.data)
      const dbMessages = payload.messages || []
      setMessages(dbMessages.map((m: any) => ({ id: m.id, role: m.role, content: m.content })))
      lastMessageCount = dbMessages.length
    })
    es.addEventListener('update', (e: MessageEvent) => {
      const payload = JSON.parse(e.data)
      const dbMessages = payload.messages || []
      if (dbMessages.length > lastMessageCount) {
        setMessages(dbMessages.map((m: any) => ({ id: m.id, role: m.role, content: m.content })))
        lastMessageCount = dbMessages.length
      }
    })
    return () => es.close()
  }, [projectId, messages.length])

  const onPick = async (file: File) => {
    const url = URL.createObjectURL(file)
    setImage(url)
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Scrollable chat messages - takes remaining space */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-6">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-white/40">
            <p>Start a new conversation or select a project from history</p>
          </div>
        )}
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
      
      {/* Fixed input box at bottom */}
      <div className="sticky bottom-0 bg-[#1a1a1a] p-3 border-t border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer px-3 h-11 rounded-md border border-white/15 grid place-items-center hover:bg-white/5 transition-colors">+
            <input type="file" className="hidden" accept="image/*" onChange={e => { const f=e.target.files?.[0]; if (f) onPick(f) }} />
          </label>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
            placeholder={awaitingName ? "Enter your project name..." : "Enter instruction or question..."}
            className="flex-1 h-11 px-4 rounded-md bg-black/40 border border-white/10 outline-none focus:border-primary/50 transition-colors"
          />
          <button 
            onClick={onSend} 
            disabled={!input.trim() && !image}
            className="h-11 px-4 rounded-md bg-primary text-black font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ↑
          </button>
        </div>
        {image && (
          <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
            <span>Image attached</span>
            <button onClick={() => setImage(undefined)} className="text-red-400 hover:text-red-300">×</button>
          </div>
        )}
      </div>
    </div>
  )
}

