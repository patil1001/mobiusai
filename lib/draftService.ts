import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { existsSync, rmSync, statSync, readdirSync, cpSync } from 'fs'
import { mkdir, writeFile, readFile, rm, stat, readdir, copyFile } from 'fs/promises'
import { TEMPLATES, getTemplate, isImmutable } from './templates'
import { CodeValidator } from './validator'
import { prisma } from './prisma'
import { createHash } from 'crypto'

const execAsync = promisify(exec)

const DRAFT_BASE = join(process.cwd(), '.drafts')
const DRAFT_CACHE_DIR = join(DRAFT_BASE, '.template-cache') // Shared node_modules cache
const DRAFT_PORTS_START = 3001
const DRAFT_MAX_AGE_HOURS = 12 // Clean up drafts older than 12 hours (reduced from 24)
const DRAFT_MAX_COUNT = 5 // Keep only the 5 most recent drafts (reduced from 10)

// Map projectId to port
const portMap = new Map<string, number>()

type InferredFeature = {
  title: string
  description: string
  href?: string
}

type InferredSection = {
  href: string
  label: string
  description: string
  icon?: string
}

type SpecFeatureDetail = {
  title: string
  description?: string
}

interface SpecInsights {
  overview?: string
  features: SpecFeatureDetail[]
}

interface ProjectContext {
  title?: string
  prompt?: string
  spec?: SpecInsights
}

const DEFAULT_FEATURES: InferredFeature[] = [
  {
    title: 'Wallet-native onboarding',
    description: 'Authenticate users with Polkadot wallets and surface trusted identities instantly.',
  },
  {
    title: 'Dynamic marketplace flows',
    description: 'Mint, list, or trade digital assets with reusable Polkadot UI primitives.',
  },
  {
    title: 'Telemetry & history',
    description: 'Track extrinsic lifecycle locally with optimistic updates and toast notifications.',
  },
]

interface InferredProjectMetadata {
  name: string
  shortName: string
  summary: string
  hero: {
    eyebrow?: string
    title: string
    subtitle?: string
    primaryCta?: { href: string; label: string }
    secondaryCta?: { href?: string; label?: string }
  }
  features: InferredFeature[]
  app: {
    entryPath: string
    sections: InferredSection[]
  }
  keywords: string[]
  themeColor?: string
}

type InferredPageRoute = {
  originalPath: string
  href: string | null
  segments: string[]
  label: string
  group: string
  trail: string
  isDynamic: boolean
}

function humanizeSlug(slug: string): string {
  if (!slug) return 'Experience'
  const withSpaces = slug
    .replace(/\[(.+?)\]/g, '$1')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_/]+/g, ' ')
    .trim()
  if (!withSpaces) return 'Experience'
  return withSpaces
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function escapeHeadingRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractSectionBlock(markdown: string, heading: string): string | null {
  if (!markdown || !heading) return null
  const escaped = escapeHeadingRegex(heading)
  const sectionRegex = new RegExp(`##\\s+${escaped}\\s*\\n+([\\s\\S]*?)(?=\\n##\\s+|\\n#\\s+|$)`, 'i')
  const match = markdown.match(sectionRegex)
  if (!match) return null
  return match[1].trim()
}

function extractOverviewFromSpec(markdown: string): string | undefined {
  const block = extractSectionBlock(markdown, 'Overview')
  if (!block) return undefined
  const paragraphs = block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => Boolean(line) && !line.startsWith('-') && !line.startsWith('*'))
  return paragraphs[0]
}

function splitOnDelimiter(input: string, delimiter: string): [string, string] | null {
  const idx = input.indexOf(delimiter)
  if (idx === -1) return null
  return [input.slice(0, idx), input.slice(idx + delimiter.length)]
}

function parseFeatureLine(raw: string, index: number): SpecFeatureDetail | null {
  if (!raw) return null
  const sanitized = raw.replace(/^\d+[\).\s-]+/, '').trim()
  if (!sanitized) return null

  const delimiters = [':', ' - ', ' – ', ' — ']
  let title = sanitized
  let description: string | undefined

  for (const delimiter of delimiters) {
    const parts = splitOnDelimiter(sanitized, delimiter)
    if (parts) {
      title = parts[0].trim()
      description = parts[1].trim()
      break
    }
  }

  if (!title) {
    title = `Feature ${index + 1}`
  }

  return {
    title,
    description
  }
}

function extractFeaturesFromSpec(markdown: string): SpecFeatureDetail[] {
  const headings = ['Core Features', 'Features']
  for (const heading of headings) {
    const block = extractSectionBlock(markdown, heading)
    if (!block) continue
    const lines = block.split('\n')
    const features: SpecFeatureDetail[] = []
    for (const line of lines) {
      const bulletMatch = line.match(/^\s*[-*+]\s+(.*)/)
      if (!bulletMatch) continue
      const feature = parseFeatureLine(bulletMatch[1].trim(), features.length)
      if (feature) {
        features.push(feature)
      }
      if (features.length >= 6) break
    }
    if (features.length) {
      return features
    }
  }
  return []
}

function parseSpecDocument(markdown?: string | null): SpecInsights {
  if (!markdown) {
    return { features: [] }
  }
  const overview = extractOverviewFromSpec(markdown)
  const features = extractFeaturesFromSpec(markdown)
  return {
    overview,
    features
  }
}

function normalizeAppRoutePath(filePath: string): InferredPageRoute | null {
  if (!filePath.startsWith('app/')) return null
  if (!filePath.endsWith('/page.tsx')) return null
  if (filePath === 'app/page.tsx' || filePath === 'app/experience/page.tsx') return null

  const trimmed = filePath.slice(4, -8) // remove "app/" prefix and "/page.tsx" suffix
  if (!trimmed) return null

  const rawSegments = trimmed.split('/').filter(Boolean)
  const segments = rawSegments.filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')))
  if (!segments.length) return null

  let isDynamic = false
  const cleanedSegments = segments.map((segment) => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      isDynamic = true
      return segment.slice(1, -1)
    }
    return segment
  })

  const href = isDynamic ? null : '/' + cleanedSegments.join('/')
  const label = humanizeSlug(cleanedSegments[cleanedSegments.length - 1] ?? 'Experience')
  const group = humanizeSlug(cleanedSegments[0] ?? label)
  const trail = cleanedSegments.map((segment) => humanizeSlug(segment)).join(' • ')

  return {
    originalPath: filePath,
    href,
    segments: cleanedSegments,
    label,
    group,
    trail,
    isDynamic,
  }
}

function inferProjectMetadata(
  projectFiles: Array<{ path: string; content: string }>,
  context: ProjectContext = {}
): InferredProjectMetadata {
  const pageRoutes: InferredPageRoute[] = []
  for (const file of projectFiles) {
    const routeInfo = normalizeAppRoutePath(file.path)
    if (routeInfo) {
      pageRoutes.push(routeInfo)
    }
  }

  const staticPages = pageRoutes.filter((route) => Boolean(route.href))
  const primaryPage = staticPages[0] ?? pageRoutes[0] ?? null

  const fallbackSummary = 'MobiusAI assembles wallet-native experiences on Polkadot with zero backend code required.'
  const fallbackHeroTitle = 'Ship Polkadot experiences faster than ever.'
  const fallbackSubtitle =
    'Generate landing pages, dashboards, and transaction-ready components infused with on-chain intelligence. Tailor the copy to your product in seconds.'
  const normalizedSpecFeatures = (context.spec?.features ?? [])
    .map((feature) => ({
      title: feature.title?.trim() || '',
      description: feature.description?.trim(),
    }))
    .filter((feature) => Boolean(feature.title))
  const specOverview = context.spec?.overview?.trim()
  const promptLine = context.prompt
    ?.split('\n')
    .map((line) => line.trim())
    .find((line) => Boolean(line))
  const overviewSummary = specOverview || promptLine || ''
  const preferredName = context.title?.trim()

  if (!primaryPage) {
    const resolvedName = preferredName || 'Mobius Polkadot Studio'
    const summary = overviewSummary || fallbackSummary
    const fallbackFeatures = normalizedSpecFeatures.length
      ? normalizedSpecFeatures.slice(0, 4).map((feature, index) => ({
          title: feature.title || `Feature ${index + 1}`,
          description:
            feature.description || `MobiusAI implemented ${feature.title.toLowerCase()} exactly as described in your prompt.`,
        }))
      : DEFAULT_FEATURES.map((feature) => ({ ...feature }))

    return {
      name: resolvedName,
      shortName: resolvedName,
      summary,
      hero: {
        eyebrow: 'MobiusAI + Polkadot UI',
        title: resolvedName,
        subtitle: specOverview || fallbackSubtitle,
        primaryCta: { href: '/experience', label: preferredName ? `Launch ${resolvedName}` : 'Enter Studio' },
        secondaryCta: { href: '#network', label: 'View network status' },
      },
      features: fallbackFeatures,
      app: {
        entryPath: '/experience',
        sections: [],
      },
      keywords: Array.from(
        new Set(
          [
            resolvedName,
            ...normalizedSpecFeatures.map((feature) => feature.title),
            'Polkadot',
            'MobiusAI',
            'Web3',
            'dApp builder',
            'wallet-native',
          ].filter(Boolean)
        )
      ),
      themeColor: '#6d28d9',
    }
  }

  const routeName = primaryPage.group || 'Experience'
  const projectName = preferredName || routeName
  const entryPath = staticPages[0]?.href ?? '/experience'
  const heroSubtitle = specOverview
    ? `${specOverview} Connect a wallet to explore the ${routeName.toLowerCase()} flows on Polkadot.`
    : `This experience was generated from your prompt. Connect a wallet to explore the ${routeName} flows.`
  const summary = overviewSummary || `Wallet-native ${projectName} experience generated with MobiusAI.`
  const primaryLabel = preferredName ? `Launch ${projectName}` : `Explore ${routeName}`
  const featuresSource = pageRoutes.length
    ? pageRoutes
    : [
        {
          originalPath: 'generated',
          href: entryPath === '/experience' ? null : entryPath,
          segments: [routeName],
          label: routeName,
          group: routeName,
          trail: routeName,
          isDynamic: false,
        },
      ]

  const routeFeatureCandidates: InferredFeature[] = []
  const seenRouteTitles = new Set<string>()
  for (const route of featuresSource) {
    const title = route.label
    if (!title) continue
    const normalizedTitle = title.toLowerCase()
    if (seenRouteTitles.has(normalizedTitle)) continue
    seenRouteTitles.add(normalizedTitle)
    const description = route.isDynamic
      ? `Dynamic ${route.label.toLowerCase()} flow generated for ${projectName.toLowerCase()}.`
      : `Navigate the ${route.trail.toLowerCase()} experience on Polkadot.`
    routeFeatureCandidates.push({
      title,
      description,
      href: route.href ?? undefined,
    })
    if (routeFeatureCandidates.length >= 6) break
  }
  if (!routeFeatureCandidates.length) {
    DEFAULT_FEATURES.forEach((feature) => routeFeatureCandidates.push({ ...feature }))
  }

  const prioritizedSpecFeatures = normalizedSpecFeatures.slice(0, 4)
  const features: InferredFeature[] = []
  const seenFeatureTitles = new Set<string>()

  prioritizedSpecFeatures.forEach((feature) => {
    const normalizedTitle = feature.title.toLowerCase()
    const routeCandidate = routeFeatureCandidates.find(
      (candidate) => candidate.title.toLowerCase() === normalizedTitle
    )
    features.push({
      title: feature.title,
      description:
        feature.description || `MobiusAI implemented ${feature.title.toLowerCase()} exactly as requested in your brief.`,
      href: routeCandidate?.href,
    })
    seenFeatureTitles.add(normalizedTitle)
  })

  for (const candidate of routeFeatureCandidates) {
    if (features.length >= 4) break
    const normalizedTitle = candidate.title.toLowerCase()
    if (seenFeatureTitles.has(normalizedTitle)) {
      const existing = features.find((feature) => feature.title.toLowerCase() === normalizedTitle)
      if (existing && !existing.href && candidate.href) {
        existing.href = candidate.href
      }
      continue
    }
    features.push(candidate)
    seenFeatureTitles.add(normalizedTitle)
  }

  if (!features.length) {
    DEFAULT_FEATURES.forEach((feature) => features.push({ ...feature }))
  }

  const sections: InferredSection[] = []
  const seenSections = new Set<string>()
  for (const route of staticPages) {
    if (!route.href || seenSections.has(route.href)) continue
    seenSections.add(route.href)
    const lowerLabel = route.label.toLowerCase()
    let icon: InferredSection['icon']
    if (sections.length === 0) {
      icon = 'overview'
    } else if (lowerLabel.includes('market')) {
      icon = 'marketplace'
    } else if (lowerLabel.includes('activity') || lowerLabel.includes('history') || lowerLabel.includes('log')) {
      icon = 'activity'
    } else if (lowerLabel.includes('settings') || lowerLabel.includes('config')) {
      icon = 'settings'
    }
    sections.push({
      href: route.href,
      label: route.label,
      description: `Jump to the ${route.trail.toLowerCase()} flow.`,
      icon,
    })
    if (sections.length >= 6) break
  }

  const keywords = Array.from(
    new Set(
      [
        projectName,
        routeName,
        ...primaryPage.segments.map((segment) => humanizeSlug(segment)),
        ...prioritizedSpecFeatures.map((feature) => feature.title),
        'Polkadot',
        'MobiusAI',
      ].filter(Boolean)
    )
  )

  return {
    name: projectName,
    shortName: projectName,
    summary,
    hero: {
      eyebrow: 'MobiusAI + Polkadot UI',
      title: projectName,
      subtitle: heroSubtitle,
      primaryCta: { href: entryPath, label: primaryLabel },
      secondaryCta: { href: '#network', label: 'View network status' },
    },
    features,
    app: {
      entryPath,
      sections,
    },
    keywords,
    themeColor: '#6d28d9',
  }
}

function escapeTsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')
}

function serializeValue(value: any, indent = 0, indentStep = 2): string {
  const indentation = ' '.repeat(indent)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value
      .map((item) => serializeValue(item, indent + indentStep, indentStep))
      .map((serialized) => `${' '.repeat(indent + indentStep)}${serialized}`)
    return `[\n${items.join(',\n')}\n${indentation}]`
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).filter(
      ([, v]) => v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '')
    )
    if (!entries.length) return '{}'
    const lines = entries.map(
      ([key, val]) =>
        `${' '.repeat(indent + indentStep)}${key}: ${serializeValue(val, indent + indentStep, indentStep)}`
    )
    return `{\n${lines.join(',\n')}\n${indentation}}`
  }
  if (typeof value === 'string') {
    return `'${escapeTsString(value)}'`
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return 'null'
}

