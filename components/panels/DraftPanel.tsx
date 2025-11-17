import { useEffect, useState } from 'react'
import { useProjectStore } from '@/lib/store'

export default function DraftPanel() {
  const { current } = useProjectStore()
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [directUrl, setDirectUrl] = useState<string>('')
  const [buildStatus, setBuildStatus] = useState<'pending' | 'running' | 'completed' | 'failed'>('pending')
  const [buildError, setBuildError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!current?.id) {
      setPreviewUrl('')
      setDirectUrl('')
      setBuildStatus('pending')
      setBuildError(null)
      return
    }
    
    let interval: NodeJS.Timeout | null = null
    
    const loadStatus = async () => {
      // Double-check current still exists
      if (!current?.id) return
      
      try {
        // Check build status
        try {
          const statusRes = await fetch(`/api/projects/${current.id}/build`)
          if (!statusRes.ok) {
            console.error(`Build status fetch failed: ${statusRes.status}`)
            return
          }
          const statusData = await statusRes.json().catch(() => ({}))
          setBuildStatus(statusData.status || 'pending')
          setBuildError(statusData.error || null)
        } catch (err) {
          console.error('Error fetching build status:', err)
          // Don't update status on fetch error, keep existing state
        }
        
        // Get draft artifact
        try {
          const res = await fetch(`/api/projects/${current.id}/artifacts?kind=draft`)
          if (!res.ok) {
            console.error(`Draft artifacts fetch failed: ${res.status}`)
            return
          }
          const data = await res.json().catch(() => ({ items: [] }))
          const latest = data.items?.[data.items.length - 1]?.content
          try {
            const parsed = latest ? JSON.parse(latest) : null
            setPreviewUrl((prev) => {
              const next = parsed?.previewUrl || ''
              return prev === next ? prev : next
            })
            // Set direct URL to the actual draft server (not proxy)
            if (parsed?.port) {
              setDirectUrl((prev) => {
                const next = `http://localhost:${parsed.port}`
                return prev === next ? prev : next
              })
            } else {
              setDirectUrl('')
            }
          } catch { 
            setPreviewUrl('')
            setDirectUrl('')
          }
        } catch (err) {
          console.error('Error fetching draft artifacts:', err)
          // Keep existing previewUrl on fetch error
        }
      } catch (err) {
        console.error('Error in loadStatus:', err)
      }
    }
    
    loadStatus()
    
    // Poll build status every 2 seconds if running
    interval = setInterval(loadStatus, 2000)
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [current?.id])
  
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-semibold">draft</h2>
        <div className="flex items-center gap-3">
          {directUrl && (
            <button
              onClick={() => window.open(directUrl, '_blank')}
              className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
              title="Open in new tab for full Polkadot extension support"
            >
              Open in New Tab ↗
            </button>
          )}
          {buildStatus === 'running' && (
            <div className="text-sm text-white/60 animate-pulse">Building...</div>
          )}
          {buildStatus === 'failed' && (
            <div className="text-sm text-red-400">Build failed</div>
          )}
          {buildStatus === 'completed' && (
            <div className="text-sm text-green-400">Ready</div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {buildStatus === 'pending' || buildStatus === 'running' ? (
          <div className="h-full grid place-items-center text-white/60">
            <div className="text-center">
              <div className="animate-pulse mb-2">Building preview...</div>
              <p className="text-sm text-white/40 mt-2">This may take a few minutes</p>
              {buildError && <p className="text-sm text-red-400 mt-2">{buildError}</p>}
            </div>
          </div>
        ) : directUrl ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 relative">
              <iframe 
                key={directUrl}
                src={directUrl}
                className="w-full h-full border-0 absolute inset-0"
                title="Draft Preview"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
                allow="clipboard-write"
              />
            </div>
            <div className="px-4 py-2 bg-yellow-500/10 border-t border-yellow-500/20 text-yellow-400 text-xs">
              ⚠️ For full Polkadot wallet support, click "Open in New Tab" above
            </div>
          </div>
        ) : (
          <div className="h-full grid place-items-center text-white/60">
            <div className="text-center">
              <p>Draft deploy preview</p>
              <p className="text-sm text-white/40 mt-2">Waiting for draft build to complete...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

