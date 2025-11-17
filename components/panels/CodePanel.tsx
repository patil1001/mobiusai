import { useEffect, useState } from 'react'
import { useProjectStore } from '@/lib/store'

type CodeFile = { path: string; content: string }

function getFileExtension(path: string): string {
  const parts = path.split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

function getLanguageFromPath(path: string): string {
  const ext = getFileExtension(path)
  const map: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'json': 'json',
    'md': 'markdown',
    'css': 'css',
    'html': 'html',
    'mjs': 'javascript',
    'prisma': 'prisma'
  }
  return map[ext] || 'text'
}

export default function CodePanel() {
  const { current } = useProjectStore()
  const [files, setFiles] = useState<CodeFile[]>([])
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  useEffect(() => {
    if (!current) return
    ;(async () => {
      const res = await fetch(`/api/projects/${current.id}/artifacts?kind=code`)
      const data = await res.json()
      const parsed: CodeFile[] = []
      for (const item of data.items || []) {
        try {
          const fileData = JSON.parse(item.content)
          if (fileData.path && fileData.content) {
            parsed.push({ path: fileData.path, content: fileData.content })
          }
        } catch {
          // Skip invalid JSON
        }
      }
      setFiles(parsed)
      if (parsed.length > 0 && !selectedPath) {
        setSelectedPath(parsed[0].path)
      }
    })()
  }, [current?.id, selectedPath])

  const selected = files.find(f => f.path === selectedPath)
  const grouped = files.reduce((acc, f) => {
    const dir = f.path.includes('/') ? f.path.split('/').slice(0, -1).join('/') : '/'
    if (!acc[dir]) acc[dir] = []
    acc[dir].push(f)
    return acc
  }, {} as Record<string, CodeFile[]>)

  // Sort files by path for better organization
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path))

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-white/10">
        <h2 className="text-lg font-semibold">code</h2>
      </div>
      {/* Horizontal scrollable file bar */}
      <div className="border-b border-white/10 bg-black/20">
        <div className="flex overflow-x-auto gap-1 px-2 py-2">
          {sortedFiles.map(f => {
            const dir = f.path.includes('/') ? f.path.split('/').slice(0, -1).join('/') : '/'
            const fileName = f.path.split('/').pop() || f.path
            return (
              <button
                key={f.path}
                onClick={() => setSelectedPath(f.path)}
                className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-md whitespace-nowrap ${selectedPath === f.path ? 'bg-primary text-black font-medium' : 'bg-white/5 hover:bg-white/10'}`}
                title={f.path}
              >
                <span className="text-white/60 text-xs">{dir}/</span>
                <span>{fileName}</span>
              </button>
            )
          })}
          {files.length === 0 && <div className="text-white/60 text-sm px-2 py-1.5">No files yet</div>}
        </div>
      </div>
      {/* Code viewer */}
      <div className="flex-1 overflow-auto">
        {selected ? (
          <div className="p-4">
            <div className="mb-2 text-sm font-medium text-white/80 font-mono">{selected.path}</div>
            <pre className="bg-black/40 rounded-lg p-4 overflow-x-auto">
              <code className={`language-${getLanguageFromPath(selected.path)} text-white/90 whitespace-pre font-mono text-sm`}>
                {selected.content}
              </code>
            </pre>
          </div>
        ) : (
          <div className="p-4 text-white/60">Select a file to view</div>
        )}
      </div>
    </div>
  )
}

