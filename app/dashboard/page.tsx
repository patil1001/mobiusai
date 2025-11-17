"use client"
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import TabsHeader from '@/components/TabsHeader'
import ChatPanel from '@/components/chat/ChatPanel'
import SpecPanel from '@/components/panels/SpecPanel'
import CodePanel from '@/components/panels/CodePanel'
import DraftPanel from '@/components/panels/DraftPanel'
import LivePanel from '@/components/panels/LivePanel'
import TopBar from '@/components/TopBar'
import { useRouter } from 'next/navigation'
export const dynamic = 'force-dynamic'

export type PanelKey = 'chat' | 'spec' | 'code' | 'draft' | 'live'

export default function Dashboard() {
  const [active, setActive] = useState<PanelKey[]>(['chat'])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()

  const toggle = (key: PanelKey) => {
    setActive(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  return (
    <main className="h-screen w-full flex overflow-hidden">
      {/* Collapsible Sidebar */}
      <div 
        className={`h-full transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[280px]' : 'w-0'} overflow-hidden`}
      >
        <Sidebar />
      </div>
      
      {/* Main content area */}
      <section className="h-full flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        {/* Sidebar toggle button */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-3 py-1.5 rounded-md border border-white/15 hover:bg-white/5 transition-colors text-sm flex items-center gap-2"
            title={sidebarOpen ? 'Hide history' : 'Show history'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {sidebarOpen ? 'Hide' : 'Show'} History
          </button>
        </div>
        
        <TabsHeader active={active} onToggle={toggle} />
        
        {/* Panels grid - now with proper overflow handling */}
        <div className="flex-1 grid gap-2 p-2 overflow-hidden" style={{ gridTemplateColumns: `repeat(${active.length || 1}, minmax(0,1fr))` }}>
          {active.includes('chat') && <div className="glass rounded-lg overflow-hidden flex flex-col h-full"><ChatPanel /></div>}
          {active.includes('spec') && <div className="glass rounded-lg overflow-hidden flex flex-col h-full"><SpecPanel /></div>}
          {active.includes('code') && <div className="glass rounded-lg overflow-hidden flex flex-col h-full"><CodePanel /></div>}
          {active.includes('draft') && <div className="glass rounded-lg overflow-hidden flex flex-col h-full"><DraftPanel /></div>}
          {active.includes('live') && <div className="glass rounded-lg overflow-hidden flex flex-col h-full"><LivePanel /></div>}
        </div>
      </section>
    </main>
  )
}

