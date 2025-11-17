import { prisma } from './prisma'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function buildDraft(projectId: string): Promise<string> {
  // Get all code files
  const artifacts = await prisma.artifact.findMany({
    where: { projectId, kind: 'code' },
    orderBy: { createdAt: 'asc' }
  })

  if (artifacts.length === 0) {
    throw new Error('No code files found')
  }

  // Parse files from artifacts
  const files: Array<{ path: string; content: string }> = []
  for (const artifact of artifacts) {
    try {
      const fileData = JSON.parse(artifact.content)
      if (fileData.path && fileData.content) {
        files.push({ path: fileData.path, content: fileData.content })
      }
    } catch {
      // Skip invalid JSON
    }
  }

  if (files.length === 0) {
    throw new Error('No valid code files found')
  }

  // Create temp directory for this project
  const baseDir = join(process.cwd(), '.drafts', projectId)
  if (!existsSync(baseDir)) {
    await mkdir(baseDir, { recursive: true })
  }

  // Write all files
  for (const file of files) {
    const filePath = join(baseDir, file.path)
    const dirPath = filePath.split('/').slice(0, -1).join('/')
    
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true })
    }
    
    await writeFile(filePath, file.content, 'utf-8')
  }

  // Check if package.json exists
  const packageJsonPath = join(baseDir, 'package.json')
  if (!existsSync(packageJsonPath)) {
    // Create minimal package.json if missing
    const defaultPackageJson = {
      name: `draft-${projectId}`,
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev -p 3001',
        build: 'next build',
        start: 'next start -p 3001'
      },
      dependencies: {
        'next': '^14.2.3',
        'react': '^18.3.1',
        'react-dom': '^18.3.1'
      },
      devDependencies: {
        'typescript': '^5.6.3',
        '@types/react': '^18.2.57',
        '@types/node': '^20.12.7'
      }
    }
    await writeFile(packageJsonPath, JSON.stringify(defaultPackageJson, null, 2))
  }

  // For now, skip actual build (too complex in container) - just write files
  // In production, this would trigger a separate build service
  // Return preview URL - draft route will serve a preview page
  return `/api/draft/${projectId}`
  
  /* Future: Full build (commented out for now)
  try {
    await execAsync('npm install', { cwd: baseDir, timeout: 60000 })
    await execAsync('npm run build', { cwd: baseDir, timeout: 120000 })
    
    // Start the server (non-blocking)
    exec('npm start', { cwd: baseDir }, (err) => {
      if (err) console.error('Draft server error:', err)
    })
    
    return `/api/draft/${projectId}`
  } catch (err: any) {
    console.error('Build error:', err)
    throw err
  }
  */
}

