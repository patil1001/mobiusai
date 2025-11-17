"use client"
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import TabsHeader from '@/components/TabsHeader'
import ChatPanel from '@/components/chat/ChatPanel'
import SpecPanel from '@/components/panels/SpecPanel'
import CodePanel from '@/components/panels/CodePanel'
import DraftPanel from '@/components/panels/DraftPanel'
import LivePanel from '@/components/panels/LivePanel'

export type PanelKey = 'chat' | 'spec' | 'code' | 'draft' | 'live'

export default function Dashboard() {
  const [active, setActive] = useState<PanelKey[]>(['chat'])

  const toggle = (key: PanelKey) => {
    setActive(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  return (
    <main className="h-screen w-full grid" style={{ gridTemplateColumns: '280px 1fr' }}>
      <Sidebar />
      <section className="h-full flex flex-col">
        <TabsHeader active={active} onToggle={toggle} />
        <div className="flex-1 grid gap-2 p-2" style={{ gridTemplateColumns: `repeat(${active.length || 1}, minmax(0,1fr))` }}>
          {active.includes('chat') && <div className="glass rounded-lg overflow-hidden"><ChatPanel /></div>}
          {active.includes('spec') && <div className="glass rounded-lg overflow-hidden"><SpecPanel /></div>}
          {active.includes('code') && <div className="glass rounded-lg overflow-hidden"><CodePanel /></div>}
          {active.includes('draft') && <div className="glass rounded-lg overflow-hidden"><DraftPanel /></div>}
          {active.includes('live') && <div className="glass rounded-lg overflow-hidden"><LivePanel /></div>}
        </div>
      </section>
    </main>
  )
}

