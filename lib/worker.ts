import { prisma } from './prisma'
import { getGroqClient } from './groq'
import { buildAndServeDraft } from './draftService'
import { CODE_GENERATION_SYSTEM_PROMPT, CODE_GENERATION_USER_PROMPT } from './aiPrompts'
import { CodeValidator } from './validator'

type Step = 'spec' | 'code' | 'draft'

export async function runWorker(projectId: string, prompt: string) {
  const client = getGroqClient()

  // Step 1: Generate specification
  const specRun = await prisma.run.findFirst({ where: { projectId, step: 'spec' } })
  if (specRun) {
    await prisma.run.update({ where: { id: specRun.id }, data: { status: 'running' } })
    await prisma.chatMessage.create({ data: { projectId, role: 'assistant', content: 'Creating the specification blueprint...' } })
    
    // Actual AI work for spec
    const specResponse = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert product architect for client-only Polkadot dApps. Produce concise, structured specifications that match the user brief exactly. Use markdown headings, bullet lists, and keep every item implementable without inventing server features.'
        },
        {
          role: 'user',
          content: `Customer request:
"""
${prompt}
"""

Write a structured specification using this outline (follow exactly):

# Specification Title

## Overview
- 2–3 short bullets summarizing the business goal and target users.

## Authentication
- List only the auth methods explicitly requested in the brief. If none were requested, include "- Polkadot wallet connect (default)" and explicitly note that email/password or Google login are out of scope.

## Core Features
- Bullet the major user-facing flows taken directly from the brief (minting, trading, dashboards, etc.). Do not add features the user did not ask for.

## Data & Storage
- Describe where data lives (e.g., on-chain via People/Polkadot, browser localStorage, existing public APIs). If the user did not request a backend, state "Client-side only – no custom backend or database".

## Operations & Integrations
- Outline any chain transactions, API calls, or background jobs the UI must trigger. If there are none beyond wallet transactions, say "Not applicable".

Keep everything factual, concise, and aligned with the customer's wording.`
        }
      ],
      temperature: 0.4
    })
    
    const specContent = specResponse.choices[0]?.message?.content || `# Specification\n\nDerived from prompt: ${prompt}`
    await prisma.artifact.create({ data: { projectId, kind: 'spec', content: specContent } })
    await prisma.chatMessage.create({ data: { projectId, role: 'assistant', content: '✅ Specification blueprint created' } })
    await prisma.run.update({ where: { id: specRun.id }, data: { status: 'completed', finishedAt: new Date() } })
  }

  // Step 2: Generate code
  await prisma.run.create({ data: { projectId, status: 'running', step: 'code' } })
  await prisma.chatMessage.create({ data: { projectId, role: 'assistant', content: 'Generating your application code…' } })
  
  const codeRun = await prisma.run.findFirst({ where: { projectId, step: 'code', status: 'running' } })
  
  // Actual AI work for code - generate multiple files
  // Use strict prompts for 100% success rate
  const codeResponse = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: CODE_GENERATION_SYSTEM_PROMPT },
      { role: 'user', content: CODE_GENERATION_USER_PROMPT(prompt) }
    ],
    temperature: 0.2  // Lower temperature for more consistent, rule-following output
  })
  
  const codeContentRaw = codeResponse.choices[0]?.message?.content || '{}'
  
  // Update progress during code generation
  await prisma.chatMessage.create({ data: { projectId, role: 'assistant', content: '📝 Writing application files...' } })
  
  // Parse JSON response and store each file as a separate artifact
  try {
    // Clean the response - sometimes AI adds markdown code blocks or extra text
    let cleanedResponse = codeContentRaw.trim()
    
    // Remove markdown code fences if present
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*\n?/, '').replace(/\n?```$/, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\w*\s*\n?/, '').replace(/\n?```$/, '')
    }
    
    // Try to extract JSON if it's wrapped in text
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*"files"[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }
    
    const codeData = JSON.parse(cleanedResponse)
    if (codeData.files && Array.isArray(codeData.files)) {
      // STEP 1: Pre-validation - Check AI output BEFORE processing
      const files: Array<{ path: string; content: string }> = []
      
      for (const file of codeData.files) {
        if (!file.path || !file.content) {
          console.warn(`[Worker] Skipping invalid file entry:`, file)
          continue
        }
        
        // Clean file content
        let fileContent = String(file.content)
        
        // Remove markdown code blocks if present
        if (fileContent.trim().startsWith('```')) {
          const codeMatch = fileContent.match(/```(?:\w+)?\s*\n([\s\S]*?)\n```/)
          if (codeMatch) {
            fileContent = codeMatch[1]
          } else {
            fileContent = fileContent.replace(/^```[\w]*\s*\n?/, '').replace(/\n?```$/, '')
          }
        }
        
        files.push({ path: file.path, content: fileContent })
      }
      
      // STEP 2: Validate ALL files before storing
      const validation = CodeValidator.validateProject(files)
      
      if (!validation.valid && validation.errors.length > 0) {
        // Critical errors found - reject AI output and retry
        const criticalErrors = validation.errors.filter(e => e.severity === 'error')
        const errorSummary = criticalErrors
          .slice(0, 10)
          .map(e => `  - ${e.file}${e.line ? `:${e.line}` : ''}: ${e.message}`)
          .join('\n')
        
        console.error(`[Worker] AI generated invalid code. Critical errors:\n${errorSummary}`)
        
        // Ask AI to regenerate with specific error feedback
        await prisma.chatMessage.create({ 
          data: { 
            projectId, 
            role: 'assistant', 
            content: `❌ Code validation failed. Regenerating with stricter rules...` 
          } 
        })
        
        // Retry once with error feedback
        const retryResponse = await client.chat.completions.create({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: CODE_GENERATION_SYSTEM_PROMPT },
            { role: 'user', content: CODE_GENERATION_USER_PROMPT(prompt) },
            { role: 'assistant', content: codeContentRaw },
            { role: 'user', content: `The previous code had validation errors. Please fix them:\n\n${errorSummary}\n\nCRITICAL: Ensure you follow ALL patterns exactly:\n1. ALWAYS use session?.user?.property (NEVER session.user.property)\n2. ALWAYS include authOptions in getServerSession calls\n3. ALL client components must start with "use client"\n4. Generate ONLY business logic files (no infrastructure)\n\nRegenerate the code following the rules EXACTLY.` }
          ],
          temperature: 0.2  // Lower temperature for more consistent output
        })
        
        const retryContentRaw = retryResponse.choices[0]?.message?.content || '{}'
        let retryCleaned = retryContentRaw.trim()
        
        if (retryCleaned.startsWith('```json')) {
          retryCleaned = retryCleaned.replace(/^```json\s*\n?/, '').replace(/\n?```$/, '')
        } else if (retryCleaned.startsWith('```')) {
          retryCleaned = retryCleaned.replace(/^```\w*\s*\n?/, '').replace(/\n?```$/, '')
        }
        
        const retryJsonMatch = retryCleaned.match(/\{[\s\S]*"files"[\s\S]*\}/)
        if (retryJsonMatch) {
          retryCleaned = retryJsonMatch[0]
        }
        
        const retryCodeData = JSON.parse(retryCleaned)
        if (retryCodeData.files && Array.isArray(retryCodeData.files)) {
          files.length = 0  // Clear old files
          for (const file of retryCodeData.files) {
            if (!file.path || !file.content) continue
            let content = String(file.content)
            if (content.trim().startsWith('```')) {
              const match = content.match(/```(?:\w+)?\s*\n([\s\S]*?)\n```/)
              if (match) content = match[1]
              else content = content.replace(/^```[\w]*\s*\n?/, '').replace(/\n?```$/, '')
            }
            files.push({ path: file.path, content })
          }
          
          // Re-validate retry
          const retryValidation = CodeValidator.validateProject(files)
          if (!retryValidation.valid && retryValidation.errors.length > 0) {
            // Still has errors - log and continue (draftService will try to fix)
            console.error(`[Worker] Retry still has errors, but proceeding. DraftService will attempt fixes.`)
          }
        }
      }
      
      // STEP 3: Store validated files
      for (const file of files) {
        await prisma.artifact.create({
          data: {
            projectId,
            kind: 'code',
            content: JSON.stringify({ path: file.path, content: file.content })
          }
        })
      }
    } else {
      // Fallback: store as single file
      await prisma.artifact.create({ data: { projectId, kind: 'code', content: JSON.stringify({ path: 'code.txt', content: codeContentRaw }) } })
    }
  } catch (parseErr: any) {
    console.error(`[Worker] Failed to parse code JSON:`, parseErr.message)
    console.error(`[Worker] Code response preview:`, codeContentRaw.substring(0, 500))
    // Fallback: store raw response
    await prisma.artifact.create({ data: { projectId, kind: 'code', content: JSON.stringify({ path: 'code.txt', content: codeContentRaw }) } })
  }
  await prisma.chatMessage.create({ data: { projectId, role: 'assistant', content: '📦 Application created successfully' } })
  if (codeRun) {
    await prisma.run.update({ where: { id: codeRun.id }, data: { status: 'completed', finishedAt: new Date() } })
  }

  // Step 3: Build and deploy draft
  await prisma.run.create({ data: { projectId, status: 'running', step: 'draft' } })
  await prisma.chatMessage.create({ data: { projectId, role: 'assistant', content: 'Ok, building your code, and deploying to the network 🍿' } })
  
  const draftRun = await prisma.run.findFirst({ where: { projectId, step: 'draft', status: 'running' } })
  
  // Build the draft
  await prisma.chatMessage.create({ data: { projectId, role: 'assistant', content: '🔨 Building application...' } })
  
  try {
    // Get all code files
    const codeArtifacts = await prisma.artifact.findMany({
      where: { projectId, kind: 'code' },
      orderBy: { createdAt: 'asc' }
    })
    
    const files: Array<{ path: string; content: string }> = []
    for (const artifact of codeArtifacts) {
      try {
        const fileData = JSON.parse(artifact.content)
        if (fileData.path && fileData.content) {
          files.push({ path: fileData.path, content: fileData.content })
        }
      } catch (parseErr) {
        console.warn(`Failed to parse artifact ${artifact.id}:`, parseErr)
      }
    }
    
    if (files.length === 0) {
      throw new Error('No code files found to build. The AI may not have generated valid code files.')
    }
    
    console.log(`[Worker] Building draft for project ${projectId} with ${files.length} files`)
    
    // Build and serve draft (this writes files and starts build process)
    const { previewUrl, port, buildPromise } = await buildAndServeDraft(projectId, files)
    
    await prisma.chatMessage.create({ data: { projectId, role: 'assistant', content: '📦 Files written. Building and starting preview server...' } })
    
    // Create draft artifact immediately
    await prisma.artifact.create({ 
      data: { 
        projectId, 
        kind: 'draft', 
        content: JSON.stringify({ previewUrl, port, buildStatus: 'building' }) 
      } 
    })
    
    // Monitor build promise and update status
    buildPromise
      .then(async () => {
        // Build succeeded
        await prisma.artifact.updateMany({
          where: { projectId, kind: 'draft' },
          data: { content: JSON.stringify({ previewUrl, port, buildStatus: 'ready' }) }
        })
        await prisma.chatMessage.create({ data: { projectId, role: 'assistant', content: '🎬 App draft Version 1 is ready for review — Open draft · Publish changes · More…' } })
        if (draftRun) {
          await prisma.run.update({ where: { id: draftRun.id }, data: { status: 'completed', finishedAt: new Date() } })
        }
      })
      .catch(async (buildErr: any) => {
        // Build failed - extract detailed error message
        const errorMsg = buildErr?.message || String(buildErr) || 'Unknown build error'
        
        // Extract actual error from message (skip generic "Build failed:" prefix)
        let userFriendlyError = errorMsg
        if (errorMsg.includes('Build failed:')) {
          const parts = errorMsg.split('Build failed:')
          if (parts.length > 1) {
            userFriendlyError = parts.slice(1).join('Build failed:').trim()
            // Take first meaningful error (first 500 chars or until newline after first error)
            const firstError = userFriendlyError.split('\n').slice(0, 5).join('\n')
            if (firstError.length < 1000) {
              userFriendlyError = firstError
            } else {
              userFriendlyError = userFriendlyError.substring(0, 1000)
            }
          }
        }
        
        console.error(`[Worker] Draft build failed for ${projectId}:`, errorMsg)
        
        await prisma.artifact.updateMany({
          where: { projectId, kind: 'draft' },
          data: { content: JSON.stringify({ previewUrl, port, buildStatus: 'failed', error: errorMsg }) }
        })
        
        // Create a user-friendly error message with code block for formatting
        const chatErrorMessage = userFriendlyError.length > 100 
          ? `⚠️ Draft build encountered an error:\n\n\`\`\`\n${userFriendlyError.substring(0, 2000)}\n\`\`\`\n\nPlease check the code files and try again.`
          : `⚠️ Draft build encountered an error: ${userFriendlyError}. Please check the code files and try again.`
        
        await prisma.chatMessage.create({ 
          data: { 
            projectId, 
            role: 'assistant', 
            content: chatErrorMessage
          } 
        })
        
        if (draftRun) {
          await prisma.run.update({ where: { id: draftRun.id }, data: { status: 'failed', error: errorMsg, finishedAt: new Date() } })
        }
      })
    
    // Don't wait for build - return immediately
    // Status will be updated via the promise handlers above
    
  } catch (err: any) {
    const errorMsg = err?.message || String(err) || 'Unknown error'
    console.error(`[Worker] Draft setup error for ${projectId}:`, errorMsg, err.stack?.substring(0, 500))
    
    await prisma.chatMessage.create({ 
      data: { 
        projectId, 
        role: 'assistant', 
        content: `⚠️ Draft build encountered an error: ${errorMsg.substring(0, 200)}. Please check the code files and try again.` 
      } 
    })
    
    if (draftRun) {
      await prisma.run.update({ where: { id: draftRun.id }, data: { status: 'failed', error: errorMsg, finishedAt: new Date() } })
    }
  }
}
