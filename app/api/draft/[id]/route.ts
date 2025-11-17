import { NextRequest } from 'next/server'
import { readFile, existsSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import { prisma } from '@/lib/prisma'

const readFileAsync = promisify(readFile)

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Check if draft artifact has port
  try {
    const artifacts = await prisma.artifact.findMany({
      where: { projectId: id, kind: 'draft' },
      orderBy: { createdAt: 'desc' }
    })
    
    const latest = artifacts[0]?.content
    if (latest) {
      const parsed = JSON.parse(latest)
      const port = parsed.port || 3001
      
      // Try to proxy to the draft server with retry mechanism
      // Server might not be ready immediately, so retry with exponential backoff
      const draftUrl = `http://localhost:${port}`
      const maxRetries = 5
      let lastError: any = null
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
          
          if (attempt > 0) {
            // Exponential backoff: 1s, 2s, 4s, 8s
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000)
            console.log(`[Draft API] Retry ${attempt}/${maxRetries - 1} after ${delay}ms delay...`)
            await new Promise(resolve => setTimeout(resolve, delay))
          } else {
            console.log(`[Draft API] Attempting to proxy to ${draftUrl} for project ${id}`)
          }
          
          const response = await fetch(draftUrl, { 
            signal: controller.signal,
            headers: { 'Accept': 'text/html' }
          })
          
          clearTimeout(timeoutId)
          
          console.log(`[Draft API] Got response from ${draftUrl}: ${response.status} (attempt ${attempt + 1})`)
          
          if (response.ok) {
            const html = await response.text()
            console.log(`[Draft API] ✅ Successfully proxied to ${draftUrl}, content length: ${html.length}`)
            return new Response(html, {
              headers: { 
                'content-type': 'text/html',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            })
          } else {
            // Log the error response body to understand what's wrong
            try {
              const errorText = await response.text()
              console.error(`[Draft API] Server returned ${response.status}, error: ${errorText.substring(0, 1000)}`)
              lastError = new Error(`Server returned ${response.status}: ${errorText.substring(0, 200)}`)
            } catch (textErr) {
              console.error(`[Draft API] Server returned ${response.status}, couldn't read error body`)
              lastError = new Error(`Server returned ${response.status}`)
            }
            
            // If it's a 500 error, retry (server might be compiling)
            if (response.status === 500 && attempt < maxRetries - 1) {
              console.log(`[Draft API] Server returned 500, retrying... (${attempt + 1}/${maxRetries})`)
              continue
            }
            
            // Non-500 error or max retries reached
            console.log(`[Draft API] Server returned ${response.status}, falling back to file list`)
            break
          }
        } catch (err: any) {
          lastError = err
          // Connection error - retry if we have attempts left
          if (attempt < maxRetries - 1) {
            console.log(`[Draft API] Connection failed (attempt ${attempt + 1}/${maxRetries}): ${err.message}, retrying...`)
            continue
          } else {
            console.log(`[Draft API] Failed to proxy to port ${port} after ${maxRetries} attempts: ${err.message}`)
            break
          }
        }
      }
      
      // If we got here, all retries failed
      if (lastError) {
        console.error(`[Draft API] All retry attempts failed, last error: ${lastError.message}`)
      }
    }
  } catch {}
  
  const baseDir = join(process.cwd(), '.drafts', id)
  const indexPath = join(baseDir, '.next/server/app/page.html')
  
  // Try to serve built Next.js page
  if (existsSync(indexPath)) {
    try {
      const html = await readFileAsync(indexPath, 'utf-8')
      return new Response(html, {
        headers: { 
          'content-type': 'text/html',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    } catch {
      // Fall through to fallback
    }
  }
  
  // Fallback: serve a simple preview page with code files info
  try {
    const artifacts = await prisma.artifact.findMany({
      where: { projectId: id, kind: 'code' },
      orderBy: { createdAt: 'asc' }
    })
    
    const files: Array<{ path: string }> = []
    for (const artifact of artifacts) {
      try {
        const fileData = JSON.parse(artifact.content)
        if (fileData.path) files.push({ path: fileData.path })
      } catch {}
    }
    
    const fileList = files.map(f => `<li class="text-sm">${f.path}</li>`).join('')
    
    const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>Draft Preview - Project ${id.slice(0, 8)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0a0a0a;
      color: #fff;
      padding: 2rem;
      min-height: 100vh;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { margin-bottom: 1rem; }
    .info {
      background: #1a1a1a;
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 1rem;
    }
    .info h2 {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      color: #888;
    }
    ul {
      list-style: none;
      margin-top: 0.5rem;
      padding-left: 1rem;
    }
    li {
      margin: 0.25rem 0;
      color: #aaa;
    }
    .note {
      margin-top: 1rem;
      padding: 1rem;
      background: #2a2a2a;
      border-left: 3px solid #ffd700;
      border-radius: 4px;
    }
    .note p {
      color: #ccc;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📦 Draft Preview</h1>
    <p style="color: #888;">Preview of generated application</p>
    
    <div class="info">
      <h2>Generated Files (${files.length})</h2>
      <ul>${fileList || '<li>No files yet</li>'}</ul>
    </div>
    
    <div class="note">
      <p><strong>Note:</strong> This is a preview of the generated code files. To see a fully working application, the code needs to be built and deployed to a preview environment.</p>
      <p style="margin-top: 0.5rem;">You can view the complete code files in the <strong>Code</strong> tab.</p>
    </div>
  </div>
</body>
</html>`
    
    return new Response(fallbackHtml, {
      headers: { 
        'content-type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch {
    // Final fallback
    const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Draft Preview</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: #000;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .loading {
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Draft Preview</h1>
    <p class="loading">Building preview...</p>
    <p style="color: #666; margin-top: 1rem;">The draft build is in progress. Please wait a moment and refresh.</p>
  </div>
</body>
</html>`
    
    return new Response(fallbackHtml, {
      headers: { 
        'content-type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}
