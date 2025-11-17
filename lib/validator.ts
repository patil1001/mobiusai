/**
 * Pre-build and Post-generation Validation Pipeline
 * 
 * Validates AI-generated code before and after processing to catch errors early
 */

interface ValidationError {
  file: string
  line?: number
  column?: number
  message: string
  severity: 'error' | 'warning'
  fix?: string
  category: string
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  fixable: ValidationError[]
}

/**
 * Error categories for automatic classification and fixing
 */
export const ERROR_CATEGORIES = {
  PACKAGE_NAME: 'package_name_typo',
  PACKAGE_VERSION: 'package_version',
  TYPESCRIPT_NULL_SAFETY: 'typescript_null_safety',
  NEXTAUTH_IMPORT: 'nextauth_import',
  CLIENT_DIRECTIVE: 'client_directive',
  SYNTAX: 'syntax_error',
  MISSING_IMPORT: 'missing_import',
  CONFIG_FORMAT: 'config_format'
} as const

/**
 * Comprehensive validation pipeline
 */
export class CodeValidator {
  
  /**
   * Validate a single file
   */
  static validateFile(filePath: string, content: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    const fixable: ValidationError[] = []

    // Package.json validation
    if (filePath === 'package.json') {
      this.validatePackageJson(content, errors, warnings, fixable)
    }

    // TypeScript/TSX validation
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      this.validateTypeScript(filePath, content, errors, warnings, fixable)
    }

