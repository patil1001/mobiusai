import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { runWorker } from '@/lib/worker'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authConfig'
import type { Session } from 'next-auth'

export async function POST(req: NextRequest) {
  try {
    // CRITICAL: Get authenticated user
    const session = (await getServerSession(authOptions)) as Session | null
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const userId = (session.user as any)?.id
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID not found' }), { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const prompt = (body?.prompt as string)?.trim() || ''
    const projectId = body?.projectId as string | undefined
    const isNameResponse = body?.isNameResponse === true

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt required' }), { status: 400 })
    }

    // Handle name response for existing project awaiting name
    if (isNameResponse && projectId) {
      try {
        console.log(`[Name Response] Processing name response for project ${projectId}, prompt: "${prompt}"`)
        
        const project = await prisma.project.findUnique({ where: { id: projectId } })
        if (!project || project.ownerId !== userId) {
          console.error(`[Name Response] Project not found or unauthorized: ${projectId}`)
          return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 })
        }

        // Check if project is awaiting name
        const runs = await prisma.run.findMany({ where: { projectId }, orderBy: { startedAt: 'desc' } })
        const lastRun = runs[0]
        
        if (!lastRun) {
          console.error(`[Name Response] No run found for project ${projectId}`)
          await prisma.chatMessage.create({ 
            data: { 
              projectId, 
              role: 'assistant', 
              content: '⚠️ Something went wrong. Please try creating a new project.' 
            } 
          })
          return new Response(JSON.stringify({ error: 'No run found' }), { status: 400 })
        }
        
        if (lastRun.status !== 'awaiting_name') {
          console.log(`[Name Response] Run status is ${lastRun.status}, not awaiting_name. Processing name anyway.`)
          // If not awaiting name but user provided a name response, update the name and continue
          // This handles edge cases where the status might have changed
        }
        
        // Process name response (whether status is awaiting_name or not)
        {
          // Extract and validate the name from user's response
          const providedName = extractUserProvidedName(prompt)
          console.log(`[Name Response] Extracted name: "${providedName}"`)
          
          if (!providedName) {
            await prisma.chatMessage.create({ 
              data: { 
                projectId, 
                role: 'assistant', 
                content: '⚠️ Please provide a valid project name (letters, numbers, spaces, &, \', - only). Try again:' 
              } 
            })
            return new Response(JSON.stringify({ projectId, title: project.title, awaitingName: true }), { 
              headers: { 'content-type': 'application/json' } 
            })
          }

          // Update project with the provided name
          const finalTitle = toTitleCase(providedName)
          await prisma.project.update({ where: { id: projectId }, data: { title: finalTitle } })
          await prisma.chatMessage.create({ 
            data: { 
              projectId, 
              role: 'assistant', 
              content: `Perfect! I'll name your project ${finalTitle}. Building it now...` 
            } 
          })
          await prisma.chatMessage.create({ 
            data: { 
              projectId, 
              role: 'assistant', 
              content: 'Alright, here we go! 🚀 This could take a couple of minutes...' 
            } 
          })

          // Only start worker if run was awaiting name (not already running)
          if (lastRun.status === 'awaiting_name') {
            // Update run status and continue workflow
            await prisma.run.update({ where: { id: lastRun.id }, data: { status: 'queued' } })

            // Start worker with original prompt
            runWorker(projectId, project.prompt).catch(err => {
              console.error('[Name Response] Worker error:', err)
              prisma.run.updateMany({ where: { projectId }, data: { status: 'failed', error: String(err) } }).catch(() => {})
              prisma.chatMessage.create({ 
                data: { 
                  projectId, 
                  role: 'assistant', 
                  content: `❌ Error starting build: ${err.message || String(err)}` 
                } 
              }).catch(() => {})
            })
          } else {
            // Run is already in progress, just update the name
            console.log(`[Name Response] Run already in progress (${lastRun.status}), only updating name`)
          }

          return new Response(JSON.stringify({ projectId, title: finalTitle }), { 
            headers: { 'content-type': 'application/json' } 
          })
        }
      } catch (error: any) {
        console.error('[Name Response] Error processing name response:', error)
        // Try to send error message to user
        try {
          await prisma.chatMessage.create({ 
            data: { 
              projectId: projectId!, 
              role: 'assistant', 
              content: `❌ Something went wrong: ${error.message || 'Unknown error'}. Please try again.` 
            } 
          })
        } catch (e) {
          console.error('[Name Response] Failed to create error message:', e)
        }
        return new Response(JSON.stringify({ error: error.message || 'Failed to process name response' }), { 
          status: 500,
          headers: { 'content-type': 'application/json' } 
        })
      }
    }

    // New project creation
    const extractedName = extractProjectName(prompt)
    console.log('[Name Detection] Prompt:', prompt)
    console.log('[Name Detection] Extracted:', extractedName)
    
    // If no name detected, ask the user
    if (!extractedName) {
      const tempTitle = 'New Project'
      const project = await prisma.project.create({ 
        data: { ownerId: userId, title: tempTitle, prompt } 
      })

      await prisma.chatMessage.createMany({ data: [
        { projectId: project.id, role: 'user', content: prompt },
        { projectId: project.id, role: 'assistant', content: 'What name would you like to give to your dapp?' }
      ] })

      // Create a special run status to indicate we're waiting for a name
      await prisma.run.create({ 
        data: { projectId: project.id, status: 'awaiting_name', step: 'spec' } 
      })

      return new Response(JSON.stringify({ 
        projectId: project.id, 
        title: tempTitle, 
        awaitingName: true 
      }), { headers: { 'content-type': 'application/json' } })
    }

    // Name was detected - proceed normally
    const title = toTitleCase(extractedName)
    const project = await prisma.project.create({ data: { ownerId: userId, title, prompt } })

    await prisma.chatMessage.createMany({ data: [
      { projectId: project.id, role: 'user', content: prompt },
      { projectId: project.id, role: 'assistant', content: `I'm building your ${title}! I'll keep you posted as I progress.` },
      { projectId: project.id, role: 'assistant', content: 'Alright, here we go! 🚀 This could take a couple of minutes...' }
    ] })

    await prisma.run.create({ data: { projectId: project.id, status: 'queued', step: 'spec' } })

    // Start worker asynchronously (non-blocking)
    runWorker(project.id, prompt).catch(err => {
      console.error('Worker error:', err)
      prisma.run.updateMany({ where: { projectId: project.id }, data: { status: 'failed', error: String(err) } }).catch(() => {})
    })

    return new Response(JSON.stringify({ projectId: project.id, title }), { headers: { 'content-type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'failed' }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}

function extractUserProvidedName(response: string): string | null {
  // User is directly providing a name - be lenient
  let cleaned = response
    .trim()
    .replace(/^["'""]|["'""]$/g, '') // Remove surrounding quotes
    .replace(/[^A-Za-z0-9&''\- ]+/g, ' ') // Keep only valid chars
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned || cleaned.length < 2 || cleaned.length > 60) {
    return null
  }

  return cleaned
}

function inferTitle(prompt: string): string {
  const candidate = extractProjectName(prompt)
  if (candidate) {
    return candidate
  }

  const lower = prompt.toLowerCase()
  if (lower.includes('nft')) return 'NFT Platform'
  if (lower.includes('marketplace')) return 'Marketplace'
  if (lower.includes('wallet')) return 'Wallet App'

  const fallbackWords = prompt
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)

  if (fallbackWords.length) {
    return fallbackWords.map(capitalize).join(' ')
  }

  return 'New Project'
}

function extractProjectName(prompt: string): string | null {
  // Simplified and more direct patterns - order matters (most specific first)
  const patterns: RegExp[] = [
    // Pattern 1: "name it qulo", "name it TRULU" - Very common pattern
    /\bname\s+it\s+["'""]?([A-Za-z0-9][A-Za-z0-9\s&'\-]{0,58}?)(?=[,\.!\?]|$)/i,
    
    // Pattern 2: "named TRULU" - Most common, very simple pattern
    // Captures everything after "named" until end of string or punctuation
    /\b(?:named|called|titled|codenamed)\s+["'""]?([A-Za-z0-9][A-Za-z0-9\s&'\-]{0,58}?)(?=[,\.!\?]|$)/i,
    
    // Pattern 3: "known as TRULU"
    /\bknown\s+as\s+["'""]?([A-Za-z0-9][A-Za-z0-9\s&'\-]{0,58}?)(?=[,\.!\?]|$)/i,
    
    // Pattern 4: "project name is TRULU", "app title: MyApp"
    /\b(?:project|app|product|platform|startup|brand|dapp)\s+(?:name|title)\s*(?:is|=|:)\s*["'""]?([A-Za-z0-9][A-Za-z0-9\s&'\-]{0,58}?)(?=[,\.!\?]|$)/i,
    
    // Pattern 5: Quoted names like "TRULU" app, "MyApp" platform
    /["'"]([A-Za-z0-9][A-Za-z0-9\s&'\-]{1,58})["'"]\s+(?:app|platform|project|startup|dapp)\b/i,
  ]

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i]
    const match = prompt.match(pattern)
    if (match?.[1]) {
      let rawName = match[1].trim()
      console.log(`[Name Detection] Pattern ${i + 1} matched. Raw capture: "${rawName}"`)
      
      // Clean up the name
      let cleaned = sanitizeName(rawName)
      console.log(`[Name Detection] After sanitizeName: "${cleaned}"`)
      
      if (cleaned) {
        // Remove any leading single letters from keywords
        cleaned = cleaned.replace(/^[a-z]\s+/i, '').trim()
        // Remove trailing keywords that might have been captured
        cleaned = cleaned.replace(/\s+(?:platform|app|dapp|project|startup|marketplace|wallet|exchange|trading|minting)$/i, '').trim()
        console.log(`[Name Detection] After cleanup: "${cleaned}"`)
        
        if (cleaned && cleaned.length >= 2 && cleaned.length <= 60) {
          const finalName = toTitleCase(cleaned)
          console.log(`[Name Detection] Final name: "${finalName}"`)
          return finalName
        } else {
          console.log(`[Name Detection] Rejected: length=${cleaned?.length || 0}`)
        }
      } else {
        console.log(`[Name Detection] sanitizeName returned null`)
      }
    }
  }

  console.log(`[Name Detection] No pattern matched. Returning null.`)
  return null
}

function sanitizeName(raw: string): string | null {
  let value = raw
    .replace(/["'""]/g, '')
    .trim()
    .replace(/\s+/g, ' ')

  if (!value) return null

  // Remove any leading single letter followed by space (leftover from keywords like "d TRULU")
  value = value.replace(/^[a-z]\s+/i, '').trim()
  
  // Only remove trailing keywords if they appear at the END (not in the middle of the name)
  // This is less aggressive - only removes if the keyword is clearly a suffix
  value = value.replace(/\s+(?:that|which|with|for|featuring|featur(?:es|ing)|and)\s*$/i, '').trim()
  
  // Remove invalid characters but keep valid ones
  value = value.replace(/[^A-Za-z0-9&''\- ]+/g, '').trim()

  if (!value) return null
  
  // Limit length
  if (value.length > 60) {
    value = value.split(' ').slice(0, 6).join(' ').trim()
  }

  return value || null
}

function capitalize(word: string): string {
  if (!word) return ''
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

function toTitleCase(text: string): string {
  if (!text) return ''
  // Keep all caps for acronyms (2-6 chars, all uppercase)
  if (text.length >= 2 && text.length <= 6 && text === text.toUpperCase()) {
    return text
  }
  // Otherwise title case
  return text.split(' ')
    .map(word => {
      if (!word) return ''
      // Keep all-caps words as is (acronyms)
      if (word === word.toUpperCase() && word.length >= 2 && word.length <= 6) {
        return word
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}