function generateProjectConfigFile(metadata: InferredProjectMetadata): string {
  const template = TEMPLATES.projectConfig
  const splitToken = 'export const projectConfig: ProjectConfig = '
  const splitIndex = template.indexOf(splitToken)
  if (splitIndex === -1) {
    // Fallback to template if unexpected structure
    return template
  }
  const header = template.slice(0, splitIndex)
  const objectLiteral = serializeValue(metadata, 0, 2)
  return `${header}${splitToken}${objectLiteral}\n`
}

/**
 * Merge AI-generated Prisma schema with template auth models
 * Simple approach: Take auth models from template, domain models from AI as-is
 * Let Prisma validation guide the AI to generate correct schemas
 */
function mergePrismaSchemas(templateSchema: string, aiSchema: string, projectId: string): string {
  console.log(`[Draft ${projectId}] Merging Prisma schemas (simple mode)...`)
  
  // Auth model names that should come from template (immutable)
  const authModels = ['User', 'Account', 'Session', 'Credential', 'Wallet', 'Nonce', 'VerificationToken']
  
  // Extract models from AI schema
  const aiModelRegex = /model\s+(\w+)\s*\{[^}]*\}/gs
  const aiModels = new Map<string, string>()
  let match
  
  while ((match = aiModelRegex.exec(aiSchema)) !== null) {
    const modelName = match[1]
    const modelDef = match[0]
    aiModels.set(modelName, modelDef)
  }
  
  // Extract non-auth models from AI (domain models like Vote, Proposal, etc.)
  const domainModels: string[] = []
  const relationsToUser: Array<{ modelName: string; fieldName: string; relationName?: string }> = []
  
  for (const [modelName, modelDef] of aiModels.entries()) {
    if (!authModels.includes(modelName)) {
      domainModels.push(modelDef)
      console.log(`[Draft ${projectId}] Found domain model: ${modelName}`)
      
      // Simple detection: find any "fieldName User" patterns
      const lines = modelDef.split('\n')
      for (const line of lines) {
        const userRelMatch = line.match(/(\w+)\s+User\??/)
        if (userRelMatch) {
          const fieldName = userRelMatch[1]
          // Skip type keywords
          if (['String', 'Int', 'Boolean', 'DateTime', 'Decimal', 'Json'].includes(fieldName)) continue
          
          // Try to extract relation name from the same line
          const relationNameMatch = line.match(/@relation\(\s*"([^"]+)"/) || line.match(/@relation\([^)]*name:\s*"([^"]+)"/)
          const relationName = relationNameMatch ? relationNameMatch[1] : undefined
          
          relationsToUser.push({ modelName, fieldName, relationName })
        }
      }
    }
  }
  
  // Extract enums from AI schema
  const enumMatches = aiSchema.matchAll(/enum\s+(\w+)\s*\{[^}]+\}/gs)
  const enums: string[] = []
  for (const match of enumMatches) {
    enums.push(match[0])
  }
  
  // Start with template schema (includes User and all auth models)
  let mergedSchema = templateSchema
  
  // Add simple reverse relations to User model
  if (relationsToUser.length > 0) {
    const userModelRegex = /model User \{[\s\S]*?\n\}/
    const userModelMatch = mergedSchema.match(userModelRegex)
    
    if (userModelMatch) {
      let userModel = userModelMatch[0]
      const reverseRelations: string[] = []
      
      for (const rel of relationsToUser) {
        // Simple: fieldName + model plural (e.g., owner -> ownerNFTs)
        const reverseFieldName = rel.fieldName + rel.modelName + 's'
        const relationPart = rel.relationName ? ` @relation("${rel.relationName}")` : ''
        reverseRelations.push(`  ${reverseFieldName} ${rel.modelName}[]${relationPart}`)
      }
      
      if (reverseRelations.length > 0) {
        userModel = userModel.replace(/\n\}$/, '\n' + reverseRelations.join('\n') + '\n}')
        mergedSchema = mergedSchema.replace(userModelRegex, userModel)
        console.log(`[Draft ${projectId}] Added ${reverseRelations.length} reverse relations to User`)
      }
    }
  }
  
  // Append enums
  if (enums.length > 0) {
    mergedSchema += '\n\n// Enums generated by AI\n'
    mergedSchema += enums.join('\n\n')
    console.log(`[Draft ${projectId}] Added ${enums.length} enum definitions`)
  }
  
  // Append domain models AS-IS (no auto-fixing)
  if (domainModels.length > 0) {
    mergedSchema += '\n\n// Domain-specific models generated by AI\n'
    mergedSchema += domainModels.join('\n\n')
    console.log(`[Draft ${projectId}] Added ${domainModels.length} domain models`)
  }
  
  console.log(`[Draft ${projectId}] ✅ Schema merged successfully`)
  
  return mergedSchema
}

/**
 * Clean up old draft directories to prevent disk space issues
 */
async function cleanupOldDrafts() {
  try {
    if (!existsSync(DRAFT_BASE)) {
      return
    }

    const entries = await readdir(DRAFT_BASE, { withFileTypes: true })
    const drafts: Array<{ path: string; mtime: Date; size: number }> = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const draftPath = join(DRAFT_BASE, entry.name)
        try {
          const stats = await stat(draftPath)
          const size = await getDirectorySize(draftPath)
          drafts.push({
            path: draftPath,
            mtime: stats.mtime,
            size
          })
        } catch (err) {
          console.warn(`[DraftService] Failed to stat ${draftPath}:`, err)
        }
      }
    }

    // Sort by modification time (newest first)
    drafts.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

    // Remove drafts older than MAX_AGE_HOURS
    const now = new Date()
    const maxAge = DRAFT_MAX_AGE_HOURS * 60 * 60 * 1000

    for (const draft of drafts) {
      const age = now.getTime() - draft.mtime.getTime()
      if (age > maxAge) {
        console.log(`[DraftService] Removing old draft: ${draft.path} (age: ${Math.round(age / (60 * 60 * 1000))}h, size: ${Math.round(draft.size / 1024 / 1024)}MB)`)
        try {
          await rm(draft.path, { recursive: true, force: true })
          console.log(`[DraftService] ✅ Cleaned up old draft: ${draft.path}`)
        } catch (err: any) {
          console.warn(`[DraftService] Failed to remove ${draft.path}:`, err.message)
        }
      }
    }

    // Keep only the MAX_COUNT most recent drafts
    const draftsToRemove = drafts.slice(DRAFT_MAX_COUNT)
    for (const draft of draftsToRemove) {
      const age = now.getTime() - draft.mtime.getTime()
      // Only remove if also older than 30 minutes (reduced from 1 hour)
      if (age > 30 * 60 * 1000) {
        console.log(`[DraftService] Removing excess draft: ${draft.path} (size: ${Math.round(draft.size / 1024 / 1024)}MB)`)
        try {
          await rm(draft.path, { recursive: true, force: true })
          console.log(`[DraftService] ✅ Cleaned up excess draft: ${draft.path}`)
        } catch (err: any) {
          console.warn(`[DraftService] Failed to remove ${draft.path}:`, err.message)
        }
      }
    }
  } catch (err: any) {
    console.warn(`[DraftService] Cleanup error:`, err.message)
  }
}

/**
 * Calculate directory size recursively
 */
async function getDirectorySize(dir: string): Promise<number> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    let size = 0

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        size += await getDirectorySize(fullPath)
      } else {
        try {
          const stats = await stat(fullPath)
          size += stats.size
        } catch {
          // Ignore errors for individual files
        }
      }
    }

    return size
  } catch {
    return 0
  }
}

/**
 * Compute a hash of package.json to detect changes
 */
function computePackageHash(packageJsonContent: string): string {
  return createHash('sha256').update(packageJsonContent).digest('hex').substring(0, 16)
}

/**
 * Ensure node_modules cache exists and is up-to-date
 * Returns true if cache was created/updated, false if already valid
 */
async function ensureNodeModulesCache(packageJsonContent: string, projectId: string): Promise<boolean> {
  const packageHash = computePackageHash(packageJsonContent)
  const cachePackageJsonPath = join(DRAFT_CACHE_DIR, 'package.json')
  const cacheNodeModulesPath = join(DRAFT_CACHE_DIR, 'node_modules')
  const cacheHashPath = join(DRAFT_CACHE_DIR, '.package-hash')
  
  // Check if cache exists and is valid
  if (existsSync(cacheHashPath) && existsSync(cacheNodeModulesPath) && existsSync(cachePackageJsonPath)) {
    try {
      const cachedHash = await readFile(cacheHashPath, 'utf-8')
      if (cachedHash.trim() === packageHash) {
        console.log(`[DraftService] ✅ Using valid node_modules cache (hash: ${packageHash})`)
        return false // Cache is valid, no rebuild needed
      } else {
        console.log(`[DraftService] Cache outdated (hash mismatch: ${cachedHash.trim()} vs ${packageHash}), rebuilding...`)
      }
    } catch (err: any) {
      console.warn(`[DraftService] Failed to read cache hash:`, err.message)
    }
  } else {
    console.log(`[DraftService] No valid cache found, creating new one...`)
  }
  
  // Remove old cache if it exists
  if (existsSync(DRAFT_CACHE_DIR)) {
    try {
      await rm(DRAFT_CACHE_DIR, { recursive: true, force: true })
    } catch (err: any) {
      console.warn(`[DraftService] Failed to remove old cache:`, err.message)
    }
  }
  
  // Create cache directory
  await mkdir(DRAFT_CACHE_DIR, { recursive: true })
  
  // Write package.json to cache
  await writeFile(cachePackageJsonPath, packageJsonContent, 'utf-8')
  console.log(`[DraftService] Created cache package.json`)
  
  // Install dependencies in cache (this is the slow part, but only done once)
  const installStartedAt = Date.now()
  console.log(`[DraftService] Installing node_modules to cache... (this may take a few minutes)`)
  
  try {
    await execAsync('npm install --prefer-offline --no-audit --no-fund', {
      cwd: DRAFT_CACHE_DIR,
      timeout: 600000, // 10 minutes
      maxBuffer: 50 * 1024 * 1024,
    })
    
    const installDuration = Math.round((Date.now() - installStartedAt) / 1000)
    console.log(`[DraftService] ✅ Cache node_modules installed in ${installDuration}s`)
    
    // Write hash file
    await writeFile(cacheHashPath, packageHash, 'utf-8')
    
    return true // Cache was rebuilt
  } catch (err: any) {
    console.error(`[DraftService] Failed to install cache node_modules:`, err.message)
    throw err
  }
}

/**
 * Copy node_modules from cache to draft directory
 */
async function copyNodeModulesFromCache(targetDir: string, projectId: string): Promise<void> {
  const cacheNodeModulesPath = join(DRAFT_CACHE_DIR, 'node_modules')
  const targetNodeModulesPath = join(targetDir, 'node_modules')
  
  if (!existsSync(cacheNodeModulesPath)) {
    throw new Error('Cache node_modules does not exist')
  }
  
  const copyStartedAt = Date.now()
  console.log(`[Draft ${projectId}] Copying node_modules from cache...`)
  
  try {
    // Use cpSync for fast copying
    cpSync(cacheNodeModulesPath, targetNodeModulesPath, {
      recursive: true,
      filter: (src) => {
        // Skip .cache directories to save time
        return !src.includes('/.cache/')
      }
    })
    
    const copyDuration = Math.round((Date.now() - copyStartedAt) / 1000)
    console.log(`[Draft ${projectId}] ✅ node_modules copied from cache in ${copyDuration}s`)
  } catch (err: any) {
    console.error(`[Draft ${projectId}] Failed to copy node_modules from cache:`, err.message)
    throw err
  }
}

function getPortForProject(projectId: string): number {
  if (!portMap.has(projectId)) {
    // Hash-based port assignment for consistency across restarts
    const hash = projectId.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0)
    }, 0)
    const portOffset = Math.abs(hash) % 100 // Support up to 100 concurrent drafts
    const port = DRAFT_PORTS_START + portOffset
    portMap.set(projectId, port)
    console.log(`[DraftService] Assigned port ${port} to project ${projectId} (offset: ${portOffset})`)
  }
  return portMap.get(projectId)!
}

function expandAggregatedFiles(
  projectId: string,
  inputFiles: Array<{ path: string; content: string }>
): Array<{ path: string; content: string }> {
  const output: Array<{ path: string; content: string }> = []

  for (const file of inputFiles) {
    const normalizedPath = file.path.trim().toLowerCase()
    if (normalizedPath === 'code.txt' || normalizedPath === 'code.json') {
      try {
        const parsed = JSON.parse(file.content)
        if (parsed && Array.isArray(parsed.files)) {
          console.log(`[Draft ${projectId}] Expanding aggregated file bundle from ${file.path} (${parsed.files.length} entries)`)
          for (const entry of parsed.files) {
            if (entry && typeof entry.path === 'string') {
              output.push({
                path: entry.path,
                content: typeof entry.content === 'string' ? entry.content : '',
              })
            }
          }
          continue
        }
      } catch (err: any) {
        console.warn(`[Draft ${projectId}] Failed to parse aggregated file ${file.path}:`, err.message)
      }
    }

    output.push(file)
  }

  return output
}

