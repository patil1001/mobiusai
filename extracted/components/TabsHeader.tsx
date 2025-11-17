"use client"

export type PanelKey = 'chat' | 'spec' | 'code' | 'draft' | 'live'

type Props = { active: PanelKey[]; onToggle: (k: PanelKey) => void }

const tabs: { key: PanelKey; label: string }[] = [
  { key: 'chat', label: 'chat' },
  { key: 'spec', label: 'spec' },
  { key: 'code', label: 'code' },
  { key: 'draft', label: 'draft' },
  { key: 'live', label: 'live' }
]

export default function TabsHeader({ active, onToggle }: Props) {
  return (
    <header className="flex items-center justify-between px-3 h-14 border-b border-white/10">
      <div className="font-semibold">Waiting for name...</div>
      <nav className="flex items-center gap-2 text-sm">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onToggle(t.key)}
            className={`px-3 py-1.5 rounded-md border ${active.includes(t.key) ? 'bg-primary text-black border-transparent' : 'border-white/15 opacity-80 hover:opacity-100'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  )
}

