import { useEffect, useState } from 'react'
import { useProjectStore } from '@/lib/store'

function markdownToHTML(md: string): string {
  let html = md
  // Headers
  html = html.replace(/^# (.*)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
  html = html.replace(/^## (.*)$/gm, '<h2 class="text-xl font-semibold mt-5 mb-2">$1</h2>')
  html = html.replace(/^### (.*)$/gm, '<h3 class="text-lg font-medium mt-4 mb-2">$1</h3>')
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
  // Lists
  html = html.replace(/^- (.*)$/gm, '<li class="ml-4">$1</li>')
  html = html.replace(/(<li.*<\/li>)/gs, '<ul class="list-disc space-y-1 mb-3">$1</ul>')
  // Paragraphs
  const lines = html.split('\n')
  const result: string[] = []
  let currentPara: string[] = []
  for (const line of lines) {
    if (line.trim() === '' || line.startsWith('<')) {
      if (currentPara.length > 0) {
        result.push(`<p class="mb-3 text-white/80">${currentPara.join(' ')}</p>`)
        currentPara = []
      }
      if (line.trim() !== '') result.push(line)
    } else {
      currentPara.push(line)
    }
  }
  if (currentPara.length > 0) {
    result.push(`<p class="mb-3 text-white/80">${currentPara.join(' ')}</p>`)
  }
  return result.join('\n')
}

export default function SpecPanel() {
  const { current } = useProjectStore()
  const [spec, setSpec] = useState<string>('')
  useEffect(() => {
    if (!current) return
    ;(async () => {
      const res = await fetch(`/api/projects/${current.id}/artifacts?kind=spec`)
      const data = await res.json()
      const latest = data.items?.[data.items.length - 1]?.content || ''
      setSpec(latest)
    })()
  }, [current?.id])
  return (
    <div className="h-full p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">specification</h2>
      {spec ? (
        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHTML(spec) }} />
      ) : (
        <p className="text-white/60">A structured plan will appear here: overview, auth, features, data, and operations.</p>
      )}
    </div>
  )
}