const REACT_QUERY_IMPORT_REGEX =
  /import\s+([\s\S]+?)\s+from\s+['"]@tanstack\/react-query['"];?/g
const REACT_HOT_TOAST_REGEX =
  /import\s+(?:(\w+)\s*,\s*)?(?:\{([^}]*)\}\s*)?from\s+['"]react-hot-toast['"];?/g

function rewriteReactQueryImports(source: string): string {
  return source.replace(REACT_QUERY_IMPORT_REGEX, (fullImport, clause) => {
    const trimmedFull = fullImport.trimStart()
    if (trimmedFull.startsWith('import type')) {
      return fullImport
    }

    const leadingWhitespace = fullImport.match(/^\s*/)?.[0] ?? ''
    const clauseTrimmed = clause.trim()
    if (!clauseTrimmed.includes('useQuery')) {
      return fullImport
    }
    if (clauseTrimmed.startsWith('*')) {
      return fullImport
    }
    if (clauseTrimmed.startsWith('type ')) {
      return fullImport
    }

    let defaultImport = ''
    let namedBlock = ''

    if (clauseTrimmed.startsWith('{') && clauseTrimmed.endsWith('}')) {
      namedBlock = clauseTrimmed.slice(1, -1)
    } else {
      const comboMatch = clauseTrimmed.match(/^([^,{]+),\s*\{([\s\S]*)\}$/)
      if (comboMatch) {
        defaultImport = comboMatch[1].trim()
        namedBlock = comboMatch[2]
      } else {
        defaultImport = clauseTrimmed
      }
    }

    if (!namedBlock) {
      return fullImport
    }

    const namedSpecifiers = namedBlock
      .split(',')
      .map((spec) => spec.trim())
      .filter(Boolean)

    if (!namedSpecifiers.length) {
      return fullImport
    }

    const compatSpecifiers: string[] = []
    const remainingSpecifiers: string[] = []

    for (const spec of namedSpecifiers) {
      const baseName = spec.split(/\s+as\s+/)[0].trim()
      if (baseName === 'useQuery') {
        compatSpecifiers.push(spec)
      } else {
        remainingSpecifiers.push(spec)
      }
    }

    if (!compatSpecifiers.length) {
      return fullImport
    }

    const newImports: string[] = []
    const originalSegments: string[] = []

    if (defaultImport && defaultImport !== 'useQuery') {
      originalSegments.push(defaultImport)
    } else if (defaultImport === 'useQuery') {
      compatSpecifiers.push('useQuery')
    }

    if (remainingSpecifiers.length) {
      originalSegments.push(`{ ${remainingSpecifiers.join(', ')} }`)
    }

    if (originalSegments.length) {
      newImports.push(
        `${leadingWhitespace}import ${originalSegments.join(', ')} from '@tanstack/react-query';`
      )
    }

    newImports.push(
      `${leadingWhitespace}import { ${compatSpecifiers.join(', ')} } from '@/lib/reactQueryCompat';`
    )

    return `${newImports.join('\n')}\n`
  })
}

function ensureCompatHasUseQueryImport(source: string): string {
  if (!source.includes("from '@/lib/reactQueryCompat'")) {
    return source
  }
  if (!source.includes('useQuery')) return source
  if (!source.includes("from '@tanstack/react-query'")) return source
  return source
}

function rewriteReactHotToastImports(source: string): string {
  return source.replace(REACT_HOT_TOAST_REGEX, (_match, defaultImport, namedBlock) => {
    const specifiers = new Map<string, string>()

    const addSpecifier = (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed) return
      const [name, alias] = trimmed.split(/\s+as\s+/i).map((part) => part.trim())
      if (!name) return
      specifiers.set(name, alias || name)
    }

    if (defaultImport) {
      const alias = defaultImport.trim()
      if (alias) {
        if (alias === 'toast') {
          specifiers.set('toast', 'toast')
        } else {
          specifiers.set('toast', alias)
        }
      }
    }

    if (namedBlock) {
      namedBlock.split(',').forEach(addSpecifier)
    }

    if (!specifiers.size) {
      specifiers.set('toast', 'toast')
    }

    const normalized = Array.from(specifiers.entries())
      .map(([name, alias]) => (name === alias ? name : `${name} as ${alias}`))
      .join(', ')

    return `import { ${normalized} } from 'sonner'`
  })
}

function rewritePreferenceStoreImports(source: string): string {
  return source
    .replace(/from\s+['"]@\/lib\/store\/preferenceStore['"]/g, "from '@/hooks/usePreferenceStore'")
    .replace(/from\s+['"]@\/lib\/store\/usePreference['"]/g, "from '@/hooks/usePreferenceStore'")
    .replace(/from\s+['"]@\/lib\/store\/preference['"]/g, "from '@/hooks/usePreferenceStore'")
    .replace(/from\s+['"]@\/lib\/store\/usePreferenceStore['"]/g, "from '@/hooks/usePreferenceStore'")
    .replace(/from\s+['"]@\/lib\/store\/PreferenceStore['"]/g, "from '@/hooks/usePreferenceStore'")
    .replace(/from\s+['"]@\/lib\/store['"]/g, "from '@/hooks/usePreferenceStore'")
}

function normalizeAppHrefPaths(source: string): string {
  return source
    .replace(/href\s*=\s*"\/app\//g, 'href="/')
    .replace(/href\s*=\s*'\/app\//g, "href='/")
}

function rewriteLegacyUseQueryCalls(source: string): string {
  return source.replace(
    /useQuery\s*<([^>]+)>\s*\(\s*\[([^\]]*)\]\s*,\s*([^)]+?)\)/g,
    (_match, generics, key, fn) => {
      return `useQuery<${generics}>({ queryKey: [${key}], queryFn: ${fn.trim()} })`
    }
  )
}

function ensureLegacyLinkForAnchors(source: string): string {
  return source.replace(/<Link([^>]*?)>([\s\S]*?)<\/Link>/g, (match, attrs, inner) => {
    if (/legacyBehavior/.test(attrs)) {
      return match
    }

    if (!/<a[\s>]/i.test(inner)) {
      return match
    }

    const trimmedAttrs = attrs.replace(/\s+$/, '')
    return `<Link${trimmedAttrs} legacyBehavior>${inner}</Link>`
  })
}

export async function buildAndServeDraft(projectId: string, files: Array<{ path: string; content: string }>): Promise<{ previewUrl: string; port: number; buildPromise: Promise<any> }> {
  const baseDir = join(DRAFT_BASE, projectId)
  const port = getPortForProject(projectId)
  const projectFiles = expandAggregatedFiles(projectId, files)
  let projectContext: ProjectContext = {}

  try {
    const [projectRecord, latestSpec] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true, prompt: true },
      }),
      prisma.artifact.findFirst({
        where: { projectId, kind: 'spec' },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const rawTitle = projectRecord?.title?.trim()
    const promptTitle = projectRecord?.prompt
      ?.split('\n')
      .map((line) => line.trim())
      .find((line) => Boolean(line))
    const normalizedTitle =
      rawTitle && rawTitle.toLowerCase() !== 'untitled'
        ? rawTitle
        : promptTitle?.slice(0, 80)

    projectContext = {
      title: normalizedTitle,
      prompt: projectRecord?.prompt,
      spec: parseSpecDocument(latestSpec?.content),
    }
  } catch (err: any) {
    console.warn(`[Draft ${projectId}] Failed to load project context:`, err.message)
  }
  
  // Clean up old drafts before starting new build (prevent disk space issues)
  await cleanupOldDrafts()
  
  // Remove existing draft directory if it exists (fresh build)
  if (existsSync(baseDir)) {
    try {
      await rm(baseDir, { recursive: true, force: true })
      console.log(`[Draft ${projectId}] Removed existing draft directory for fresh build`)
    } catch (err: any) {
      console.warn(`[Draft ${projectId}] Failed to remove existing directory:`, err.message)
    }
  }
  
  // Create directory
  await mkdir(baseDir, { recursive: true })

  // STEP 1: Pre-validation - catch errors early
  console.log(`[Draft ${projectId}] Running pre-validation...`)
  const validationResult = CodeValidator.validateProject(projectFiles)
  if (validationResult.errors.length > 0) {
    console.warn(`[Draft ${projectId}] Found ${validationResult.errors.length} errors, ${validationResult.fixable.length} fixable`)
    // Log errors for visibility
    validationResult.errors.slice(0, 5).forEach(err => {
      console.warn(`[Draft ${projectId}] Error in ${err.file}: ${err.message}`)
    })
  }

  // STEP 2: Template injection - inject immutable infrastructure files
  const finalFiles: Array<{ path: string; content: string }> = []
  const aiFiles = new Set(projectFiles.map(f => f.path))
  
  // Inject all required infrastructure templates
  // STATIC EXPORT MODE: No database, no API routes, client-side only
  const projectMetadata = inferProjectMetadata(projectFiles, projectContext)

  const infrastructureFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.mjs',
    'tailwind.config.ts',
    'postcss.config.js',
    'app/globals.css',
    'app/layout.tsx',
    'app/page.tsx',
    'app/experience/page.tsx',
    'providers/AppProviders.tsx',
    'providers/PreferenceStore.ts',
    'providers/PolkadotUIProvider.tsx',
    'lib/projectConfig.ts',
    'lib/reactQueryCompat.ts',
    'lib/examples/useReactQueryExample.ts',
    'components/forms/MintNftForm.tsx',
    'components/wallet/WalletPanel.tsx',
    'components/wallet/TxHistoryTable.tsx',
    'components/charts/NetworkHealth.tsx',
    'hooks/usePolkadotUI.ts',
    'hooks/usePreferenceStore.ts',
    'components/layout/AppShell.tsx',
    'components/layout/NavItems.ts',
    'components/ui/tabs.tsx',
    'components/ui/card.tsx',
    'components/polkadot-ui/index.ts',
    'components/polkadot-ui/ConnectWallet.tsx',
    'components/polkadot-ui/NetworkIndicator.tsx',
    'components/polkadot-ui/RequireConnection.tsx',
    'components/polkadot-ui/RequireAccount.tsx',
    'components/polkadot-ui/TxButton.tsx',
    'components/polkadot-ui/TxNotification.tsx',
    'components/polkadot-ui/AccountInfo.tsx',
    'components/polkadot-ui/BalanceDisplay.tsx',
    'components/polkadot-ui/AddressInput.tsx',
    'components/polkadot-ui/AmountInput.tsx',
    'components/polkadot-ui/SelectToken.tsx',
    'components/polkadot-ui/SelectTokenDialog.tsx',
    'lib/chains.ts',
    'lib/tx/submit.ts',
    // Removed: Prisma, NextAuth, API routes, types, .env
  ]
  
  console.log(`[Draft ${projectId}] Injecting infrastructure templates...`)
  for (const infraFile of infrastructureFiles) {
    if (infraFile === 'lib/projectConfig.ts') {
      const content = generateProjectConfigFile(projectMetadata)
      finalFiles.push({ path: infraFile, content })
      console.log(`[Draft ${projectId}] Injected generated projectConfig.ts`)
      continue
    }

    const template = getTemplate(infraFile)
    if (template) {
      let content: string
      if (typeof template === 'object') {
        if (infraFile === 'package.json') {
          // Customize package.json with project name
          const pkgTemplate = { ...template as any }
          pkgTemplate.name = projectId.substring(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '-')
          content = JSON.stringify(pkgTemplate, null, 2)
        } else {
          content = JSON.stringify(template, null, 2)
        }
      } else {
        content = template
      }
      finalFiles.push({ path: infraFile, content })
      console.log(`[Draft ${projectId}] Injected template: ${infraFile}`)
    }
  }
  
  // STEP 3: Process AI-generated files (filter out immutable files and database-related files)
  console.log(`[Draft ${projectId}] Processing AI-generated files...`)
  for (const file of projectFiles) {
    // Skip immutable files - we use templates instead
    if (isImmutable(file.path)) {
      console.log(`[Draft ${projectId}] Skipping immutable file (using template): ${file.path}`)
      continue
    }
    
    // STATIC EXPORT: Skip database-related files (Prisma, API routes)
    if (file.path.includes('prisma/schema.prisma')) {
      console.log(`[Draft ${projectId}] Skipping Prisma schema (static export - no database)`)
      continue
    }
    
    if (file.path.includes('app/api/')) {
      console.log(`[Draft ${projectId}] Skipping API route (static export): ${file.path}`)
      continue
    }
    
    // AUTO-FIX: Remove Google/email sign-in from signin pages (Polkadot-only auth)
    if (file.path.includes('/signin/') || file.path.includes('/signin/page.tsx')) {
      let content = file.content
      
      // Remove Google sign-in button/imports
      content = content.replace(/import.*GoogleSignInButton.*from.*\n/g, '')
      content = content.replace(/signIn\(['"]google['"].*\)/g, '')
      content = content.replace(/<.*button.*onClick.*signIn\(['"]google['"].*>.*Sign in with Google.*<\/button>/g, '')
      
      // Remove email/password form
      content = content.replace(/import.*CredentialsSignInForm.*from.*\n/g, '')
      content = content.replace(/<form[^>]*onSubmit[^>]*>[\s\S]*?<\/form>/g, (match) => {
        if (match.includes('email') && match.includes('password')) return ''
        return match
      })
      
      // Remove signup links
      content = content.replace(/<Link[^>]*href=['"]\/signup['"][^>]*>.*<\/Link>/gi, '')
      content = content.replace(/No account\?.*Create one.*/gi, '')
      
      file.content = content
      console.log(`[Draft ${projectId}] ✅ Auto-fixed signin page (removed Google/email, kept Polkadot-only)`)
    }
    
    // AUTO-FIX: Delete signup pages (not needed for wallet-only auth)
    if (file.path.includes('/signup/')) {
      console.log(`[Draft ${projectId}] ⚠️ Skipping signup page (wallet-only auth): ${file.path}`)
      continue
    }
    
    // AUTO-FIX: Delete Google/Credentials components
    if (file.path.includes('GoogleSignInButton') || file.path.includes('CredentialsSignInForm')) {
      console.log(`[Draft ${projectId}] ⚠️ Skipping ${file.path} (wallet-only auth)`)
      continue
    }
    
    // Add AI-generated business logic files
    finalFiles.push(file)
  }
  
  // STEP 4: Ensure app/layout.tsx exists (REQUIRED by Next.js 14 App Router)
  const hasRootLayout = finalFiles.some(f => f.path === 'app/layout.tsx')
  if (!hasRootLayout) {
    console.warn(`[Draft ${projectId}] ⚠️ CRITICAL: app/layout.tsx missing! Auto-generating root layout...`)
    const defaultLayout = `import '@/app/globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
`
    finalFiles.push({ path: 'app/layout.tsx', content: defaultLayout })
    console.log(`[Draft ${projectId}] ✅ Auto-generated app/layout.tsx`)
  }

  // STEP 5: Write all files (templates + AI code)
  console.log(`[Draft ${projectId}] Writing ${finalFiles.length} files (${infrastructureFiles.length} templates + ${projectFiles.length} AI files) to ${baseDir}...`)
  
  for (const file of finalFiles) {
    const filePath = join(baseDir, file.path)
    const dirPath = filePath.split('/').slice(0, -1).join('/')
    
    try {
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true })
      }
    } catch (mkdirErr: any) {
      console.error(`[Draft ${projectId}] Failed to create directory ${dirPath}:`, mkdirErr.message)
      throw new Error(`Failed to create directory for ${file.path}: ${mkdirErr.message}`)
    }
    
    // Inject fixed credentials into code files
    let content = file.content
    if (file.path.includes('.env') || file.path.includes('.env.local') || file.path.includes('.env.example')) {
      // Replace with our fixed credentials
      content = `# MobiusAI Draft Environment
NEXT_PUBLIC_APP_NAME=Mobius Draft (${projectId})
NEXT_PUBLIC_POLKADOT_ENDPOINT=${process.env.NEXT_PUBLIC_POLKADOT_ENDPOINT || 'wss://rpc.polkadot.io'}
NEXT_PUBLIC_POLKADOT_CHAIN=${process.env.NEXT_PUBLIC_POLKADOT_CHAIN || 'Polkadot'}
NEXT_PUBLIC_POLKADOT_UNIT=${process.env.NEXT_PUBLIC_POLKADOT_UNIT || 'DOT'}
NEXT_PUBLIC_POLKADOT_DECIMALS=${process.env.NEXT_PUBLIC_POLKADOT_DECIMALS || '10'}
NEXT_PUBLIC_POLKADOT_FALLBACKS=${process.env.NEXT_PUBLIC_POLKADOT_FALLBACKS || ''}
GROQ_API_KEY=${process.env.GROQ_API_KEY || ''}
GROQ_BASE_URL=${process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'}
GROQ_MODEL=${process.env.GROQ_MODEL || 'openai/gpt-oss-120b'}
PORT=${port}
`
    } else if (file.path.includes('package.json')) {
      try {
        const pkg = JSON.parse(content)
        // Remove any scripts that rely on patch-package (not available in our runtime)
        if (pkg.scripts) {
          for (const scriptName of Object.keys(pkg.scripts)) {
            const scriptValue = pkg.scripts[scriptName]
            if (typeof scriptValue === 'string' && scriptValue.includes('patch-package')) {
              console.log(`[Draft ${projectId}] Removed script "${scriptName}" referencing patch-package`)
              delete pkg.scripts[scriptName]
            }
          }
        }
        // Remove patch-package dependency if present
        if (pkg.dependencies && pkg.dependencies['patch-package']) {
          console.log(`[Draft ${projectId}] Removed patch-package from dependencies`)
          delete pkg.dependencies['patch-package']
        }
        if (pkg.devDependencies && pkg.devDependencies['patch-package']) {
          console.log(`[Draft ${projectId}] Removed patch-package from devDependencies`)
          delete pkg.devDependencies['patch-package']
        }

        // Ensure required scripts and dependencies
        if (!pkg.scripts) pkg.scripts = {}
        // Update scripts to use correct port
        pkg.scripts = {
          ...pkg.scripts,
          dev: `next dev -p ${port}`,
          build: 'next build',
          start: `next start -p ${port}`
        }
        // Ensure critical deps - fix versions FIRST, then merge (so our versions win)
        if (!pkg.dependencies) pkg.dependencies = {}
        // For STATIC EXPORT apps with Polkadot Agent Kit integration
        const fixedDeps: Record<string, string> = {
          next: '^14.2.6',
          react: '^18.3.1',
          'react-dom': '^18.3.1',
          '@polkadot/api': '^10.13.1',
          '@polkadot/types': '^10.13.1',
          '@polkadot/extension-dapp': '^0.47.2',
          '@polkadot/util': '^12.6.2',
          '@polkadot/util-crypto': '^12.6.2',
          '@polkadot/keyring': '^13.5.7',
          '@tanstack/react-query': '^5.59.1',
          'class-variance-authority': '^0.7.0',
          'framer-motion': '^11.5.5',
          'lucide-react': '^0.453.0',
          'sonner': '^1.5.0',
          'zustand': '^4.5.4',
          assert: '^2.0.0',
          buffer: '^6.0.3',
          'crypto-browserify': '^3.12.0',
          'stream-browserify': '^3.0.0',
          util: '^0.12.5',
          process: '^0.11.10',
        }
        
        // Fix any Polkadot packages with invalid versions (AI might generate wrong versions)
        // Different @polkadot packages have different version schemes - validate and fix them
        const validPolkadotVersions: Record<string, string> = {
          '@polkadot/api': '^10.13.1',
          '@polkadot/types': '^10.13.1',
          '@polkadot/types-codec': '^10.13.1',
          '@polkadot/util': '^12.6.2',
          '@polkadot/util-crypto': '^12.6.2',
          '@polkadot/keyring': '^13.5.7',
          '@polkadot/extension-dapp': '^0.47.2',
        }
        
        // Fix common package name typos first
        if (pkg.dependencies) {
          // Fix @polkadot/extensions-dapp -> @polkadot/extension-dapp (AI sometimes adds 's')
          if (pkg.dependencies['@polkadot/extensions-dapp']) {
            const wrongVersion = pkg.dependencies['@polkadot/extensions-dapp']
            delete pkg.dependencies['@polkadot/extensions-dapp']
            // Use correct version from fixedDeps instead of keeping the wrong version
            pkg.dependencies['@polkadot/extension-dapp'] = fixedDeps['@polkadot/extension-dapp']
            console.log(`[Draft ${projectId}] Fixed typo: @polkadot/extensions-dapp -> @polkadot/extension-dapp (version ${wrongVersion} -> ${fixedDeps['@polkadot/extension-dapp']})`)
          }
        }
        
        // @polkadot/api uses v10.x (10.13.1), not v13.x or v16.x - update if wrong version detected
        if (pkg.dependencies && pkg.dependencies['@polkadot/api']) {
          const apiVersion = pkg.dependencies['@polkadot/api']
          // If version is v13.x or v16.x (wrong), fix to v10.x
          if (apiVersion.match(/[\^~]?13\./) || apiVersion.match(/[\^~]?16\./)) {
            pkg.dependencies['@polkadot/api'] = '^10.13.1'
            console.log(`[Draft ${projectId}] Fixed @polkadot/api version from ${apiVersion} to ^10.13.1`)
          }
        }
        
        for (const dep of Object.keys(pkg.dependencies || {})) {
          if (dep.startsWith('@polkadot/')) {
            const version = pkg.dependencies[dep]
            // If version is invalid (10.x or 11.x for packages that don't support it, or 13.x for packages that don't exist)
            // OR if we have a valid version defined for this package, use it
            if (validPolkadotVersions[dep]) {
              // Use the valid version we know works
              pkg.dependencies[dep] = validPolkadotVersions[dep]
              console.log(`[Draft ${projectId}] Fixed ${dep} version to ${validPolkadotVersions[dep]}`)
            } else if (version && (version.match(/[\^~]?11\./) || (version.match(/[\^~]?13\./) && dep !== '@polkadot/keyring'))) {
              // For unknown @polkadot packages with suspicious versions (v11.x or v13.x for packages other than keyring)
              // Remove it if we don't have a valid version defined
              console.log(`[Draft ${projectId}] Removing ${dep} with potentially invalid version ${version}`)
              delete pkg.dependencies[dep]
            }
          }
        }
        
        // Merge: spread existing deps, then override with fixed versions
        pkg.dependencies = {
          ...pkg.dependencies,
          ...fixedDeps
        }
        // Ensure critical dev deps
        if (!pkg.devDependencies) pkg.devDependencies = {}
        const fixedDevDeps: Record<string, string> = {
          typescript: '^5.6.3',
          '@types/node': '^20.12.12',
          '@types/react': '^18.3.3',
          '@types/react-dom': '^18.3.0',
          autoprefixer: '^10.4.20',
          postcss: '^8.4.49',
          tailwindcss: '^3.4.13',
          eslint: '^8.57.0',
          'eslint-config-next': '^14.2.6',
        }
        pkg.devDependencies = {
          ...pkg.devDependencies,
          ...fixedDevDeps
        }
        content = JSON.stringify(pkg, null, 2)
      } catch {
        // Keep original if invalid JSON
      }
    } else if (file.path.includes('tsconfig.json')) {
      try {
        const tsConfig = JSON.parse(content)
        // Ensure path aliases are configured
        if (!tsConfig.compilerOptions) tsConfig.compilerOptions = {}
        tsConfig.compilerOptions.paths = {
          '@/*': ['./*'],
          ...tsConfig.compilerOptions.paths
        }
        tsConfig.compilerOptions.baseUrl = '.'
        // Add skipLibCheck to avoid type errors in node_modules
        tsConfig.compilerOptions.skipLibCheck = true
        // CRITICAL: Add typeRoots to ensure custom type definitions are found
        tsConfig.compilerOptions.typeRoots = ['./node_modules/@types', './types']
        // CRITICAL: Ensure types directory is included (don't use ||, always add it)
        if (!tsConfig.include) {
          tsConfig.include = ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts']
        }
        // Always add types/**/*.d.ts if not already there
        if (!tsConfig.include.includes('types/**/*.d.ts')) {
          tsConfig.include.push('types/**/*.d.ts')
        }
        content = JSON.stringify(tsConfig, null, 2)
      } catch {
        // Keep original if invalid JSON
      }
    } else if (file.path.includes('app/api/auth/[...nextauth]/route.ts')) {
      // Fix NextAuth route handler to use correct Next.js 14 pattern
      // Ensure it uses: const handler = NextAuth(authOptions); export { handler as GET, handler as POST }
      
      // Always ensure correct NextAuth import and usage for Next.js 14
      // NextAuth must be imported as default export and called correctly
      let fixedContent = content.trim()
      let needsFix = false
      
      // Remove any leading/trailing whitespace or comments
      fixedContent = fixedContent.replace(/^[\s\n]*/, '').replace(/[\s\n]*$/, '')
      
      // Fix incorrect NextAuth imports (e.g., named import instead of default)
      if (fixedContent.includes('import { NextAuth }') || fixedContent.includes('import * as NextAuth')) {
        fixedContent = fixedContent.replace(/import\s+\{\s*NextAuth\s*\}\s+from\s+['"]next-auth['"];?/g, "import NextAuth from 'next-auth'")
        fixedContent = fixedContent.replace(/import\s+\*\s+as\s+NextAuth\s+from\s+['"]next-auth['"];?/g, "import NextAuth from 'next-auth'")
        needsFix = true
      }
      
      // Always replace the entire file with correct pattern to ensure it works
      // ALWAYS use @/lib/authConfig (not @/lib/auth) for NextAuth route handler
      content = `import NextAuth from 'next-auth'
import { authOptions } from '@/lib/authConfig'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
`
      console.log(`[Draft ${projectId}] Fixed NextAuth route handler in ${file.path}`)
    } else if (file.path.includes('next.config') || file.path.includes('next.config.mjs')) {
      // Fix next.config.mjs to use correct Next.js 14 format
      // Remove any defineConfig imports/usage and ensure correct format
      if (content.includes('defineConfig') || content.includes('from "next"')) {
        // Replace with correct Next.js 14 format
        content = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

export default nextConfig
`
      } else {
        // Try to parse and fix existing config
        let needsFixing = false
        let fixedContent = content
        
        // Remove invalid experimental options (not needed in Next.js 14)
        // Try to parse and clean up experimental block
        try {
          const configMatch = fixedContent.match(/export\s+default\s*({[\s\S]*?});?\s*$/m)
          if (configMatch) {
            const configStr = configMatch[1]
            // Try to evaluate as JS object
            const parsed = eval(`(${configStr})`)
            
            // Remove invalid experimental options
            if (parsed.experimental) {
              // Remove appDir (not needed in Next.js 14)
              if (parsed.experimental.appDir !== undefined) {
                delete parsed.experimental.appDir
                needsFixing = true
              }
              // Remove serverActions (default in Next.js 14)
              if (parsed.experimental.serverActions !== undefined) {
                delete parsed.experimental.serverActions
                needsFixing = true
              }
              // Remove experimental block if empty
              if (Object.keys(parsed.experimental).length === 0) {
                delete parsed.experimental
                needsFixing = true
              }
            }
            
            // Ensure output is standalone
            if (!parsed.output || parsed.output !== 'standalone') {
              parsed.output = 'standalone'
              needsFixing = true
            }
            
            if (needsFixing) {
              fixedContent = `/** @type {import('next').NextConfig} */
const nextConfig = ${JSON.stringify(parsed, null, 2).replace(/"/g, "'")}

export default nextConfig
`
            }
          }
        } catch {
          // If parsing fails, use simpler regex removal
          if (fixedContent.includes('experimental') && fixedContent.includes('appDir')) {
            // Remove experimental.appDir with regex
            fixedContent = fixedContent.replace(/experimental\s*:\s*\{[\s\S]*?appDir[\s\S]*?\}[,\s]*/g, '')
            fixedContent = fixedContent.replace(/,\s*experimental\s*:\s*\{[\s\S]*?appDir[\s\S]*?\}/g, '')
            needsFixing = true
          }
        }
        
        // Ensure output standalone is present
        if (!fixedContent.includes('output') || !fixedContent.includes('standalone')) {
          const configMatch = fixedContent.match(/export\s+default\s*({[^}]*})/s)
          if (configMatch) {
            try {
              // Try to parse and add output
              const configStr = configMatch[1]
              const parsed = eval(`(${configStr})`)
              parsed.output = 'standalone'
              // Remove experimental if it exists
              if (parsed.experimental) {
                delete parsed.experimental.appDir
                delete parsed.experimental.serverActions
                // Remove experimental if empty
                if (Object.keys(parsed.experimental).length === 0) {
                  delete parsed.experimental
                }
              }
              fixedContent = fixedContent.replace(/export\s+default\s*({[^}]*})/s, `export default ${JSON.stringify(parsed, null, 2)}`)
              needsFixing = true
            } catch {
              // If parsing fails, replace with correct format
              fixedContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

export default nextConfig
`
              needsFixing = true
            }
          } else {
            // No config found, add default
            fixedContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

export default nextConfig
`
            needsFixing = true
          }
        }
        
        if (needsFixing) {
          content = fixedContent
          console.log(`[Draft ${projectId}] Fixed next.config.mjs - removed invalid options`)
        }
      }
    }
    
    try {
      // Basic validation and fixes for TypeScript/JSX files
      if (file.path.endsWith('.tsx') || file.path.endsWith('.ts')) {
        // Remove any BOM or invisible characters at the start
        content = content.replace(/^\uFEFF/, '').trim()
        
        if (file.path !== 'lib/reactQueryCompat.ts') {
          content = rewriteReactQueryImports(content)
          content = rewriteReactHotToastImports(content)
          content = rewriteLegacyUseQueryCalls(content)
        } else {
          content = ensureCompatHasUseQueryImport(content)
        }
        content = rewritePreferenceStoreImports(content)
        content = ensureLegacyLinkForAnchors(content)
        content = normalizeAppHrefPaths(content)

        // Fix incorrect Prisma imports (CRITICAL)
        // AI often generates: import prisma from '@/lib/prisma'
        // Correct pattern: import { prisma } from '@/lib/prisma'
        if (content.includes("import prisma from '@/lib/prisma'") || content.includes('import prisma from "@/lib/prisma"')) {
          content = content.replace(/import\s+prisma\s+from\s+['"]@\/lib\/prisma['"]/g, "import { prisma } from '@/lib/prisma'")
          console.log(`[Draft ${projectId}] Fixed Prisma import from default to named export in ${file.path}`)
        }
        
        // Fix double closing braces in imports (AI syntax error)
        // AI sometimes generates: import { authOptions } } from '@/lib/auth'
        // Correct: import { authOptions } from '@/lib/auth'
        if (content.includes('} } from')) {
          content = content.replace(/\}\s+\}\s+from/g, '} from')
          console.log(`[Draft ${projectId}] Fixed double closing brace in import statement in ${file.path}`)
        }
        if (content.includes('}} from')) {
          content = content.replace(/\}\}\s+from/g, '} from')
          console.log(`[Draft ${projectId}] Fixed double closing brace (no space) in import in ${file.path}`)
        }
        
        // Fix implicit any types in function parameters (common in .map, .filter callbacks)
        // Pattern: .map(item => ...) or .map((item) => ...) should be .map((item: any) => ...)
        // This is a quick fix for strict TypeScript - proper types should be inferred but adding :any prevents build failures
        const implicitAnyPatterns = [
          // .map(x => ...) or .map((x) => ...) -> .map((x: any) => ...)
          { pattern: /\.map\(\((\w+)\)\s*=>/g, method: 'map' },      // With parens: .map((x) =>
          { pattern: /\.map\((\w+)\s*=>/g, method: 'map' },          // Without parens: .map(x =>
          { pattern: /\.filter\(\((\w+)\)\s*=>/g, method: 'filter' },
          { pattern: /\.filter\((\w+)\s*=>/g, method: 'filter' },
          { pattern: /\.forEach\(\((\w+)\)\s*=>/g, method: 'forEach' },
          { pattern: /\.forEach\((\w+)\s*=>/g, method: 'forEach' },
          { pattern: /\.find\(\((\w+)\)\s*=>/g, method: 'find' },
          { pattern: /\.find\((\w+)\s*=>/g, method: 'find' },
          { pattern: /\.some\(\((\w+)\)\s*=>/g, method: 'some' },
          { pattern: /\.some\((\w+)\s*=>/g, method: 'some' },
          { pattern: /\.every\(\((\w+)\)\s*=>/g, method: 'every' },
          { pattern: /\.every\((\w+)\s*=>/g, method: 'every' },
        ]
        
        let fixedImplicitAny = false
        for (const { pattern } of implicitAnyPatterns) {
          const newContent = content.replace(pattern, (match, paramName) => {
            // Only fix if not already typed
            if (!match.includes(`${paramName}:`)) {
              fixedImplicitAny = true
              // Handle both .map(x => and .map((x) =>
              if (match.includes(`(${paramName})`)) {
                // Already has parens: .map((x) => becomes .map((x: any) =>
                return match.replace(`(${paramName})`, `(${paramName}: any)`)
              } else {
                // No parens: .map(x => becomes .map((x: any) =>
                return match.replace(`${paramName} =>`, `(${paramName}: any) =>`)
              }
            }
            return match
          })
          content = newContent
        }
        
        if (fixedImplicitAny) {
          console.log(`[Draft ${projectId}] Fixed implicit any types in callback parameters in ${file.path}`)
        }
        
        // Fix Prisma User.create with password field
        // Pattern: prisma.user.create({ data: { email, name, password: hashed } })
        // Should be: prisma.user.create({ data: { email, name, credentials: { create: { email, password: hashed } } } })
        if (content.includes('prisma.user.create') && content.includes('password:')) {
          const passwordFieldRegex = /prisma\.user\.create\(\s*\{[\s\S]*?data:\s*\{([^}]*),?\s*password:\s*(\w+)[,\s]*([^}]*)\}\s*\}\s*\)/g
          const newContent = content.replace(passwordFieldRegex, (match) => {
            // Extract the password variable name (e.g., "hashed")
            const passwordMatch = match.match(/password:\s*(\w+)/)
            if (passwordMatch) {
              const passwordVar = passwordMatch[1]
              // Remove the password field and add credentials nested create
              let fixed = match.replace(new RegExp(`,?\\s*password:\\s*${passwordVar}[,\\s]*`), '')
              // Add credentials with BOTH email and password (Credential model requires both)
              fixed = fixed.replace(/\}\s*\}\s*\)$/, `,\n      credentials: {\n        create: {\n          email,\n          password: ${passwordVar}\n        }\n      }\n    }\n  })`)
              console.log(`[Draft ${projectId}] Fixed User.create password field to use Credential model in ${file.path}`)
              return fixed
            }
            return match
          })
          content = newContent
        }
        
        // Fix credentials.create missing email field
        // Pattern: credentials: { create: { password: hashed } }
        // Should be: credentials: { create: { email, password: hashed } }
        if (content.includes('credentials:') && content.includes('create:') && content.includes('password:')) {
          // Check if email is missing from credentials.create
          const credentialsCreateRegex = /credentials:\s*\{\s*create:\s*\{([^}]*)\}/g
          let fixedCredentials = false
          const newContent = content.replace(credentialsCreateRegex, (match, fields) => {
            // Check if email is already in the fields
            if (!fields.includes('email')) {
              fixedCredentials = true
              // Add email before password
              const fixed = match.replace(/create:\s*\{/, 'create: {\n          email,')
              return fixed
            }
            return match
          })
          if (fixedCredentials) {
            content = newContent
            console.log(`[Draft ${projectId}] Added missing email field to credentials.create in ${file.path}`)
          }
        }
        
        // Fix session?.user?.id access - TypeScript often doesn't recognize id property
        // Even with type augmentation, id might not be recognized during Next.js build
        // Pattern: session?.user?.id → (session?.user as any)?.id
        if (content.includes('session?.user?.id')) {
          const originalContent = content
          content = content.replace(/session\?\.user\?\.id/g, '(session?.user as any)?.id')
          if (content !== originalContent) {
            console.log(`[Draft ${projectId}] Fixed session?.user?.id with type casting in ${file.path}`)
          }
        }
        
        // Fix null type mismatches - session.user properties can be null but some functions expect string | undefined
        // Pattern: session?.user?.name (string | null | undefined) → session?.user?.name || undefined
        // This converts null to undefined to satisfy stricter type constraints
        let nullFixLines = content.split('\n')
        let fixedNullTypes = false
        for (let i = 0; i < nullFixLines.length; i++) {
          let currentLine = nullFixLines[i]
          // Look for session?.user?.property being passed to functions
          if (currentLine.includes('session?.user?.') && (currentLine.includes('prisma.') || currentLine.includes('create(') || currentLine.includes('update('))) {
            const originalLine = currentLine
            // Replace session?.user?.property with (session?.user?.property || undefined)
            // This converts null to undefined
            currentLine = currentLine.replace(/session\?\.user\?\.(\w+)(?!\s*\|\|)/g, '(session?.user?.$1 ?? undefined)')
            if (currentLine !== originalLine) {
              nullFixLines[i] = currentLine
              fixedNullTypes = true
            }
          }
        }
        if (fixedNullTypes) {
          content = nullFixLines.join('\n')
          console.log(`[Draft ${projectId}] Fixed null type mismatches in ${file.path}`)
        }
        
        // Ensure file starts with valid syntax (not markdown code blocks)
        if (content.startsWith('```')) {
          // Extract code from markdown code block
          const codeBlockMatch = content.match(/```(?:tsx?|typescript)?\s*\n([\s\S]*?)\n```/)
          if (codeBlockMatch) {
            content = codeBlockMatch[1]
          } else {
            // Just remove the code fences
            content = content.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '')
          }
        }

        // Fix invalid CSS imports in TypeScript files (.ts files cannot import CSS)
        if (file.path.endsWith('.ts') && !file.path.endsWith('.tsx')) {
          // Remove CSS imports from .ts files (only .tsx files can import CSS)
          if (content.includes("import './globals.css'") || content.includes('import "./globals.css"') || 
              content.includes("import '../globals.css'") || content.includes('import "../globals.css"') ||
              content.includes("import '@/app/globals.css'") || content.includes('import "@/app/globals.css"')) {
            // Remove the CSS import line
            content = content.replace(/import\s+['"]\.\/.*\.css['"];?\s*\n?/g, '')
            content = content.replace(/import\s+['"]\.\.\/.*\.css['"];?\s*\n?/g, '')
            content = content.replace(/import\s+['"]@\/.*\.css['"];?\s*\n?/g, '')
            console.log(`[Draft ${projectId}] Removed invalid CSS import from ${file.path} (TypeScript files cannot import CSS)`)
          }
        }

        // Ensure globals.css import is correct (only in app/layout.tsx or root layout)
        if (content.includes('globals.css')) {
          // Only allow CSS imports in .tsx files, not .ts files
          if (file.path.endsWith('.ts') && !file.path.endsWith('.tsx')) {
            content = content.replace(/import\s+['"].*globals\.css['"];?\s*\n?/g, '')
            console.log(`[Draft ${projectId}] Removed CSS import from non-TSX file: ${file.path}`)
          } else {
            // Fix incorrect globals.css import paths
            // Common AI errors: @/styles/globals.css, ./styles/globals.css, styles/globals.css
            // Correct path: @/app/globals.css or ./globals.css (if in app directory)
            if (content.includes("@/styles/globals.css") || content.includes('@/styles/globals.css')) {
              content = content.replace(/@\/styles\/globals\.css/g, '@/app/globals.css')
              console.log(`[Draft ${projectId}] Fixed globals.css import path from @/styles to @/app in ${file.path}`)
            }
            if (content.includes("./styles/globals.css") || content.includes('./styles/globals.css')) {
              content = content.replace(/\.\/styles\/globals\.css/g, './globals.css')
              console.log(`[Draft ${projectId}] Fixed globals.css import path from ./styles to ./ in ${file.path}`)
            }
            if (content.includes("styles/globals.css") || content.includes('styles/globals.css')) {
              content = content.replace(/styles\/globals\.css/g, '@/app/globals.css')
              console.log(`[Draft ${projectId}] Fixed globals.css import path from styles/ to @/app/ in ${file.path}`)
            }
            // Ensure @/app/globals.css is used (if no globals.css import exists, add it to layout files)
            const isRootLayout =
              file.path === 'app/layout.tsx' ||
              file.path.endsWith('/app/layout.tsx') ||
              file.path.endsWith('\\app\\layout.tsx')

            if (isRootLayout) {
              const usesAppProviders = content.includes('AppProviders')

              // Ensure globals.css import exists
              if (!content.includes("import '@/app/globals.css'")) {
                if (content.startsWith('"use client"') || content.startsWith("'use client'")) {
                  content = content.replace(/^(["']use client["']\s*\n)/, `$1import '@/app/globals.css'\n`)
                } else {
                  content = `import '@/app/globals.css'\n${content}`
                }
                console.log(`[Draft ${projectId}] Ensured globals.css import in layout`)
              }

              if (usesAppProviders) {
                // AppProviders already wraps Polkadot providers; ensure layout stays a server component
                if (content.startsWith('"use client"') || content.startsWith("'use client'")) {
                  content = content.replace(/^["']use client["']\s*\n/, '')
                  console.log(`[Draft ${projectId}] Removed unnecessary "use client" from layout (AppProviders handles client context)`)
                }

                if (content.includes("import { PolkadotUIProvider")) {
                  content = content.replace(
                    /import\s*{[^}]*PolkadotUIProvider[^}]*}\s*from\s*['"]@\/providers\/PolkadotUIProvider['"];?\s*\n?/g,
                    ''
                  )
                  console.log(`[Draft ${projectId}] Removed direct PolkadotUIProvider import from layout (AppProviders in use)`)
                }

                if (content.includes('<PolkadotUIProvider')) {
                  content = content.replace(
                    /<PolkadotUIProvider>\s*([\s\S]*?)\s*<\/PolkadotUIProvider>/g,
                    '$1'
                  )
                  console.log(`[Draft ${projectId}] Unwrapped obsolete PolkadotUIProvider usage in layout`)
                }
              } else {
                // Legacy layout: ensure layout is client and wraps PolkadotUIProvider directly
                if (!content.includes('"use client"') && !content.includes("'use client'")) {
                  content = `"use client"\n${content}`
                  console.log(`[Draft ${projectId}] Added "use client" directive to layout`)
                }

                if (!content.includes('PolkadotUIProvider')) {
                  content = content.replace(
                    /^(['"]use client['"]\s*\n)/,
                    `$1import { PolkadotUIProvider } from '@/providers/PolkadotUIProvider'\n`
                  )
                  console.log(`[Draft ${projectId}] Added PolkadotUIProvider import to layout`)
                }

                if (!content.includes('<PolkadotUIProvider')) {
                  const bodyRegex = /(<body[^>]*>)([\s\S]*?)(<\/body>)/
                  if (bodyRegex.test(content)) {
                    content = content.replace(
                      bodyRegex,
                      (_match, openTag, inner, closeTag) =>
                        `${openTag}\n        <PolkadotUIProvider>\n${inner}\n        </PolkadotUIProvider>\n      ${closeTag}`
                    )
                    console.log(`[Draft ${projectId}] Wrapped layout children with PolkadotUIProvider`)
                  }
                }
              }
            }
          }
        }

        // Additional syntax validation - check for common syntax errors
        // Check for incomplete statements (missing semicolons, unclosed brackets)
        const lines = content.split('\n')
        let braceCount = 0
        let parenCount = 0
        let bracketCount = 0
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Count brackets
          braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
          parenCount += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length
          bracketCount += (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length
          
          // Check for suspicious patterns that might indicate syntax errors
          // Unclosed string literals (common AI error)
          if (line.includes('"') && (line.match(/"/g) || []).length % 2 !== 0 && !line.includes("'")) {
            console.warn(`[Draft ${projectId}] Potential unclosed string literal in ${file.path} at line ${i + 1} - auto-fixing`)
            lines[i] = `${line}"`
          }
          if (line.includes("'") && (line.match(/'/g) || []).length % 2 !== 0 && !line.includes('"')) {
            console.warn(`[Draft ${projectId}] Potential unclosed string literal in ${file.path} at line ${i + 1} - auto-fixing`)
            lines[i] = `${line}'`
          }
        }
        
        content = lines.join('\n')
        
        // Check if file ends with incomplete statement
        const lastLine = lines[lines.length - 1]?.trim() || ''
        if (lastLine && !lastLine.match(/[;{}()\[\]]$/) && !lastLine.startsWith('//') && !lastLine.startsWith('*')) {
          // File might be incomplete - this is often an AI error
          console.warn(`[Draft ${projectId}] File ${file.path} might be incomplete (doesn't end with proper statement terminator)`)
        }
        
        // Normalize malformed "use client" directives (missing quotes)
        const trimmedStart = content.trimStart()
        if (
          trimmedStart.startsWith('use client') &&
          !trimmedStart.startsWith('"use client"') &&
          !trimmedStart.startsWith("'use client'")
        ) {
          content = content.replace(
            /^\s*use client\s*;?/,
            '"use client";'
          )
          console.log(`[Draft ${projectId}] Normalized missing quotes on use client directive in ${file.path}`)
        }

        // Fix incorrect Polkadot UI imports commonly produced by AI
        // Case 1: RequireAccount mistakenly imported from RequireConnection module
        if (
          content.includes("@/components/polkadot-ui/RequireConnection") &&
          content.match(/import\s+\{\s*RequireAccount\b[^}]*\}\s+from\s+['"]@\/components\/polkadot-ui\/RequireConnection['"]/)
        ) {
          content = content.replace(
            /from\s+['"]@\/components\/polkadot-ui\/RequireConnection['"]/g,
            "from '@/components/polkadot-ui/RequireAccount'"
          )
          console.log(`[Draft ${projectId}] Fixed RequireAccount import source in ${file.path}`)
        }
        // Case 2: TxNotification incorrectly imported as default export
        if (content.match(/import\s+TxNotification\s+from\s+['"]@\/components\/polkadot-ui\/TxNotification['"]/)) {
          content = content.replace(
            /import\s+TxNotification\s+from\s+['"]@\/components\/polkadot-ui\/TxNotification['"];/g,
            "import { TxNotification } from '@/components/polkadot-ui/TxNotification';"
          )
          console.log(`[Draft ${projectId}] Fixed TxNotification default import in ${file.path}`)
        }
        // Case 3: TxNotification default import from barrel; switch to named
        if (content.match(/import\s+TxNotification\s+from\s+['"]@\/components\/polkadot-ui['"]/)) {
          content = content.replace(
            /import\s+TxNotification\s+from\s+['"]@\/components\/polkadot-ui['"];/g,
            "import { TxNotification } from '@/components/polkadot-ui';"
          )
          console.log(`[Draft ${projectId}] Fixed TxNotification default import from barrel in ${file.path}`)
        }
        // Case 4: usePolkadotUI hook doesn't exist - remove it and its usage
        if (content.includes('usePolkadotUI')) {
          // Remove the import
          content = content.replace(
            /import\s+\{[^}]*usePolkadotUI[^}]*\}\s+from\s+['"]@\/components\/polkadot-ui['"];?\s*\n?/g,
            ''
          )
          // Remove the hook usage
          content = content.replace(
            /const\s+\{[^}]*\}\s*=\s*usePolkadotUI\(\);?\s*\n?/g,
            ''
          )
          console.log(`[Draft ${projectId}] Removed non-existent usePolkadotUI hook from ${file.path}`)
        }
        // Case 5: selectedAccount used without usePolkadotUI hook
        // Fix: Add usePolkadotUI import and hook usage if selectedAccount is referenced
        // Special handling for ConnectWallet component
        if (file.path.includes('ConnectWallet') && content.includes('selectedAccount') && !content.includes('usePolkadotUI')) {
          console.log(`[Draft ${projectId}] WARNING: ConnectWallet component missing usePolkadotUI hook!`)
        }
        if (content.includes('selectedAccount') && !content.includes('usePolkadotUI')) {
          // Check if it's a client component
          if (content.includes('"use client"') || content.includes("'use client'")) {
            // Add import if not already present
            if (!content.includes("from '@/providers/PolkadotUIProvider'") && !content.includes('from "@/providers/PolkadotUIProvider"')) {
              // Find the last import statement and add after it
              const importLines = content.split('\n')
              let lastImportIndex = -1
              for (let i = 0; i < importLines.length; i++) {
                if (importLines[i].trim().startsWith('import ')) {
                  lastImportIndex = i
                }
              }
              if (lastImportIndex >= 0) {
                // Insert after last import
                importLines.splice(lastImportIndex + 1, 0, "import { usePolkadotUI } from '@/providers/PolkadotUIProvider'")
                content = importLines.join('\n')
              } else {
                // No imports found, add after "use client"
                content = content.replace(
                  /("use client"|'use client')\s*\n/,
                  "$1\nimport { usePolkadotUI } from '@/providers/PolkadotUIProvider'\n"
                )
              }
            }
            // Add hook usage at the start of component function body
            // Check if hook is already used
            if (!content.match(/const\s+\{[^}]*selectedAccount[^}]*\}\s*=\s*usePolkadotUI\(\)/)) {
              // Try to find component function/arrow function
              // Pattern 1: export function ComponentName() {
              // Pattern 2: export const ComponentName = () => {
              // Pattern 3: function ComponentName() {
              // Pattern 4: const ComponentName = () => {
              const patterns = [
                /(export\s+)?function\s+\w+\s*\([^)]*\)\s*\{/,
                /(export\s+)?const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{/,
                /(export\s+)?const\s+\w+\s*=\s*\(\)\s*=>\s*\{/,
              ]
              
              let fixed = false
              for (const pattern of patterns) {
                const match = content.match(pattern)
                if (match) {
                  const funcStart = match.index! + match[0].length
                  // Find the opening brace position
                  const openingBracePos = funcStart - 1
                  // Get the line with the opening brace to determine indentation
                  const beforeBrace = content.slice(0, openingBracePos)
                  const lastNewline = beforeBrace.lastIndexOf('\n')
                  const lineBeforeBrace = content.slice(lastNewline + 1, openingBracePos)
                  const indent = lineBeforeBrace.match(/^(\s*)/)?.[1] || ''
                  const componentIndent = indent + '  ' // Add 2 spaces for inside the function
                  
                  // Insert hook usage right after opening brace
                  content = content.slice(0, funcStart) + 
                    `\n${componentIndent}const { selectedAccount } = usePolkadotUI()` + 
                    content.slice(funcStart)
                  console.log(`[Draft ${projectId}] Fixed selectedAccount usage by adding usePolkadotUI hook in ${file.path}`)
                  fixed = true
                  break
                }
              }
              
              // If pattern matching failed, try a simpler approach: insert before first use of selectedAccount
              if (!fixed && content.includes('if (selectedAccount)')) {
                const ifMatch = content.match(/(\s*)if\s*\(\s*selectedAccount\s*\)/)
                if (ifMatch) {
                  const indent = ifMatch[1] || '  '
                  const insertPos = ifMatch.index!
                  // Insert hook before the if statement
                  content = content.slice(0, insertPos) + 
                    `${indent}const { selectedAccount } = usePolkadotUI()\n` + 
                    content.slice(insertPos)
                  console.log(`[Draft ${projectId}] Fixed selectedAccount usage by inserting hook before if statement in ${file.path}`)
                }
              }
            }
          }
        }
        // Case 4: Encourage barrel import for RequireAccount imported from specific file under polkadot-ui
        // Only when both RequireConnection and RequireAccount are imported from different specific files; normalize to barrel
        if (
          content.match(/from\s+['"]@\/components\/polkadot-ui\/Require(Account|Connection)['"]/) &&
          content.includes('{ RequireAccount') &&
          content.includes('{ RequireConnection')
        ) {
          // Collapse separate lines into a single barrel import
          // Strategy: remove specific module imports for these two and add one barrel import
          const hadRequireImports =
            content.includes("from '@/components/polkadot-ui/RequireAccount'") ||
            content.includes('from "@/components/polkadot-ui/RequireAccount"') ||
            content.includes("from '@/components/polkadot-ui/RequireConnection'") ||
            content.includes('from "@/components/polkadot-ui/RequireConnection"')
          if (hadRequireImports) {
            // Remove specific imports lines
            content = content
              .replace(/import\s+\{\s*RequireAccount\s*\}\s+from\s+['"]@\/components\/polkadot-ui\/RequireAccount['"];\s*\n?/g, '')
              .replace(/import\s+\{\s*RequireConnection\s*\}\s+from\s+['"]@\/components\/polkadot-ui\/RequireConnection['"];\s*\n?/g, '')
            // Ensure a barrel import exists or add one
            if (!content.match(/import\s+\{\s*[^}]*Require(Account|Connection)[^}]*\}\s+from\s+['"]@\/components\/polkadot-ui['"];/)) {
              // Insert after first import statement
              const firstImport = content.match(/^import\s+.*?;?\s*$/m)
              if (firstImport) {
                content = content.replace(firstImport[0], `${firstImport[0]}\nimport { RequireAccount, RequireConnection } from '@/components/polkadot-ui';`)
              } else {
                content = `import { RequireAccount, RequireConnection } from '@/components/polkadot-ui';\n` + content
              }
              console.log(`[Draft ${projectId}] Normalized RequireAccount/RequireConnection imports to barrel in ${file.path}`)
            }
          }
        }

        // Ensure client components have "use client" directive
        if (file.path.endsWith('.tsx') && (
          content.includes('useSearchParams') ||
          content.includes('useRouter') ||
          content.includes('useState') ||
          content.includes('useEffect') ||
          content.includes('onClick') ||
          content.includes('onChange') ||
          content.includes('useForm') ||
          content.includes('signIn(') ||
          content.includes('signOut(')
        )) {
          // Check if already has "use client"
          const hasUseClient = content.trim().startsWith('"use client"') || content.trim().startsWith("'use client'")
          
          if (!hasUseClient) {
            // Fix: If component is async but uses client hooks, remove async and fix await calls
            if (content.includes('export default async function') || content.includes('export async function')) {
              if (content.includes('useSearchParams') || content.includes('useRouter') || content.includes('useState')) {
                // Remove async from function declarations
                content = content.replace(/export\s+default\s+async\s+function/g, 'export default function')
                content = content.replace(/export\s+async\s+function/g, 'export function')
                
                // Fix await getCsrfToken() - it's actually synchronous in client components
                content = content.replace(/const\s+csrfToken\s*=\s*await\s+getCsrfToken\(\)/g, 'const csrfToken = null // CSRF handled by NextAuth')
                
                console.log(`[Draft ${projectId}] Removed async from function using client hooks in ${file.path}`)
              }
            }
            
            content = '"use client";\n' + content
            console.log(`[Draft ${projectId}] Added "use client" directive to ${file.path}`)
          }
        }

        if (content.includes('getStorage: () => localStorage')) {
          content = content.replace(
            /getStorage:\s*\(\)\s*=>\s*localStorage/g,
            `getStorage: () => (typeof window !== 'undefined' ? window.localStorage : {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      })`
          )
          console.log(`[Draft ${projectId}] Hardened localStorage persistence fallback in ${file.path}`)
        }
        
        // Fix any incorrect NextAuth imports in other files (not route handler)
        if (false) {
          // Fix incorrect NextAuth imports in components or other files
          if (content.includes('import { NextAuth }') || content.includes('import * as NextAuth')) {
            content = content.replace(/import\s+\{\s*NextAuth\s*\}\s+from\s+['"]next-auth['"];?/g, "import NextAuth from 'next-auth'")
            content = content.replace(/import\s+\*\s+as\s+NextAuth\s+from\s+['"]next-auth['"];?/g, "import NextAuth from 'next-auth'")
            console.log(`[Draft ${projectId}] Fixed NextAuth import in ${file.path}`)
          }
          
          // Fix getServerSession import - NextAuth v4 doesn't have getServerSession in main export
          // Should use: import { getServerSession } from 'next-auth/next'
          if (content.includes("import { getServerSession } from 'next-auth'") || content.includes('import { getServerSession } from "next-auth"')) {
            // Replace with correct import for NextAuth v4
            content = content.replace(/import\s+\{\s*getServerSession\s*\}\s+from\s+['"]next-auth['"];?/g, "import { getServerSession } from 'next-auth/next'")
            console.log(`[Draft ${projectId}] Fixed getServerSession import in ${file.path}`)
          }
          
          // Fix auth import - NextAuth v4 doesn't export 'auth' from main package
          // In NextAuth v4, use getServerSession from 'next-auth/next' instead
          if (content.includes("import { auth } from 'next-auth'") || content.includes('import { auth } from "next-auth"')) {
            // Replace with getServerSession for NextAuth v4
            content = content.replace(/import\s+\{\s*auth\s*\}\s+from\s+['"]next-auth['"];?/g, "import { getServerSession } from 'next-auth/next'")
            // Ensure authOptions is imported if not already
            if (content.includes('getServerSession') && !content.includes("authOptions")) {
              // Try to add authOptions import if missing
              if (!content.includes("from '@/lib/auth'") && !content.includes('from "@/lib/auth"')) {
                const firstImport = content.match(/^import\s+.*from\s+['"].*['"];?\s*\n/m)
                if (firstImport) {
                  content = content.replace(/^/, "import { authOptions } from '@/lib/auth'\n")
                }
              }
            }
            // Replace auth() calls with getServerSession(authOptions)
            content = content.replace(/await\s+auth\(\)/g, 'await getServerSession(authOptions)')
            content = content.replace(/\bauth\(\)/g, 'getServerSession(authOptions)')
            console.log(`[Draft ${projectId}] Fixed auth import to getServerSession in ${file.path}`)
          }
          
          // CRITICAL FIX 3: Fix ALL session.user accesses - ULTRA COMPREHENSIVE
          // This runs AFTER getServerSession fix to catch any remaining issues
          // Error: Property 'user' does not exist on type '{}' - happens when session is {} instead of Session | null
          // Also fixes useSession() client-side hook where session can be null/undefined
          if (content.includes('session') && (content.includes('session.user') || content.includes('getServerSession') || content.includes('useSession(') || content.includes('session?.user'))) {
            const originalContent = content
            const lines = content.split('\n')
            const fixedLines: string[] = []
            let modified = false
            
            for (let i = 0; i < lines.length; i++) {
              let line = lines[i]
              const originalLine = line
              
              // Check for getServerSession call on previous line
              const prevLine = i > 0 ? lines[i - 1] : ''
              const hasGetServerSession = prevLine.includes('getServerSession') || line.includes('getServerSession')
              
              // Fix: Property 'user' does not exist on type '{}'
              // This happens when session is accessed without optional chaining after getServerSession
              // Check if any line before this one has getServerSession
              let hasGetServerSessionAbove = false
              for (let j = Math.max(0, i - 5); j < i; j++) {
                if (lines[j]?.includes('getServerSession') || lines[j]?.trim().startsWith('const session')) {
                  hasGetServerSessionAbove = true
                  break
                }
              }
              
              if (hasGetServerSessionAbove || hasGetServerSession || (i > 0 && lines[i - 1]?.trim().includes('const session'))) {
                // Check if session.user is accessed without optional chaining
                if (line.includes('session.user') && !line.includes('session?.user') && !line.includes('if (session') && !line.includes('if (!session')) {
                  // Replace all session.user with session?.user?
                  line = line.replace(/session\.user\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'session?.user?.$1')
                  line = line.replace(/session\.user\?\./g, 'session?.user?.')
                  // Fix in JSX/expressions
                  line = line.replace(/\{session\.user\.([^}]+)\}/g, '{session?.user?.$1}')
                  // Fix direct property access like session.user.name
                  line = line.replace(/\bsession\.user\b/g, 'session?.user')
                  if (line !== originalLine) {
                    modified = true
                  }
                }
              }
              
              // General fix: any session.user access should use optional chaining
              // This catches useSession() cases where session might be null/undefined
              if (line.includes('session.user') && !line.includes('session?.user')) {
                // Skip if already in a guard
                const hasGuard = line.includes('if (') || line.includes('&& ') || line.includes('|| ') || 
                               line.trim().startsWith('//') || line.includes('session as ') || 
                               line.includes('(session as any)') || line.includes('as Session') ||
                               line.includes('session &&') || line.includes('session ||') ||
                               line.includes('session ?')
                
                if (!hasGuard) {
                  // Replace session.user with session?.user?
                  // Handle JSX: {session.user.name} -> {session?.user?.name}
                  line = line.replace(/\{session\.user\.([^}]+)\}/g, '{session?.user?.$1}')
                  // Handle property access: session.user.name -> session?.user?.name
                  // Also handles session.user.id (common pattern that needs type extension)
                  line = line.replace(/session\.user\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'session?.user?.$1')
                  // Handle partial: session.user?. -> session?.user?.
                  line = line.replace(/session\.user\?\./g, 'session?.user?.')
                  // Handle direct access: session.user -> session?.user
                  line = line.replace(/\bsession\.user\b(?!\?)/g, 'session?.user')
                  if (line !== originalLine) {
                    modified = true
                  }
                }
              }
              
              // Special fix for session.user.id - ensure optional chaining and type casting if needed
              // This is needed because the type definition includes id, but TypeScript needs optional chaining
              // Also handles cases where TypeScript doesn't recognize the extended type
              if (line.includes('session.user.id') && !line.includes('session?.user?.id')) {
                // Replace with optional chaining
                line = line.replace(/session\.user\.id/g, 'session?.user?.id')
                line = line.replace(/\{session\.user\.id\}/g, '{session?.user?.id}')
                // Also handle (session as any).user.id -> (session as any)?.user?.id
                line = line.replace(/\(session\s+as\s+any\)\.user\.id/g, '(session as any)?.user?.id')
                if (line !== originalLine) {
                  modified = true
                }
              }
              
              // Fix any other session.user.property accesses that might have type errors
              // Pattern: session.user.property where property might not exist in base type
              // This ensures all property accesses use optional chaining
              if (line.includes('session.user.') && !line.includes('session?.user')) {
                // Check for specific properties that might need type extension: id, address
                if (line.includes('session.user.id') || line.includes('session.user.address')) {
                  line = line.replace(/session\.user\.(id|address)/g, 'session?.user?.$1')
                  line = line.replace(/\{session\.user\.(id|address)\}/g, '{session?.user?.$1}')
                  if (line !== originalLine) {
                    modified = true
                  }
                }
              }
              
              // Special case: Fix useSession() destructuring that might lead to session.user errors
              // Pattern: const { data: session } = useSession(); ... session.user
              // When useSession() is used, session can be null, so session.user needs optional chaining
              const hasUseSession = content.includes('useSession(') || line.includes('useSession(') || 
                                   (i > 0 && lines[i - 1]?.includes('useSession('))
              
              if (hasUseSession && line.includes('session.user') && !line.includes('session?.user')) {
                // Fix session.user access in this line
                line = line.replace(/\{session\.user\.([^}]+)\}/g, '{session?.user?.$1}')
                line = line.replace(/session\.user\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'session?.user?.$1')
                line = line.replace(/session\.user\?\./g, 'session?.user?.')
                line = line.replace(/\bsession\.user\b(?!\?)/g, 'session?.user')
                if (line !== originalLine) {
                  modified = true
                }
              }
              
              // Fix session?.user. (missing ? after user)
              if (line.includes('session?.user.') && !line.includes('session?.user?.')) {
                line = line.replace(/session\?\.user\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'session?.user?.$1')
                if (line !== originalLine) {
                  modified = true
                }
              }
              
              // Ensure getServerSession has authOptions parameter (critical for correct typing)
              if (line.includes('getServerSession(') && !line.includes('authOptions')) {
                // Check if it's missing authOptions
                if (!line.includes('getServerSession(undefined, undefined, authOptions)') && 
                    !line.includes('getServerSession(req, undefined, authOptions)') &&
                    !line.includes('getServerSession(request, undefined, authOptions)')) {
                  // This will be fixed by the earlier getServerSession fix, but log it
                  console.warn(`[Draft ${projectId}] getServerSession call without authOptions detected in ${file.path} at line ${i + 1}`)
                }
              }
              
              fixedLines.push(line)
            }
            
            if (modified) {
              content = fixedLines.join('\n')
              console.log(`[Draft ${projectId}] Fixed session.user undefined checks in ${file.path}`)
            }
            
            // Additional fix: ensure getServerSession calls include authOptions
            // This is critical for proper TypeScript typing
            if (content.includes('getServerSession(') && !content.includes('getServerSession(undefined, undefined, authOptions)') && 
                !content.includes('getServerSession(req, undefined, authOptions)')) {
              // Ensure authOptions is imported
              if (!content.includes("import { authOptions }") && !content.includes("from '@/lib/auth'")) {
                const firstImport = content.match(/^import\s+.*from\s+['"].*['"];?\s*\n/m)
                if (firstImport) {
                  content = "import { authOptions } from '@/lib/auth'\n" + content
                  modified = true
                }
              }
              
              // Fix getServerSession() calls without parameters
              if (content.includes('getServerSession()')) {
                content = content.replace(/getServerSession\(\)/g, 'getServerSession(undefined, undefined, authOptions)')
                modified = true
              }
              
              // Fix incomplete getServerSession calls - more aggressive
              // Pattern 1: getServerSession() with no params
              content = content.replace(/getServerSession\(\)/g, 'getServerSession(undefined, undefined, authOptions)')
              
              // Pattern 2: getServerSession(req) or getServerSession(request)
              content = content.replace(/getServerSession\((req|request)\)/g, 'getServerSession($1, undefined, authOptions)')
              
              // Pattern 3: getServerSession(req, res) or similar but missing authOptions
              content = content.replace(
                /getServerSession\(([^,)]+),\s*([^)]+)\)/g,
                (match, param1, param2) => {
                  if (!match.includes('authOptions')) {
                    return `getServerSession(${param1}, ${param2}, authOptions)`
                  }
                  return match
                }
              )
              
              // Pattern 4: getServerSession with one or two params but missing authOptions
              content = content.replace(
                /const\s+session\s*=\s*await\s+getServerSession\(([^)]*)\)/g,
                (match, params) => {
                  const trimmed = params.trim()
                  if (!trimmed.includes('authOptions')) {
                    if (trimmed === '' || trimmed === 'undefined') {
                      return match.replace(/\(([^)]*)\)$/, '(undefined, undefined, authOptions)')
                    } else if (trimmed === 'req' || trimmed === 'request') {
                      return match.replace(/\(([^)]*)\)$/, '(req, undefined, authOptions)')
                    } else {
                      // Add authOptions as third param
                      return match.replace(/\)$/, ', authOptions)')
                    }
                  }
                  return match
                }
              )
              
              if (content !== originalContent) {
                console.log(`[Draft ${projectId}] Fixed getServerSession calls to include authOptions in ${file.path}`)
              }
            }
          }
          
          // Also fix standalone auth() calls that might not have been imported
          if (content.includes('auth()') && !content.includes("import { auth }")) {
            // Replace standalone auth() calls - they need getServerSession
            if (file.path.includes('/api/') || file.path.includes('/app/')) {
              // For server-side files, replace with getServerSession
              if (!content.includes("import { getServerSession }")) {
                // Add import if missing
                const importMatch = content.match(/^import\s+.*from\s+['"].*['"];?\s*\n/m)
                if (importMatch) {
                  content = content.replace(/^import\s+.*from\s+['"]next-auth\/next['"];?\s*\n/, '')
                  content = "import { getServerSession } from 'next-auth/next'\n" + content
                  // Also ensure authOptions is imported
                  if (!content.includes("authOptions") && !content.includes("from '@/lib/auth'")) {
                    content = "import { authOptions } from '@/lib/auth'\n" + content
                  }
                }
              }
              content = content.replace(/await\s+auth\(\)/g, 'await getServerSession(authOptions)')
              content = content.replace(/\bauth\(\)/g, 'getServerSession(authOptions)')
              console.log(`[Draft ${projectId}] Fixed standalone auth() calls to getServerSession in ${file.path}`)
            }
          }
          
          // Fix getSession on server side - should use getServerSession instead
          if (content.includes("import { getSession } from 'next-auth'") && (file.path.includes('/api/') || file.path.includes('/app/'))) {
            // For API routes and App Router, use getServerSession instead
            content = content.replace(/import\s+\{\s*getSession\s*\}\s+from\s+['"]next-auth['"];?/g, "import { getServerSession } from 'next-auth/next'")
            // Ensure authOptions is imported
            if (!content.includes("authOptions") && !content.includes("from '@/lib/auth'")) {
              const firstImport = content.match(/^import\s+.*from\s+['"].*['"];?\s*\n/m)
              if (firstImport) {
                content = content.replace(/^/, "import { authOptions } from '@/lib/auth'\n")
              }
            }
            // Replace getSession() calls - they need authOptions passed
            content = content.replace(/await\s+getSession\(req\)/g, 'await getServerSession(req, undefined, authOptions)')
            content = content.replace(/getSession\(req\)/g, 'getServerSession(req, undefined, authOptions)')
            content = content.replace(/await\s+getSession\(\)/g, 'await getServerSession(undefined, undefined, authOptions)')
            content = content.replace(/getSession\(\)/g, 'getServerSession(undefined, undefined, authOptions)')
            console.log(`[Draft ${projectId}] Fixed getSession to getServerSession in ${file.path}`)
          }
          
          // Fix getServerSession calls that don't have authOptions passed
          if (content.includes('getServerSession(') && file.path.includes('/api/') && !content.includes('getServerSession(req') && !content.includes('getServerSession(undefined')) {
            // Check if authOptions is imported
            if (!content.includes("authOptions") && !content.includes("from '@/lib/auth'")) {
              // Add authOptions import
              const firstImport = content.match(/^import\s+.*from\s+['"].*['"];?\s*\n/m)
              if (firstImport) {
                content = content.replace(/^/, "import { authOptions } from '@/lib/auth'\n")
              }
            }
            // Fix getServerSession calls that don't pass authOptions
            content = content.replace(/getServerSession\(\)/g, 'getServerSession(undefined, undefined, authOptions)')
            console.log(`[Draft ${projectId}] Added authOptions to getServerSession calls in ${file.path}`)
          }
        }
        
        // ========================================
        // COMPREHENSIVE AUTO-FIX SYSTEM
        // Ensures ANY app type builds without errors
        // ========================================
        
        if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) {
          let autoFixLog: string[] = []
          
          // FIX 1: Prisma model name casing (NFT, DAO, DeFi, etc.)
          if (content.includes('prisma.')) {
            const schemaFile = finalFiles.find(f => f.path === 'prisma/schema.prisma')
            if (schemaFile) {
              const modelMatches = schemaFile.content.matchAll(/model\s+(\w+)\s*\{/g)
              const modelNames: string[] = []
              for (const match of modelMatches) {
                const modelName = match[1]
                if (!['User', 'Account', 'Session', 'Credential', 'Wallet', 'Nonce', 'VerificationToken'].includes(modelName)) {
                  modelNames.push(modelName)
                }
              }
              
              if (modelNames.length > 0) {
                for (const modelName of modelNames) {
                  const prismaPropertyName = modelName.charAt(0).toLowerCase() + modelName.slice(1)
                  const lowercaseName = modelName.toLowerCase()
                  const wrongPatterns = [
                    new RegExp(`prisma\\.${lowercaseName}(?!\\w)`, 'g'),
                    new RegExp(`prisma\\.${modelName}(?!\\w)`, 'g')
                  ]
                  
                  for (const pattern of wrongPatterns) {
                    if (content.match(pattern)) {
                      content = content.replace(pattern, `prisma.${prismaPropertyName}`)
                      autoFixLog.push('Prisma model casing')
                    }
                  }
                }
              }
            }
          }
          
          // FIX 2: Missing NextAuth imports in API routes
          if (file.path.includes('/api/') && (content.includes('getServerSession') || content.includes('session'))) {
            if (!content.includes("import { authOptions }") && !content.includes("from '@/lib/auth'")) {
              // Add authOptions import at the top
              const firstImportMatch = content.match(/^(import\s+.*\n)/m)
              if (firstImportMatch) {
                content = content.replace(/^/, "import { authOptions } from '@/lib/auth'\n")
                autoFixLog.push('Added authOptions import')
              }
            }
          }
          
          // FIX 3: Missing Prisma import
          if (content.includes('prisma.') && !content.includes("import { prisma }")) {
            const firstImportMatch = content.match(/^(import\s+.*\n)/m)
            if (firstImportMatch) {
              content = content.replace(/^/, "import { prisma } from '@/lib/prisma'\n")
              autoFixLog.push('Added prisma import')
            }
          }
          
          // FIX 4: Wrong NextAuth session access (session.user.id without cast)
          if (content.includes('session.user.id') || content.includes('session?.user.id')) {
            content = content.replace(/session\.user\.id/g, '(session?.user as any)?.id')
            content = content.replace(/session\?\.user\.id/g, '(session?.user as any)?.id')
            if (content.match(/\(session\?\.user as any\)\?\.id/)) {
              autoFixLog.push('Fixed session.user.id type access')
            }
          }
          
          // FIX 5: Missing 'use client' directive for client-side hooks
          if (!file.path.includes('/api/') && 
              (content.includes('useState') || content.includes('useEffect') || 
               content.includes('useRouter') || content.includes('onClick') ||
               content.includes('onChange') || content.includes('onSubmit'))) {
            if (!content.startsWith('"use client"') && !content.startsWith("'use client'")) {
              content = '"use client"\n' + content
              autoFixLog.push('Added "use client" directive')
            }
          }
          
          // FIX 6: Missing React imports for client components
          if ((content.includes('useState') || content.includes('useEffect')) &&
              !content.includes("import React")) {
            const firstImportMatch = content.match(/^(["']use client["']\n)?/m)
            if (firstImportMatch) {
              const imports = []
              const hasUseStateImport = /import\s+\{\s*[^}]*\buseState\b[^}]*\}/.test(content)
              const hasUseEffectImport = /import\s+\{\s*[^}]*\buseEffect\b[^}]*\}/.test(content)
              if (content.includes('useState') && !hasUseStateImport) imports.push('useState')
              if (content.includes('useEffect') && !hasUseEffectImport) imports.push('useEffect')
              if (imports.length > 0) {
                content = content.replace(/^(["']use client["']\n)?/, `$1import { ${imports.join(', ')} } from 'react'\n`)
                autoFixLog.push('Added React hook imports')
              }
            }
          }
          
          // FIX 7: Missing NextResponse import in API routes
          if (file.path.includes('/api/') && file.path.includes('route.ts')) {
            if ((content.includes('NextResponse.json') || content.includes('return new Response')) && 
                !content.includes("import { NextResponse }") && !content.includes("import { NextRequest, NextResponse }")) {
              const firstImportMatch = content.match(/^(import\s+.*\n)/m)
              if (firstImportMatch) {
                content = content.replace(/^/, "import { NextRequest, NextResponse } from 'next/server'\n")
                autoFixLog.push('Added NextResponse import')
              }
            }
          }
          
          // FIX 8: Wrong async component syntax (missing async in Server Components)
          if (file.path.includes('/app/') && !file.path.includes('/api/') && 
              content.includes('getServerSession') && !content.includes('async function')) {
            // Check if default export function is not async
            const exportMatch = content.match(/export default function\s+\w+\s*\(/)
            if (exportMatch && !content.includes('export default async function')) {
              content = content.replace(/export default function/, 'export default async function')
              autoFixLog.push('Made Server Component async')
            }
          }
          
          // FIX 9: Optional chaining for all session accesses
          if (content.includes('session.user')) {
            content = content.replace(/\bsession\.user\./g, 'session?.user?.')
            if (content.match(/session\?\.user\?\./)) {
              autoFixLog.push('Added optional chaining to session')
            }
          }
          
          // FIX 10: Fix common type errors with any type
          if (content.includes('Type error') || content.includes('Property') && content.includes('does not exist')) {
            // This is a comment/error message, skip
          }
          
          // Log all auto-fixes
          if (autoFixLog.length > 0) {
            console.log(`[Draft ${projectId}] ✅ Auto-fixed ${file.path}: ${autoFixLog.join(', ')}`)
          }
        }
        
        // Basic syntax validation - check for balanced braces
        const openBraces = (content.match(/\{/g) || []).length
        const closeBraces = (content.match(/\}/g) || []).length
        const openParens = (content.match(/\(/g) || []).length
        const closeParens = (content.match(/\)/g) || []).length
        
        if (openBraces !== closeBraces) {
          console.warn(`[Draft ${projectId}] Unbalanced braces in ${file.path}: ${openBraces} open, ${closeBraces} close`)
          // Try to fix by adding missing closing braces
          if (openBraces > closeBraces) {
            content += '\n' + '}'.repeat(openBraces - closeBraces)
          }
        }
        
        if (openParens !== closeParens) {
          console.warn(`[Draft ${projectId}] Unbalanced parentheses in ${file.path}: ${openParens} open, ${closeParens} close`)
        }
        
        // Ensure it ends with newline
        if (!content.endsWith('\n')) {
          content += '\n'
        }
      }
      
      await writeFile(filePath, content, 'utf-8')
      console.log(`[Draft ${projectId}] Wrote ${file.path}`)
    } catch (writeErr: any) {
      console.error(`[Draft ${projectId}] Failed to write ${file.path}:`, writeErr.message)
      throw new Error(`Failed to write file ${file.path}: ${writeErr.message}`)
    }
  }
  
  console.log(`[Draft ${projectId}] All files written successfully`)
  
  // Create .env.local for static export (minimal config)
  const envPath = join(baseDir, '.env.local')
  if (!existsSync(envPath)) {
    await writeFile(envPath, `# Static Export Configuration
NEXT_PUBLIC_APP_NAME=${projectId}
NODE_ENV=production
PORT=${port}
`, 'utf-8')
  }
  
  // STATIC EXPORT: Skip NextAuth type declarations (no NextAuth!)
  console.log(`[Draft ${projectId}] Skipping NextAuth types (static export - no NextAuth)`)
  
  // Build the app (run asynchronously but track status)
  // Don't await - let it run in background, but we'll return immediately
  const buildPromise = (async () => {
    try {
      console.log(`[Draft ${projectId}] Starting build on port ${port}...`)
      
      // Install deps using cache system for dramatic speed improvement
      console.log(`[Draft ${projectId}] Installing dependencies (using cache system)...`)
      const depsStartedAt = Date.now()
      
      try {
        // Read package.json from the draft directory
        const packageJsonPath = join(baseDir, 'package.json')
        const packageJsonContent = await readFile(packageJsonPath, 'utf-8')
        
        // Ensure cache is up-to-date (only slow on first build or when package.json changes)
        const cacheWasRebuilt = await ensureNodeModulesCache(packageJsonContent, projectId)
        
        // Copy node_modules from cache to draft (very fast - typically under 30s)
        await copyNodeModulesFromCache(baseDir, projectId)
        
        const depsDuration = Math.round((Date.now() - depsStartedAt) / 1000)
        console.log(
          `[Draft ${projectId}] ✅ Dependencies ready in ${depsDuration}s (cache ${cacheWasRebuilt ? 'rebuilt' : 'reused'})`
        )
        
      } catch (installErr: any) {
        const errorMessage = installErr.message || 'Unknown error'
        console.error(`[Draft ${projectId}] Failed to install dependencies from cache:`, errorMessage)
        console.error(`[Draft ${projectId}] Full error:`, installErr)
        throw new Error(
          `Failed to install dependencies: ${errorMessage}\n\nThis may be due to cache corruption. Try deleting .drafts/.template-cache and rebuilding.`
        )
      }
      
      // STATIC EXPORT: Skip Prisma generation (no database!)
      console.log(`[Draft ${projectId}] Skipping Prisma generation (static export mode - no database)`)
      
      // Generate Prisma client if schema exists (OLD CODE - commented out for static export)
      const schemaPath = join(baseDir, 'prisma/schema.prisma')
      if (false && existsSync(schemaPath)) {
        try {
          console.log(`[Draft ${projectId}] Generating Prisma client (ARM64 openssl-3.0.x)...`)
          await execAsync('npx prisma generate', { 
            cwd: baseDir, 
            timeout: 60000,
            maxBuffer: 5 * 1024 * 1024,
            env: {
              ...process.env,
              PRISMA_CLI_BINARY_TARGETS: 'linux-musl-arm64-openssl-3.0.x',
              PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1'
            }
          })
          
          // CRITICAL: Verify correct binary exists (ARM64 OpenSSL 3.0.x)
          const correctBinary = join(baseDir, 'node_modules/.prisma/client/libquery_engine-linux-musl-arm64-openssl-3.0.x.so.node')
          const wrongBinary1 = join(baseDir, 'node_modules/.prisma/client/libquery_engine-linux-musl-openssl-1.1.x.so.node')
          const wrongBinary2 = join(baseDir, 'node_modules/.prisma/client/libquery_engine-linux-musl-arm64-openssl-1.1.x.so.node')
          const wrongBinary3 = join(baseDir, 'node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node')
          
          // Delete any wrong binaries (1.1.x or non-ARM64 3.0.x)
          if (existsSync(wrongBinary1)) {
            console.log(`[Draft ${projectId}] ⚠️ Wrong binary (openssl-1.1.x x86) found, deleting...`)
            await rm(wrongBinary1, { force: true })
          }
          if (existsSync(wrongBinary2)) {
            console.log(`[Draft ${projectId}] ⚠️ Wrong binary (openssl-1.1.x arm64) found, deleting...`)
            await rm(wrongBinary2, { force: true })
          }
          if (existsSync(wrongBinary3)) {
            console.log(`[Draft ${projectId}] ⚠️ Wrong binary (openssl-3.0.x x86) found, deleting...`)
            await rm(wrongBinary3, { force: true })
          }
          
          // Verify correct binary exists
          if (existsSync(correctBinary)) {
            console.log(`[Draft ${projectId}] ✅ Prisma client ready with ARM64 openssl-3.0.x binary`)
          } else {
            console.error(`[Draft ${projectId}] ❌ CRITICAL: ARM64 openssl-3.0.x binary not found!`)
            console.error(`[Draft ${projectId}] Checked path: ${correctBinary}`)
          }
          
          // CRITICAL: Push database schema to create tables
          // This MUST happen after prisma generate and BEFORE starting the server
          try {
            console.log(`[Draft ${projectId}] Pushing database schema to create tables...`)
            
            // Force Prisma CLI to use the correct OpenSSL 3.0.x binary
            const prismaEngineLibrary = join(baseDir, 'node_modules/.prisma/client/libquery_engine-linux-musl-arm64-openssl-3.0.x.so.node')
            
            const pushResult = await execAsync('npx prisma db push --skip-generate --accept-data-loss', { 
              cwd: baseDir, 
              timeout: 60000,
              maxBuffer: 5 * 1024 * 1024,
              env: {
                ...process.env,
                PRISMA_CLI_BINARY_TARGETS: 'linux-musl-arm64-openssl-3.0.x',
                PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1',
                DATABASE_URL: process.env.DATABASE_URL,
                // Force Prisma to use the correct query engine binary
                PRISMA_QUERY_ENGINE_LIBRARY: prismaEngineLibrary,
                PRISMA_QUERY_ENGINE_BINARY: prismaEngineLibrary,
                // Disable auto-detection that defaults to wrong version
                PRISMA_SKIP_POSTINSTALL_GENERATE: '1'
              }
            })
            console.log(`[Draft ${projectId}] ✅ Database schema pushed successfully`)
            if (pushResult.stdout) {
              console.log(`[Draft ${projectId}] Prisma push output: ${pushResult.stdout.substring(0, 500)}`)
            }
          } catch (pushErr: any) {
            console.error(`[Draft ${projectId}] ⚠️ Database push failed:`, pushErr.message)
            console.error(`[Draft ${projectId}] Prisma push stderr:`, pushErr.stderr?.substring(0, 1000))
            console.error(`[Draft ${projectId}] Prisma push stdout:`, pushErr.stdout?.substring(0, 1000))
            // This is critical - if DB push fails, app won't work
            // But don't throw - let the server start so user can see the error
          }
        } catch (prismaErr: any) {
          console.warn(`[Draft ${projectId}] Prisma generate warning:`, prismaErr.message)
          // Continue even if Prisma fails
        }
      }
      
      // STATIC EXPORT: Skip global type definitions (no NextAuth!)
      console.log(`[Draft ${projectId}] Skipping global.d.ts (static export - no type declarations needed)`)
      
      // PRODUCTION BUILD SKIPPED - Using dev mode for speed and reliability
      console.log(`[Draft ${projectId}] Skipping production build (using dev mode for faster startup)...`)
      
      // CRITICAL: Kill existing server on this port
      try {
        console.log(`[Draft ${projectId}] Checking for existing server on port ${port}...`)
        await execAsync(`pkill -f "next dev.*${port}" || pkill -f "next start.*${port}" || true`, { timeout: 5000 })
        console.log(`[Draft ${projectId}] Killed any existing server on port ${port}`)
      } catch (killErr) {
        console.warn(`[Draft ${projectId}] Failed to kill existing server (may not exist):`, killErr)
      }
      
      // Start server (non-blocking) - use dev mode for faster startup
      // Next.js dev server needs time to compile, so we start it in background
      const serverProcess = exec(`npm run dev`, { 
        cwd: baseDir, 
        env: { 
          ...process.env, 
          PORT: String(port), 
          NODE_ENV: 'development'
        },
        maxBuffer: 10 * 1024 * 1024  // 10MB buffer for server output
      })
      
      // Log server output in real-time
      let serverOutput = ''
      let serverError = ''
      
      serverProcess.stdout?.on('data', (data: Buffer) => {
        const text = data.toString()
        serverOutput += text
        // Log important messages
        if (text.includes('Ready') || text.includes('started') || text.includes('compiled') || text.includes('error')) {
          console.log(`[Draft ${projectId}] Server: ${text.substring(0, 200).trim()}`)
        }
      })
      
      serverProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString()
        serverError += text
        // Log errors immediately
        if (text.includes('error') || text.includes('Error') || text.includes('failed') || text.includes('Failed')) {
          console.error(`[Draft ${projectId}] Server error: ${text.substring(0, 500).trim()}`)
        }
      })
      
      serverProcess.on('error', (err) => {
        console.error(`[Draft ${projectId}] Server process error:`, err)
      })
      
      serverProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.error(`[Draft ${projectId}] Server exited with code ${code}`)
          console.error(`[Draft ${projectId}] Server output: ${serverOutput.substring(0, 2000)}`)
          console.error(`[Draft ${projectId}] Server errors: ${serverError.substring(0, 2000)}`)
        } else {
          console.log(`[Draft ${projectId}] Server process exited normally`)
        }
      })
      
      console.log(`[Draft ${projectId}] ✅ Server process started on port ${port} (PID: ${serverProcess.pid})`)
      
      return { success: true }
    } catch (err: any) {
      console.error(`[Draft ${projectId}] Build error:`, err.message || err)
      console.error(`[Draft ${projectId}] Build error stack:`, err.stack?.substring(0, 1000))
      throw err
    }
  })()
  
  // Store build promise for error tracking
  // Return immediately - build happens in background
  return { previewUrl: `/api/draft/${projectId}`, port, buildPromise }
}