    // Config file validation
    if (filePath.includes('next.config') || filePath.includes('tsconfig')) {
      this.validateConfig(filePath, content, errors, warnings, fixable)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      fixable
    }
  }

  /**
   * Validate package.json
   */
  private static validatePackageJson(
    content: string,
    errors: ValidationError[],
    warnings: ValidationError[],
    fixable: ValidationError[]
  ) {
    try {
      const pkg = JSON.parse(content)
      const deps = pkg.dependencies || {}

      // Check for package name typos
      if (deps['@polkadot/extensions-dapp']) {
        errors.push({
          file: 'package.json',
          message: 'Package name typo: @polkadot/extensions-dapp should be @polkadot/extension-dapp',
          severity: 'error',
          category: ERROR_CATEGORIES.PACKAGE_NAME,
          fix: 'Replace @polkadot/extensions-dapp with @polkadot/extension-dapp'
        })
        fixable.push(errors[errors.length - 1])
      }

      // Check for invalid @types/next-auth
      if (pkg.devDependencies?.['@types/next-auth']) {
        errors.push({
          file: 'package.json',
          message: '@types/next-auth does not exist - NextAuth v4 has built-in types',
          severity: 'error',
          category: ERROR_CATEGORIES.PACKAGE_VERSION,
          fix: 'Remove @types/next-auth from devDependencies'
        })
        fixable.push(errors[errors.length - 1])
      }

      // Check Polkadot package versions
      const polkadotPackages = Object.keys(deps).filter(d => d.startsWith('@polkadot/'))
      for (const pkgName of polkadotPackages) {
        const version = deps[pkgName]
        
        // Check for invalid version patterns
        if (pkgName === '@polkadot/api' && (version.includes('13.') || version.includes('16.'))) {
          errors.push({
            file: 'package.json',
            message: `Invalid version for ${pkgName}: ${version} should be ^10.13.1`,
            severity: 'error',
            category: ERROR_CATEGORIES.PACKAGE_VERSION,
            fix: `Change ${pkgName} version to ^10.13.1`
          })
          fixable.push(errors[errors.length - 1])
        }
      }

    } catch (e) {
      errors.push({
        file: 'package.json',
        message: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
        severity: 'error',
        category: ERROR_CATEGORIES.SYNTAX
      })
    }
  }

  /**
   * Validate TypeScript/TSX files
   */
  private static validateTypeScript(
    filePath: string,
    content: string,
    errors: ValidationError[],
    warnings: ValidationError[],
    fixable: ValidationError[]
  ) {
    const lines = content.split('\n')

    // Check for markdown code fences
    if (content.includes('```')) {
      errors.push({
        file: filePath,
        message: 'Contains markdown code fences - should be raw code only',
        severity: 'error',
        category: ERROR_CATEGORIES.SYNTAX,
        fix: 'Remove markdown code fences'
      })
      fixable.push(errors[errors.length - 1])
    }

    // Check for session.user without optional chaining
    lines.forEach((line, index) => {
      if (line.includes('session.user') && !line.includes('session?.user')) {
        errors.push({
          file: filePath,
          line: index + 1,
          message: 'session.user should use optional chaining: session?.user?.property',
          severity: 'error',
          category: ERROR_CATEGORIES.TYPESCRIPT_NULL_SAFETY,
          fix: 'Replace session.user with session?.user?.'
        })
        fixable.push(errors[errors.length - 1])
      }
    })

    // Check for missing "use client" directive
    if (filePath.endsWith('.tsx')) {
      const usesClientHooks = 
        content.includes('useState') ||
        content.includes('useEffect') ||
        content.includes('useRouter') ||
        content.includes('useSearchParams') ||
        content.includes('onClick') ||
        content.includes('onChange')
      
      if (usesClientHooks && !content.trim().startsWith('"use client"') && !content.trim().startsWith("'use client'")) {
        warnings.push({
          file: filePath,
          message: 'Missing "use client" directive - directive will be auto-added during processing',
          severity: 'warning',
          category: ERROR_CATEGORIES.CLIENT_DIRECTIVE,
          fix: 'Add "use client" at the top of the file'
        })
        fixable.push(warnings[warnings.length - 1])
      }
    }

    // Check for incorrect NextAuth imports
    if (content.includes("import { auth } from 'next-auth'")) {
      errors.push({
        file: filePath,
        message: "Incorrect import: 'auth' doesn't exist in NextAuth v4",
        severity: 'error',
        category: ERROR_CATEGORIES.NEXTAUTH_IMPORT,
        fix: "Replace with: import { getServerSession } from 'next-auth/next'"
      })
      fixable.push(errors[errors.length - 1])
    }

    // Check for balanced braces
    const openBraces = (content.match(/\{/g) || []).length
    const closeBraces = (content.match(/\}/g) || []).length
    if (openBraces !== closeBraces) {
      warnings.push({
        file: filePath,
        message: `Unbalanced braces: ${openBraces} open, ${closeBraces} close`,
        severity: 'warning',
        category: ERROR_CATEGORIES.SYNTAX
      })
    }

    // Check for balanced parentheses
    const openParens = (content.match(/\(/g) || []).length
    const closeParens = (content.match(/\)/g) || []).length
    if (openParens !== closeParens) {
      warnings.push({
        file: filePath,
        message: `Unbalanced parentheses: ${openParens} open, ${closeParens} close`,
        severity: 'warning',
        category: ERROR_CATEGORIES.SYNTAX
      })
    }
  }

  /**
   * Validate config files
   */
  private static validateConfig(
    filePath: string,
    content: string,
    errors: ValidationError[],
    warnings: ValidationError[],
    fixable: ValidationError[]
  ) {
    if (filePath.includes('next.config')) {
      // Check for deprecated experimental options
      if (content.includes('experimental.appDir') || content.includes('experimental.serverActions')) {
        errors.push({
          file: filePath,
          message: 'Deprecated experimental options detected',
          severity: 'error',
          category: ERROR_CATEGORIES.CONFIG_FORMAT,
          fix: 'Remove experimental.appDir and experimental.serverActions'
        })
        fixable.push(errors[errors.length - 1])
      }

      // Check for output: standalone
      if (!content.includes("output: 'standalone'") && !content.includes('output: "standalone"')) {
        warnings.push({
          file: filePath,
          message: 'Missing output: standalone for Docker deployment',
          severity: 'warning',
          category: ERROR_CATEGORIES.CONFIG_FORMAT,
          fix: "Add output: 'standalone' to config"
        })
        fixable.push(warnings[warnings.length - 1])
      }
    }

    if (filePath.includes('tsconfig')) {
      // Check for path aliases
      if (!content.includes('"paths"') || !content.includes('"@/*"')) {
        errors.push({
          file: filePath,
          message: 'Missing path aliases (@/*) in tsconfig.json',
          severity: 'error',
          category: ERROR_CATEGORIES.CONFIG_FORMAT,
          fix: 'Add paths: { "@/*": ["./*"] } to compilerOptions'
        })
        fixable.push(errors[errors.length - 1])
      }

      // Check for skipLibCheck
      if (!content.includes('skipLibCheck') || content.includes('"skipLibCheck": false')) {
        warnings.push({
          file: filePath,
          message: 'Missing or disabled skipLibCheck - recommended for type errors',
          severity: 'warning',
          category: ERROR_CATEGORIES.CONFIG_FORMAT,
          fix: 'Set skipLibCheck: true in compilerOptions'
        })
        fixable.push(warnings[warnings.length - 1])
      }
    }
  }

  /**
   * Validate all files in a project
   */
  static validateProject(files: Array<{ path: string; content: string }>): ValidationResult {
    const allErrors: ValidationError[] = []
    const allWarnings: ValidationError[] = []
    const allFixable: ValidationError[] = []

    for (const file of files) {
      const result = this.validateFile(file.path, file.content)
      allErrors.push(...result.errors)
      allWarnings.push(...result.warnings)
      allFixable.push(...result.fixable)
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      fixable: allFixable
    }
  }

  /**
   * Get fix suggestions for errors
   */
  static getFixSuggestions(errors: ValidationError[]): Map<string, string> {
    const fixes = new Map<string, string>()
    
    for (const error of errors) {
      if (error.fix) {
        fixes.set(error.message, error.fix)
      }
    }
    
    return fixes
  }
}

