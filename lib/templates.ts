/**
 * Template System for Immutable Infrastructure Files
 * 
 * These templates ensure critical infrastructure files are always correct,
 * while AI only generates business logic (pages, components, app-specific code).
 */

export const TEMPLATES = {
  // Package.json template - AI should NOT generate this, we inject it
  packageJson: {
    name: "{{PROJECT_NAME}}",
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start -p $PORT",
      lint: "next lint"
    },
    dependencies: {
      "next": "^14.2.6",
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "@polkadot/api": "^10.13.1",
      "@polkadot/types": "^10.13.1",
      "@polkadot/extension-dapp": "^0.47.2",
      "@polkadot/util": "^12.6.2",
      "@polkadot/util-crypto": "^12.6.2",
      "@polkadot/keyring": "^13.5.7",
      "@tanstack/react-query": "^5.59.1",
      "class-variance-authority": "^0.7.0",
      "framer-motion": "^11.5.5",
      "lucide-react": "^0.453.0",
      "sonner": "^1.5.0",
      "zustand": "^4.5.4",
      "date-fns": "^2.30.0",
      "assert": "^2.0.0",
      "buffer": "^6.0.3",
      "crypto-browserify": "^3.12.0",
      "stream-browserify": "^3.0.0",
      "util": "^0.12.5",
      "process": "^0.11.10"
    },
    devDependencies: {
      "@types/node": "^20.12.12",
      "@types/react": "^18.3.3",
      "@types/react-dom": "^18.3.0",
      "autoprefixer": "^10.4.20",
      "eslint": "^8.57.0",
      "eslint-config-next": "^14.2.6",
      "postcss": "^8.4.49",
      "tailwindcss": "^3.4.13",
      "typescript": "^5.6.3"
    }
  },

  // tsconfig.json template - always correct
  tsconfigJson: {
    compilerOptions: {
      target: "ES2020",
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      jsx: "preserve",
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      allowJs: true,
      checkJs: false,
      noEmit: true,
      esModuleInterop: true,
      moduleDetection: "force",
      allowSyntheticDefaultImports: true,
      forceConsistentCasingInFileNames: true,
      strict: true,
      skipLibCheck: true,
      paths: {
        "@/*": ["./*"]
      },
      baseUrl: ".",
      plugins: [
        {
          name: "next"
        }
      ],
      incremental: true
    },
    include: [
      "next-env.d.ts",
      "**/*.ts",
      "**/*.tsx",
      ".next/types/**/*.ts"
    ],
    exclude: ["node_modules"]
  },

  // next.config.mjs template - always correct
  nextConfigMjs: `import webpack from 'webpack'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // CRITICAL: Enable static export for IPFS deployment
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true, // Better compatibility with IPFS
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Speed up builds
  },
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      path: false,
      os: false,
      zlib: false,
      http: false,
      https: false,
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      assert: require.resolve('assert'),
      util: require.resolve('util/'),
      process: require.resolve('process/browser'),
    }

    config.plugins = config.plugins || []
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: ['process/browser'],
      })
    )

    return config
  },
}

export default nextConfig
`,

  // tailwind.config.ts template
  tailwindConfig: `import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
`,

  // postcss.config.js template
  postcssConfig: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`,

  // types/next-auth.d.ts template - always correct
  nextAuthTypes: `declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      address?: string | null
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    address?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string
    address?: string
  }
}
`,

  // app/globals.css template
  globalsCss: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
`,

  appRootLayout: `import '@/app/globals.css'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AppProviders } from '@/providers/AppProviders'
import { projectConfig } from '@/lib/projectConfig'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: projectConfig.name,
  description: projectConfig.summary,
  keywords: projectConfig.keywords,
  themeColor: projectConfig.themeColor,
  openGraph: {
    title: projectConfig.name,
    description: projectConfig.summary,
    images: projectConfig.openGraphImage ? [projectConfig.openGraphImage] : undefined,
  },
  twitter: {
    card: 'summary_large_image',
    title: projectConfig.name,
    description: projectConfig.summary,
    images: projectConfig.openGraphImage ? [projectConfig.openGraphImage] : undefined,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <body className={\`\${inter.className} min-h-full bg-slate-950 text-slate-100\`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
`,

  projectConfig: `export type ProjectIcon = 'overview' | 'activity' | 'marketplace' | 'settings' | 'custom'

export interface ProjectFeature {
  title: string
  description: string
  icon?: ProjectIcon
  href?: string
}

export interface ProjectNavSection {
  href: string
  label: string
  description: string
  icon?: ProjectIcon
}

export interface ProjectConfig {
  name: string
  shortName?: string
  summary: string
  hero: {
    eyebrow?: string
    title: string
    subtitle?: string
    primaryCta?: { href?: string; label?: string }
    secondaryCta?: { href?: string; label?: string }
  }
  features: ProjectFeature[]
  app: {
    entryPath: string
    sections: ProjectNavSection[]
  }
  keywords?: string[]
  themeColor?: string
  openGraphImage?: string
}

export const projectConfig: ProjectConfig = {
  name: 'Mobius Polkadot Studio',
  shortName: 'Mobius Studio',
  summary: 'MobiusAI assembles wallet-native experiences on Polkadot with zero backend code required.',
  hero: {
    eyebrow: 'MobiusAI + Polkadot UI',
    title: 'Ship Polkadot experiences faster than ever.',
    subtitle:
      'Generate landing pages, dashboards, and transaction-ready components infused with on-chain intelligence. Tailor the copy to your product in seconds.',
    primaryCta: { href: '/experience', label: 'Enter Studio' },
    secondaryCta: { href: '#network', label: 'View network status' },
  },
  features: [
    {
      title: 'Wallet-native onboarding',
      description: 'Authenticate users with Polkadot wallets and surface trusted identities instantly.',
      icon: 'overview',
    },
    {
      title: 'Dynamic marketplace flows',
      description: 'Mint, list, or trade digital assets with reusable Polkadot UI primitives.',
      icon: 'marketplace',
    },
    {
      title: 'Telemetry & history',
      description: 'Track extrinsic lifecycle locally with optimistic updates and toast notifications.',
      icon: 'activity',
    },
  ],
  app: {
    entryPath: '/experience',
    sections: [
      {
        href: '/experience',
        label: 'Experience',
        description: 'End-to-end journey for the experience generated from your prompt.',
        icon: 'overview',
      },
    ],
  },
  keywords: ['Polkadot', 'MobiusAI', 'Web3', 'dApp builder', 'wallet-native'],
  themeColor: '#6d28d9',
}
`,

  reactQueryCompat: `import {
  useQuery as baseUseQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'

type LegacyUseQueryArgs<TData, TError> =
  | [UseQueryOptions<TData, TError>]
  | [QueryKey, UseQueryOptions<TData, TError>['queryFn']]
  | [QueryKey, UseQueryOptions<TData, TError>['queryFn'], UseQueryOptions<TData, TError>]

function normalizeQueryArgs<TData, TError>(
  args: LegacyUseQueryArgs<TData, TError>
): UseQueryOptions<TData, TError> {
  if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    return args[0]
  }

  const [queryKey, queryFnOrOptions, maybeOptions] = args
  const options: UseQueryOptions<TData, TError> = {
    queryKey: queryKey as QueryKey,
  }

  if (typeof queryFnOrOptions === 'function') {
    options.queryFn = queryFnOrOptions
    if (maybeOptions && typeof maybeOptions === 'object') {
      Object.assign(options, maybeOptions)
    }
  } else if (queryFnOrOptions && typeof queryFnOrOptions === 'object') {
    Object.assign(options, queryFnOrOptions)
  }

  return options
}

export function useQuery<TData = unknown, TError = unknown>(
  ...args: LegacyUseQueryArgs<TData, TError>
): UseQueryResult<TData, TError> {
  if (!args.length) {
    throw new Error('useQuery requires at least a queryKey or options object')
  }

  const normalized = normalizeQueryArgs(args)
  return baseUseQuery<TData, TError>(normalized)
}

export type {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'
`,

  uiTabs: `"use client"
import { createContext, useContext, ReactNode, useMemo, useState } from 'react'

type TabsVariant = 'pill' | 'underline'

type TabsContextValue = {
  value?: string
  setValue: (next: string) => void
  variant: TabsVariant
  fullWidth?: boolean
}

const TabsContext = createContext<TabsContextValue | null>(null)

export type TabsProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (next: string) => void
  children: ReactNode
  className?: string
  variant?: TabsVariant
  fullWidth?: boolean
  ariaLabel?: string
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
  variant = 'pill',
  fullWidth,
  ariaLabel,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)

  const activeValue = value ?? internalValue

  const handleChange = (next: string) => {
    if (value === undefined) {
      setInternalValue(next)
    }
    onValueChange?.(next)
  }

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      value: activeValue,
      setValue: handleChange,
      variant,
      fullWidth,
    }),
    [activeValue, handleChange, variant, fullWidth]
  )

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        className={cn('flex flex-wrap gap-2', className)}
        role="tablist"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export type TabProps = {
  value: string
  children?: ReactNode
  label?: ReactNode
  icon?: ReactNode
  badge?: ReactNode
  description?: ReactNode
  disabled?: boolean
  className?: string
}

export function Tab({
  value,
  children,
  label,
  icon,
  badge,
  description,
  disabled,
  className,
}: TabProps) {
  const context = useTabsContext()
  const isActive = context.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={Boolean(isActive)}
      aria-controls={\`tab-panel-\${value}\`}
      disabled={disabled}
      onClick={() => {
        if (!disabled) context.setValue(value)
      }}
      className={cn(
        'group inline-flex min-w-[120px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400',
        context.fullWidth ? 'flex-1 justify-center' : 'justify-center',
        context.variant === 'underline'
          ? 'rounded-none border-transparent border-b-2'
          : 'border-white/10',
        isActive
          ? context.variant === 'underline'
            ? 'border-b-purple-400 text-white'
            : 'bg-white text-slate-900 shadow-lg shadow-purple-600/20'
          : context.variant === 'underline'
            ? 'border-b-transparent text-white/60 hover:text-white'
            : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {icon ? <span className="text-base text-purple-300">{icon}</span> : null}
      <span className="flex flex-col text-center leading-tight">
        <span>{label ?? children}</span>
        {description ? (
          <span className="text-xs font-normal text-white/50">{description}</span>
        ) : null}
      </span>
      {badge ? (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/80">
          {badge}
        </span>
      ) : null}
    </button>
  )
}

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tab components must be rendered inside <Tabs>')
  }
  return context
}

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ')
}
`,

  uiCard: `"use client"
import type { HTMLAttributes } from 'react'

type DivProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_10px_40px_rgba(15,23,42,0.35)] backdrop-blur',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: DivProps) {
  return <div className={cn('mb-4 flex flex-col gap-1', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold text-white', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-white/60', className)} {...props} />
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn('space-y-4', className)} {...props} />
}

export function CardFooter({ className, ...props }: DivProps) {
  return <div className={cn('mt-4 flex items-center justify-between gap-4', className)} {...props} />
}

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ')
}
`,

  appMarketingPage: `"use client"
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { ConnectWallet, NetworkIndicator } from '@/components/polkadot-ui'
import { projectConfig } from '@/lib/projectConfig'

export default function HomePage() {
  const productName = projectConfig.name
  const heroTitle = projectConfig.hero?.title ?? productName
  const eyebrow = projectConfig.hero?.eyebrow ?? projectConfig.shortName ?? productName
  const isSameTitle =
    heroTitle.trim().toLowerCase() === (productName?.trim().toLowerCase() ?? '')
  const supportingTitle = !isSameTitle ? heroTitle : null
  const headline = productName || heroTitle
  const subtitle =
    projectConfig.hero?.subtitle ?? projectConfig.summary ?? 'Generate wallet-native experiences with MobiusAI.'
  const primaryHref = projectConfig.hero?.primaryCta?.href ?? projectConfig.app?.entryPath ?? '/app'
  const primaryLabel =
    projectConfig.hero?.primaryCta?.label ?? \`Launch \${projectConfig.shortName ?? 'App'}\`
  const secondaryHref = projectConfig.hero?.secondaryCta?.href
  const secondaryLabel = projectConfig.hero?.secondaryCta?.label
  const features = projectConfig.features ?? []

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-20 px-6 py-24">
        <section className="space-y-10">
          <div className="space-y-6">
            {eyebrow ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                <Sparkles className="h-3 w-3 text-purple-300" />
                {eyebrow}
              </span>
            ) : null}
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">{headline}</h1>
            {supportingTitle ? (
              <p className="text-2xl font-semibold text-white/80">{supportingTitle}</p>
            ) : null}
            <p className="max-w-3xl text-lg text-slate-300">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/40 transition hover:bg-purple-500"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <ConnectWallet />
            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </section>

        {features.length ? (
          <section className="space-y-6" id="features">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">What you asked MobiusAI to build</h2>
              <p className="text-sm text-white/60">These modules come straight from your prompt + specification.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-purple-500/40 hover:bg-purple-900/10"
                >
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/60">{feature.description}</p>
                  {feature.href ? (
                    <Link
                      href={feature.href}
                      className="inline-flex items-center gap-1 text-sm font-medium text-purple-300 hover:text-purple-200"
                    >
                      Learn more
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur" id="network">
          <h2 className="text-xl font-semibold text-white/90">Live network status</h2>
          <p className="text-sm text-white/60">
            Seamlessly switch between Polkadot, Kusama, Westend, and community parachains with automatic endpoint
            fallbacks and wallet discovery.
          </p>
          <NetworkIndicator className="max-w-max" />
        </section>

        <footer className="flex flex-col items-start gap-3 border-t border-white/10 pt-10 text-white/60">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em]">
            <Sparkles className="h-3 w-3" />
            Made with MobiusAI
          </span>
        </footer>
      </div>
    </main>
  )
}
`,

  appExperiencePage: `"use client"
import Link from 'next/link'
import { RequireAccount, RequireConnection } from '@/components/polkadot-ui'
import { TxNotification } from '@/components/polkadot-ui'
import { projectConfig } from '@/lib/projectConfig'

export default function ExperiencePage() {
  const entryLabel = projectConfig.app?.sections?.[0]?.label ?? projectConfig.shortName ?? projectConfig.name

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{entryLabel}</p>
          <h1 className="text-3xl font-bold text-white">Your generated experience</h1>
          <p className="text-sm text-white/60">
            This page is intentionally minimal so the AI can replace it with the flows you describe. Update
            <code className="mx-1 font-mono text-purple-300">app/experience/page.tsx</code> or add new routes to extend
            the application.
          </p>
        </div>

        <RequireConnection>
          <RequireAccount>
            <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <header className="space-y-1">
                <h2 className="text-lg font-semibold text-white">You are connected</h2>
                <p className="text-sm text-white/60">Start stitching together Polkadot UI components below.</p>
              </header>
              <TxNotification variant="panel" />
              <p className="text-sm text-white/60">
                Need another canvas? Create a new file under
                <code className="mx-1 font-mono text-purple-300">app/</code> and link it from the landing page.
              </p>
            </section>
          </RequireAccount>
        </RequireConnection>

        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/40 hover:text-white"
          >
            ← Back to landing
          </Link>
        </div>
      </div>
    </main>
  )
}
`,

  appShellLayout: `import type { ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
`,

  appDashboardPage: `"use client"
import { RequireAccount, RequireConnection, BalanceDisplay } from '@/components/polkadot-ui'
import { WalletPanel } from '@/components/wallet/WalletPanel'
import { TxHistoryTable } from '@/components/wallet/TxHistoryTable'
import { MintNftForm } from '@/components/forms/MintNftForm'
import { NetworkHealth } from '@/components/charts/NetworkHealth'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

export default function DashboardPage() {
  const { tokenSymbol, selectedAccount } = usePolkadotUI()

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm text-white/60">Overview</p>
        <h1 className="text-3xl font-bold text-white">Welcome back{selectedAccount ? \`, \${selectedAccount.meta.name || 'builder'}\` : ''}.</h1>
        <p className="text-sm text-white/50">
          Track balances, recent activity, and submit transactions with full Polkadot wallet integration.
        </p>
      </header>

      <RequireConnection>
        <RequireAccount>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <WalletPanel />
              <MintNftForm />
              <TxHistoryTable />
            </div>
            <div className="space-y-6">
              <BalanceDisplay title={\`\${tokenSymbol} balance\`} />
              <NetworkHealth />
            </div>
          </div>
        </RequireAccount>
      </RequireConnection>
    </div>
  )
}
`,

  appActivityPage: `"use client"
import { RequireAccount, RequireConnection, TxNotification } from '@/components/polkadot-ui'
import { TxHistoryTable } from '@/components/wallet/TxHistoryTable'

export default function ActivityPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm text-white/60">Activity</p>
        <h1 className="text-3xl font-bold text-white">Transaction history</h1>
        <p className="text-sm text-white/50">
          Every extrinsic submitted through MobiusAI is tracked locally so you can monitor status and re-run flows.
        </p>
      </header>

      <RequireConnection>
        <RequireAccount>
          <div className="space-y-6">
            <TxNotification variant="panel" />
            <TxHistoryTable showFilters />
          </div>
        </RequireAccount>
      </RequireConnection>
    </div>
  )
}
`,

  appMarketplacePage: `"use client"
import { RequireAccount, RequireConnection } from '@/components/polkadot-ui'
import { MintNftForm } from '@/components/forms/MintNftForm'
import { WalletPanel } from '@/components/wallet/WalletPanel'

export default function MarketplacePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-white/60">Launchpad</p>
        <h1 className="text-3xl font-bold text-white">Mint utility NFTs with one click</h1>
        <p className="text-sm text-white/50">
          Configure recipients, metadata, and asset selections with full wallet confirmation flows.
        </p>
      </header>

      <RequireConnection>
        <RequireAccount>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <MintNftForm />
            <WalletPanel condensed />
          </div>
        </RequireAccount>
      </RequireConnection>
    </div>
  )
}
`,

  appSettingsPage: `"use client"
import { useMemo } from 'react'
import { CHAINS } from '@/lib/chains'
import { usePreferenceStore } from '@/providers/PreferenceStore'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

export default function SettingsPage() {
  const theme = usePreferenceStore((state) => state.theme)
  const setTheme = usePreferenceStore((state) => state.setTheme)
  const selectedChainKey = usePreferenceStore((state) => state.selectedChainKey)
  const setSelectedChainKey = usePreferenceStore((state) => state.setSelectedChainKey)

  const { switchChain, chains, endpoint } = usePolkadotUI()

  const activeChain = useMemo(() => chains.find((chain) => chain.key === selectedChainKey) ?? chains[0], [chains, selectedChainKey])

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm text-white/60">Preferences</p>
        <h1 className="text-3xl font-bold text-white">Settings & personalization</h1>
        <p className="text-sm text-white/50">Choose your theme, default network, and tuning options for the draft workspace.</p>
      </header>

      <section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Theme</h2>
            <p className="text-sm text-white/60">Render the interface in light or dark mode. Persisted locally.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={\`rounded-md px-4 py-2 text-sm font-medium transition \${theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}\`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={\`rounded-md px-4 py-2 text-sm font-medium transition \${theme === 'light' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}\`}
            >
              Light
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div>
          <h2 className="text-lg font-semibold text-white">Default network</h2>
          <p className="text-sm text-white/60">Switch between Polkadot, Kusama, Westend, and parachain endpoints. Automatically reconnects wallets.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {chains.map((chain) => (
            <button
              key={chain.key}
              type="button"
              onClick={() => {
                setSelectedChainKey(chain.key)
                switchChain(chain.key)
              }}
              className={\`rounded-xl border px-4 py-3 text-left transition \${chain.key === activeChain.key ? 'border-purple-500 bg-purple-600/20 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'}\`}
            >
              <h3 className="text-base font-semibold">{chain.name}</h3>
              <p className="text-xs text-white/60">{chain.description}</p>
              <p className="mt-2 text-[11px] text-white/50">Primary endpoint: {chain.endpoints[0]}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-white/50">Connected endpoint: {endpoint}</p>
      </section>

      <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60 backdrop-blur">
        <h2 className="text-lg font-semibold text-white">About</h2>
        <p>MobiusAI generates client-side dApps that are safe to deploy to IPFS and other decentralized hosting providers.</p>
        <p>
          Looking for deeper customization? Edit the generated pages under <code className="rounded bg-white/10 px-1">app/(app)</code> or swap in new Polkadot UI components from the
          registry.
        </p>
      </section>
    </div>
  )
}
`,

  appProviders: `"use client"
import { useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PolkadotUIProvider } from '@/providers/PolkadotUIProvider'
import { usePreferenceStore } from '@/providers/PreferenceStore'

function ThemeSynchronizer() {
  const theme = usePreferenceStore((state) => state.theme)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.theme = theme
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return null
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSynchronizer />
      <PolkadotUIProvider>{children}</PolkadotUIProvider>
    </QueryClientProvider>
  )
}
`,

  preferenceStore: `"use client"
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_CHAIN_KEY } from '@/lib/chains'

type ThemeMode = 'light' | 'dark'

interface PreferenceState {
  theme: ThemeMode
  selectedChainKey: string
  favoriteAccounts: string[]
  setTheme: (mode: ThemeMode) => void
  setSelectedChainKey: (key: string) => void
  toggleFavoriteAccount: (address: string) => void
}

export type PreferenceStoreState = PreferenceState

const storage = createJSONStorage(() => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    }
  }
  return window.localStorage
})

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      selectedChainKey: DEFAULT_CHAIN_KEY,
      favoriteAccounts: [],
      setTheme: (mode) => set({ theme: mode }),
      setSelectedChainKey: (key) => set({ selectedChainKey: key }),
      toggleFavoriteAccount: (address) => {
        const current = get().favoriteAccounts
        const exists = current.includes(address)
        set({
          favoriteAccounts: exists ? current.filter((item) => item !== address) : [...current, address],
        })
      },
    }),
    {
      name: 'mobius-preferences',
      storage,
      skipHydration: true,
    }
  )
)
`,

  layoutNavItems: `import type { ComponentType, SVGProps } from 'react'
import { Activity, Gauge, Settings, ShoppingBag, Sparkles } from 'lucide-react'
import { projectConfig } from '@/lib/projectConfig'

export interface NavItem {
  title: string
  description: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const ICON_MAP: Record<string, ComponentType<SVGSVGElement>> = {
  overview: Gauge,
  dashboard: Gauge,
  activity: Activity,
  marketplace: ShoppingBag,
  settings: Settings,
}

function resolveIcon(icon?: string): ComponentType<SVGSVGElement> {
  if (!icon) return Gauge
  return ICON_MAP[icon] ?? Sparkles
}

const fallback: NavItem[] = [
  {
    title: 'Overview',
    description: 'Balances, quick actions, and recent events.',
    href: '/app',
    icon: Gauge,
  },
  {
    title: 'Activity',
    description: 'Extrinsic lifecycle with full status tracking.',
    href: '/app/activity',
    icon: Activity,
  },
  {
    title: 'Marketplace',
    description: 'Mint NFTs or launch vertical-specific flows.',
    href: '/app/marketplace',
    icon: ShoppingBag,
  },
  {
    title: 'Settings',
    description: 'Theme, network, and personalization controls.',
    href: '/app/settings',
    icon: Settings,
  },
]

export const navItems: NavItem[] =
  projectConfig.app?.sections?.length
    ? projectConfig.app.sections.map<NavItem>((section) => ({
        title: section.label,
        description: section.description,
        href: section.href,
        icon: resolveIcon(section.icon),
      }))
    : fallback
`,

  layoutAppShell: `"use client"
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { navItems } from './NavItems'
import { ConnectWallet, NetworkIndicator, TxNotification } from '@/components/polkadot-ui'
import { projectConfig } from '@/lib/projectConfig'

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const brandName = projectConfig.shortName ?? projectConfig.name
  const brandTagline = projectConfig.hero?.eyebrow ?? 'Polkadot workspace'
  const entryPath = projectConfig.app?.entryPath ?? '/app'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <TxNotification />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-16 pt-6 lg:flex-row lg:gap-8 lg:px-8">
        <aside className="sticky top-6 flex h-fit flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:w-64">
          <div className="flex items-center justify-between gap-3">
            <Link href={entryPath} className="group">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60 group-hover:text-purple-200">{brandTagline}</p>
              <h2 className="text-lg font-semibold text-white group-hover:text-purple-200">{brandName}</h2>
            </Link>
            <button
              type="button"
              className="rounded-lg border border-white/10 p-2 text-white/70 lg:hidden"
              onClick={() => setIsMobileOpen((prev) => !prev)}
            >
              {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
          <NetworkIndicator />
          <nav className={['flex flex-col gap-2', isMobileOpen ? 'block' : 'hidden lg:flex'].join(' ')}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(\`\${item.href}/\`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={[
                    'group flex items-start gap-3 rounded-xl border px-3 py-2 transition',
                    isActive
                      ? 'border-purple-500 bg-purple-600/30 text-white'
                      : 'border-transparent bg-white/0 text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white',
                  ].join(' ')}
                >
                  <item.icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-white/60">{item.description}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
          <div className="hidden lg:block">
            <ConnectWallet />
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:hidden">
            <NetworkIndicator />
            <ConnectWallet />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-purple-500/10 backdrop-blur">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
`,

  formMintNft: `"use client"
import { useEffect, useMemo, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { AddressInput, AmountInput, SelectTokenDialog, TxButton } from '@/components/polkadot-ui'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'
import type { ApiPromise } from '@polkadot/api'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import type { ChainAsset } from '@/lib/chains'

export function MintNftForm() {
  const { api, assetCatalog, tokenSymbol } = usePolkadotUI()
  const [recipient, setRecipient] = useState('')
  const [metadata, setMetadata] = useState('')
  const [amount, setAmount] = useState('1')
  const [selectedToken, setSelectedToken] = useState<ChainAsset | null>(assetCatalog[0] ?? null)
  const [isTokenDialogOpen, setTokenDialogOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    setSelectedToken((current) => {
      if (!assetCatalog.length) return null
      if (current && assetCatalog.some((token) => token.key === current.key)) {
        return current
      }
      return assetCatalog[0]
    })
  }, [assetCatalog])

  const buildExtrinsic = useMemo(() => {
    if (!api || !recipient || !metadata) return null
    const payload = JSON.stringify({
      action: 'mint',
      recipient,
      token: selectedToken?.symbol ?? tokenSymbol,
      amount,
      metadata,
      timestamp: Date.now(),
    })
    return (apiInstance: ApiPromise, _account: InjectedAccountWithMeta) => {
      void _account
      return apiInstance.tx.system.remarkWithEvent(payload)
    }
  }, [amount, api, metadata, recipient, selectedToken, tokenSymbol])

  const isSubmitDisabled = !buildExtrinsic

  return (
    <section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <header className="space-y-2">
        <p className="text-sm text-white/60">Workflow template</p>
        <h2 className="text-xl font-semibold text-white">Mint NFT (remark demo)</h2>
        <p className="text-xs text-white/50">
          This form crafts an on-chain remark payload. Swap it for pallet-specific extrinsics to align with your business logic.
        </p>
      </header>

      <div className="grid gap-4">
        <label className="space-y-2">
          <span className="text-xs uppercase text-white/60">Recipient</span>
          <AddressInput value={recipient} onChange={setRecipient} placeholder="Enter destination address" />
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase text-white/60">Token</span>
          <button
            type="button"
            onClick={() => setTokenDialogOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
          >
            <span>{selectedToken ? \`\${selectedToken.symbol} • \${selectedToken.name}\` : 'Select token'}</span>
            <span className="text-xs text-white/50">Change</span>
          </button>
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase text-white/60">Amount</span>
          <AmountInput value={amount} onChange={setAmount} token={selectedToken?.symbol ?? tokenSymbol} />
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase text-white/60">Metadata (JSON)</span>
          <textarea
            value={metadata}
            onChange={(event) => setMetadata(event.target.value)}
            className="min-h-[120px] rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:border-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            placeholder='{"name":"Mobius Badge","description":"Grants access to beta features"}'
          />
        </label>
      </div>

      <TxButton
        label="Mint NFT"
        className="w-full justify-center"
        disabled={isSubmitDisabled}
        buildExtrinsic={(apiInstance, account) => {
          if (!buildExtrinsic) throw new Error('Missing extrinsic builder')
          setStatus(null)
          return buildExtrinsic(apiInstance, account)
        }}
        summary="Submit remark mint"
        section="system"
        method="remarkWithEvent"
        onSubmitted={() => setStatus('Transaction submitted')}
        onFinalized={() => setStatus('Transaction finalized')}
        onError={(error) => setStatus(error.message)}
      />

      <div className="flex items-center justify-between text-xs text-white/50">
        <span className="inline-flex items-center gap-2 text-white/60">
          <UploadCloud className="h-3.5 w-3.5" />
          Remark payloads are great for prototyping NFT flows on any Substrate chain.
        </span>
        {status ? <span className="text-white/70">{status}</span> : null}
      </div>

      <SelectTokenDialog
        open={isTokenDialogOpen}
        onOpenChange={setTokenDialogOpen}
        tokens={assetCatalog}
        selectedToken={selectedToken}
        onSelect={(token) => {
          setSelectedToken(token)
          setTokenDialogOpen(false)
        }}
      />
    </section>
  )
}
`,

  walletPanel: `"use client"
import { Star } from 'lucide-react'
import { AccountInfo, BalanceDisplay, RequireAccount } from '@/components/polkadot-ui'
import { usePreferenceStore } from '@/providers/PreferenceStore'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

interface WalletPanelProps {
  condensed?: boolean
}

export function WalletPanel({ condensed }: WalletPanelProps) {
  const favoriteAccounts = usePreferenceStore((state) => state.favoriteAccounts)
  const toggleFavoriteAccount = usePreferenceStore((state) => state.toggleFavoriteAccount)
  const { selectedAccount } = usePolkadotUI()

  if (!selectedAccount) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60 backdrop-blur">
        Connect your wallet to view balances and recent transactions.
      </div>
    )
  }

  const isFavorite = favoriteAccounts.includes(selectedAccount.address)

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase text-white/60">Wallet</p>
          <h2 className="text-lg font-semibold text-white">{selectedAccount.meta.name || 'Active account'}</h2>
        </div>
        <button
          type="button"
          onClick={() => toggleFavoriteAccount(selectedAccount.address)}
          className={[
            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition',
            isFavorite ? 'border-yellow-400/60 bg-yellow-500/10 text-yellow-300' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/40 hover:text-white',
          ].join(' ')}
        >
          <Star className="h-3.5 w-3.5" />
          {isFavorite ? 'Favorited' : 'Favorite'}
        </button>
      </header>

      <RequireAccount>
        <div className="grid gap-4 md:grid-cols-2">
          <BalanceDisplay className="h-full" />
          {condensed ? null : <BalanceDisplay title="Reserved balance" className="h-full" />}
        </div>
        {condensed ? null : <AccountInfo />}
      </RequireAccount>
    </section>
  )
}
`,

  walletTxHistory: `"use client"
import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { TxNotification } from '@/components/polkadot-ui'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

interface TxHistoryTableProps {
  showFilters?: boolean
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  inBlock: 'In block',
  finalized: 'Finalized',
  error: 'Error',
}

export function TxHistoryTable({ showFilters }: TxHistoryTableProps) {
  const { txQueue } = usePolkadotUI()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return txQueue
    return txQueue.filter((tx) => tx.status === statusFilter)
  }, [statusFilter, txQueue])

  if (!txQueue.length) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60 backdrop-blur">
        Submit a transaction to populate your history. Everything stays on-device.
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-white/60">History</p>
          <h2 className="text-lg font-semibold text-white">Recent transactions</h2>
        </div>
        {showFilters ? (
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="inBlock">In block</option>
            <option value="finalized">Finalized</option>
            <option value="error">Error</option>
          </select>
        ) : null}
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-white/60">
              <th className="px-3 py-2">Summary</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Hash</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((tx) => (
              <tr key={tx.id} className="text-white/80">
                <td className="px-3 py-2">
                  <p className="font-medium text-white">{tx.summary}</p>
                  <p className="text-xs text-white/50">
                    {tx.section}.{tx.method}
                  </p>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={[
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      tx.status === 'error'
                        ? 'bg-rose-500/10 text-rose-200'
                        : tx.status === 'finalized'
                        ? 'bg-emerald-500/10 text-emerald-200'
                        : tx.status === 'inBlock'
                        ? 'bg-amber-500/10 text-amber-200'
                        : 'bg-white/5 text-white/70',
                    ].join(' ')}
                  >
                    {STATUS_LABEL[tx.status] ?? tx.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-white/60">
                  {tx.hash ? tx.hash.slice(0, 12) + '…' : '—'}
                </td>
                <td className="px-3 py-2 text-xs text-white/50">
                  {formatDistanceToNow(tx.updatedAt, { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TxNotification variant="inline" />
    </section>
  )
}
`,

  chartNetworkHealth: `"use client"
import { useEffect, useState } from 'react'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

interface NetworkMetrics {
  bestNumber?: number
  finalizedNumber?: number
  peers?: number
}

export function NetworkHealth() {
  const { api, chainName } = usePolkadotUI()
  const [metrics, setMetrics] = useState<NetworkMetrics>({})

  useEffect(() => {
    let mounted = true
    if (!api) return

    Promise.all([
      api.derive.chain.bestNumber(),
      api.derive.chain.bestNumberFinalized(),
      api.rpc.system.health(),
    ])
      .then(([best, finalized, health]) => {
        if (!mounted) return
        setMetrics({
          bestNumber: best.toNumber(),
          finalizedNumber: finalized.toNumber(),
          peers: health.peers.toNumber(),
        })
      })
      .catch((error) => {
        console.error('[NetworkHealth] Failed to derive metrics', error)
      })

    const interval = setInterval(() => {
      api.rpc.system.health().then((health) => {
        if (!mounted) return
        setMetrics((prev) => ({
          ...prev,
          peers: health.peers.toNumber(),
        }))
      })
    }, 15_000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [api])

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <header className="space-y-1">
        <p className="text-xs uppercase text-white/60">Network</p>
        <h2 className="text-lg font-semibold text-white">{chainName} health</h2>
      </header>
      <dl className="grid gap-3 text-sm text-white/70 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <dt className="text-xs uppercase text-white/60">Best block</dt>
          <dd className="text-lg font-semibold text-white">{metrics.bestNumber ?? '—'}</dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <dt className="text-xs uppercase text-white/60">Finalized</dt>
          <dd className="text-lg font-semibold text-white">{metrics.finalizedNumber ?? '—'}</dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <dt className="text-xs uppercase text-white/60">Peers</dt>
          <dd className="text-lg font-semibold text-white">{metrics.peers ?? '—'}</dd>
        </div>
      </dl>
      <p className="text-xs text-white/50">
        Data derives from <code className="rounded bg-white/10 px-1">api.derive.chain</code> helpers. Extend this card to include staking, crowdloan, or price feeds.
      </p>
    </section>
  )
}
`,

  hooksUsePolkadotUI: `"use client"
export { usePolkadotUI } from '@/providers/PolkadotUIProvider'
`,

  hooksUsePreferenceStore: `"use client"
export { usePreferenceStore } from '@/providers/PreferenceStore'
export type { PreferenceStoreState } from '@/providers/PreferenceStore'
`,

  chainConfig: `export interface ChainAsset {
  key: string
  symbol: string
  name: string
  decimals: number
}

export interface ChainConfig {
  key: string
  name: string
  description: string
  endpoints: string[]
  symbol: string
  decimals: number
  assets: ChainAsset[]
}

export const DEFAULT_CHAIN_KEY = 'polkadot'

export const CHAINS: ChainConfig[] = [
  {
    key: 'polkadot',
    name: 'Polkadot',
    description: 'Relay chain secured by nominated proof-of-stake.',
    endpoints: ['wss://rpc.polkadot.io', 'wss://1rpc.io/dot', 'wss://polkadot.api.onfinality.io/public-ws'],
    symbol: 'DOT',
    decimals: 10,
    assets: [
      { key: 'polkadot-dot', symbol: 'DOT', name: 'Polkadot', decimals: 10 },
      { key: 'polkadot-usdt', symbol: 'USDT', name: 'Tether USD (Asset Hub)', decimals: 6 },
    ],
  },
  {
    key: 'kusama',
    name: 'Kusama',
    description: 'Experimental relay chain for fearless builders.',
    endpoints: ['wss://kusama-rpc.polkadot.io', 'wss://1rpc.io/ksm', 'wss://kusama.api.onfinality.io/public-ws'],
    symbol: 'KSM',
    decimals: 12,
    assets: [
      { key: 'kusama-ksm', symbol: 'KSM', name: 'Kusama', decimals: 12 },
      { key: 'kusama-usdt', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    ],
  },
  {
    key: 'westend',
    name: 'Westend',
    description: 'Community testnet that mirrors Polkadot features.',
    endpoints: ['wss://westend-rpc.polkadot.io', 'wss://westend.api.onfinality.io/public-ws'],
    symbol: 'WND',
    decimals: 12,
    assets: [
      { key: 'westend-wnd', symbol: 'WND', name: 'Westend', decimals: 12 },
    ],
  },
  {
    key: 'asset-hub',
    name: 'Asset Hub Polkadot',
    description: 'System parachain for asset issuance and bridging.',
    endpoints: ['wss://polkadot-asset-hub-rpc.polkadot.io', 'wss://asset-hub-polkadot-rpc.polkadot.io'],
    symbol: 'DOT',
    decimals: 10,
    assets: [
      { key: 'assethub-dot', symbol: 'DOT', name: 'Polkadot', decimals: 10 },
      { key: 'assethub-usdc', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { key: 'assethub-usdt', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    ],
  },
]

export function getChainByKey(key: string): ChainConfig {
  return CHAINS.find((chain) => chain.key === key) ?? CHAINS[0]
}

export function getAssetCatalog(key: string): ChainAsset[] {
  return getChainByKey(key).assets
}
`,

  txHelpers: `import type { ApiPromise } from '@polkadot/api'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import type { SubmittableExtrinsic } from '@polkadot/api/types'

export type ExtrinsicBuilder = (api: ApiPromise, account: InjectedAccountWithMeta) => SubmittableExtrinsic<'promise'>

export function createRemarkBuilder(payload: unknown): ExtrinsicBuilder {
  const message = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return (api) => api.tx.system.remarkWithEvent(message)
}

export interface TxDescriptor {
  summary: string
  section: string
  method: string
}

export function describeExtrinsic(
  builder: ExtrinsicBuilder,
  api: ApiPromise,
  account: InjectedAccountWithMeta
): TxDescriptor {
  const extrinsic = builder(api, account)
  const { method } = extrinsic
  return {
    summary: method.meta?.docs?.[0] ?? 'Extrinsic submission',
    section: method.section,
    method: method.method,
  }
}
`,

  // .env.example template
  envExample: `# MobiusAI On-Chain Draft Environment
NEXT_PUBLIC_APP_NAME=Mobius Draft
NEXT_PUBLIC_POLKADOT_ENDPOINT=wss://rpc.polkadot.io
NEXT_PUBLIC_POLKADOT_CHAIN=Polkadot
NEXT_PUBLIC_POLKADOT_UNIT=DOT
NEXT_PUBLIC_POLKADOT_DECIMALS=10

# Optional secondary endpoints (comma separated)
NEXT_PUBLIC_POLKADOT_FALLBACKS=wss://paseo.rpc.grove.city

# Groq AI (optional)
GROQ_API_KEY=your-groq-api-key
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=openai/gpt-oss-120b
`,

  // Prisma schema template (basic structure)
  prismaSchema: `generator client {
  provider = "prisma-client-js"
  binaryTargets = ["linux-musl-arm64-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
  credentials   Credential[]
  wallets       Wallet[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Credential {
  id       String @id @default(cuid())
  userId   String @unique
  email    String
  password String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Wallet {
  id      String @id @default(cuid())
  userId  String @unique
  address String @unique
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Nonce {
  id        String   @id @default(cuid())
  value     String   @unique
  subject   String
  purpose   String
  expiresAt DateTime
  usedAt    DateTime?
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
`,

  // lib/authConfig.ts template - NextAuth configuration (Polkadot-only)
  authConfig: `import GoogleProvider from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { signatureVerify, cryptoWaitReady, decodeAddress } from '@polkadot/util-crypto'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const authOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Credentials({
      id: 'polkadot',
      name: 'Polkadot',
      credentials: {
        address: { label: 'address', type: 'text' },
        challenge: { label: 'challenge', type: 'text' },
        signature: { label: 'signature', type: 'text' }
      },
      async authorize(creds) {
        const address = creds?.address as string
        const signature = creds?.signature as string
        const challenge = creds?.challenge as string
        if (!address || !signature || !challenge) return null
        const value = crypto.createHash('sha256').update(challenge).digest('base64')
        const nonce = await prisma.nonce.findUnique({ where: { value } })
        if (!nonce || nonce.usedAt || nonce.expiresAt < new Date() || nonce.subject !== address) return null
        try { decodeAddress(address) } catch { return null }
        await cryptoWaitReady()
        const res = signatureVerify(challenge, signature, address)
        if (!res.isValid) return null
        const existingWallet = await prisma.wallet.findUnique({ where: { address } })
        let userId = existingWallet?.userId
        if (!userId) {
          const user = await prisma.user.create({ data: { name: \`polkadot:\${address.slice(0,6)}…\`, email: null } })
          await prisma.wallet.create({ data: { userId: user.id, address, lastUsedAt: new Date() } })
          userId = user.id
        } else {
          await prisma.wallet.update({ where: { address }, data: { lastUsedAt: new Date() } })
        }
        await prisma.nonce.update({ where: { id: nonce.id }, data: { usedAt: new Date() } })
        return { id: userId, name: \`polkadot:\${address.slice(0,6)}…\`, email: \`\${address}@substrate.local\`, address }
      }
    })
  ],
  session: { strategy: 'jwt' as const },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn() {
      return true
    },
    async jwt({ token, user }: any) {
      if (user?.id) (token as any).uid = user.id
      if (user?.address) (token as any).address = user.address
      return token
    },
    async session({ session, token }: any) {
      if ((token as any)?.uid) (session.user as any).id = (token as any).uid
      if ((token as any)?.address) (session.user as any).address = (token as any).address
      return session
    }
  }
}
`,

  // lib/auth.ts template - NextAuth configuration (Polkadot-only)
  authTs: `import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { signatureVerify, cryptoWaitReady, decodeAddress } from '@polkadot/util-crypto'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const authOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Credentials({
      id: 'polkadot',
      name: 'Polkadot',
      credentials: {
        address: { label: 'address', type: 'text' },
        challenge: { label: 'challenge', type: 'text' },
        signature: { label: 'signature', type: 'text' }
      },
      async authorize(creds) {
        const address = creds?.address as string
        const signature = creds?.signature as string
        const challenge = creds?.challenge as string
        if (!address || !signature || !challenge) return null
        const value = crypto.createHash('sha256').update(challenge).digest('base64')
        const nonce = await prisma.nonce.findUnique({ where: { value } })
        if (!nonce || nonce.usedAt || nonce.expiresAt < new Date() || nonce.subject !== address) return null
        try { decodeAddress(address) } catch { return null }
        await cryptoWaitReady()
        const res = signatureVerify(challenge, signature, address)
        if (!res.isValid) return null
        const existingWallet = await prisma.wallet.findUnique({ where: { address } })
        let userId = existingWallet?.userId
        if (!userId) {
          const user = await prisma.user.create({ data: { name: \`polkadot:\${address.slice(0,6)}…\`, email: null } })
          await prisma.wallet.create({ data: { userId: user.id, address } })
          userId = user.id
        }
        await prisma.nonce.update({ where: { id: nonce.id }, data: { usedAt: new Date() } })
        return { id: userId, name: \`polkadot:\${address.slice(0,6)}…\`, email: \`\${address}@substrate.local\` }
      }
    })
  ],
  session: { strategy: 'jwt' as const },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }: any) {
      return true
    },
    async jwt({ token, user }: any) {
      if (user?.id) (token as any).uid = user.id
      return token
    },
    async session({ session, token }: any) {
      if ((token as any)?.uid) (session.user as any).id = (token as any).uid
      return session
    }
  }
}
`,

  // lib/prisma.ts template
  prismaTs: `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Force OpenSSL 3.0.x engine (required for Alpine 3.22 Docker)
    __internal: {
      engine: {
        binaryTarget: 'linux-musl-arm64-openssl-3.0.x'
      }
    } as any
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
`,

  // providers/PolkadotUIProvider.tsx - Core Polkadot UI context and utilities
  polkadotUiProvider: `"use client"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import type { ApiPromise } from '@polkadot/api'
import type { SubmittableExtrinsic } from '@polkadot/api/types'
import type { ISubmittableResult } from '@polkadot/types/types'
import { formatBalance } from '@polkadot/util'
import { Toaster, toast } from 'sonner'
import { CHAINS, DEFAULT_CHAIN_KEY, getChainByKey, type ChainAsset, type ChainConfig } from '@/lib/chains'
import { projectConfig } from '@/lib/projectConfig'
import { usePreferenceStore } from '@/providers/PreferenceStore'

type ApiState = 'idle' | 'connecting' | 'ready' | 'error'
type TxStatus = 'pending' | 'inBlock' | 'finalized' | 'error'

interface SignAndSendCallbacks {
  summary?: string
  section?: string
  method?: string
  onSubmitted?: () => void
  onStatus?: (result: ISubmittableResult) => void
  onInBlock?: (result: ISubmittableResult) => void
  onFinalized?: (result: ISubmittableResult) => void
  onError?: (error: Error) => void
}

type SignAndSendBuilder = (
  api: ApiPromise,
  account: InjectedAccountWithMeta
) => SubmittableExtrinsic<'promise'>

interface TrackedTx {
  id: string
  summary: string
  section: string
  method: string
  status: TxStatus
  hash?: string
  error?: string
  createdAt: number
  updatedAt: number
}

export interface PolkadotUIContextValue {
  api: ApiPromise | null
  apiState: ApiState
  apiError: string | null
  endpoint: string
  blockNumber: number | null
  chainName: string
  tokenSymbol: string
  tokenDecimals: number
  chains: ChainConfig[]
  chainKey: string
  assetCatalog: ChainAsset[]
  accounts: InjectedAccountWithMeta[]
  favoriteAccounts: string[]
  connectingExtension: boolean
  selectedAccount: InjectedAccountWithMeta | null
  connectExtension: (silent?: boolean) => Promise<void>
  disconnectExtension: () => void
  selectAccount: (address: string) => void
  switchChain: (key: string) => void
  signMessage: (message: string) => Promise<string>
  signAndSend: (buildExtrinsic: SignAndSendBuilder, callbacks?: SignAndSendCallbacks) => Promise<void>
  txQueue: TrackedTx[]
  dismissTx: (id: string) => void
  clearTxHistory: () => void
}

const PolkadotUIContext = createContext<PolkadotUIContextValue | undefined>(undefined)

const STORAGE_KEY = 'polkadot-ui-tx-queue'
type ExtensionDappModule = typeof import('@polkadot/extension-dapp')
let extensionModulePromise: Promise<ExtensionDappModule> | null = null

async function loadExtensionModule(): Promise<ExtensionDappModule> {
  if (!extensionModulePromise) {
    extensionModulePromise = import('@polkadot/extension-dapp')
  }
  return extensionModulePromise
}

function createTxId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return \`tx-\${Date.now()}-\${Math.random().toString(16).slice(2)}\`
}

function loadStoredQueue(): TrackedTx[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TrackedTx[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn('[PolkadotUIProvider] Failed to parse stored tx queue', error)
    return []
  }
}

export function usePolkadotUI(): PolkadotUIContextValue {
  const context = useContext(PolkadotUIContext)
  if (!context) {
    throw new Error('usePolkadotUI must be used inside PolkadotUIProvider')
  }
  return context
}

export function PolkadotUIProvider({ children }: { children: ReactNode }) {
  const selectedChainKey = usePreferenceStore((state) => state.selectedChainKey)
  const setSelectedChainKey = usePreferenceStore((state) => state.setSelectedChainKey)
  const favoriteAccounts = usePreferenceStore((state) => state.favoriteAccounts)

  const activeChain = useMemo<ChainConfig>(() => getChainByKey(selectedChainKey), [selectedChainKey])

  const [api, setApi] = useState<ApiPromise | null>(null)
  const [apiState, setApiState] = useState<ApiState>('idle')
  const [apiError, setApiError] = useState<string | null>(null)
  const [endpoint, setEndpoint] = useState<string>(activeChain.endpoints[0] ?? '')
  const [blockNumber, setBlockNumber] = useState<number | null>(null)
  const [chainName, setChainName] = useState<string>(activeChain.name)
  const [tokenSymbol, setTokenSymbol] = useState<string>(activeChain.symbol)
  const [tokenDecimals, setTokenDecimals] = useState<number>(activeChain.decimals)
  const [assetCatalog, setAssetCatalog] = useState<ChainAsset[]>(activeChain.assets)

  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [connectingExtension, setConnectingExtension] = useState(false)

  const apiSubscriptionRef = useRef<(() => void) | null>(null)
  const apiInstanceRef = useRef<ApiPromise | null>(null)

  const [txQueue, setTxQueue] = useState<TrackedTx[]>(() => loadStoredQueue())

  useEffect(() => {
    setEndpoint(activeChain.endpoints[0] ?? '')
    setChainName(activeChain.name)
    setTokenSymbol(activeChain.symbol)
    setTokenDecimals(activeChain.decimals)
    setAssetCatalog(activeChain.assets)
  }, [activeChain])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(txQueue.slice(-20)))
  }, [txQueue])

  const dismissTx = useCallback((id: string) => {
    setTxQueue((prev) => prev.filter((tx) => tx.id !== id))
  }, [])

  const clearTxHistory = useCallback(() => {
    setTxQueue([])
  }, [])

  const pushTx = useCallback((entry: TrackedTx) => {
    setTxQueue((prev) => {
      const next = [...prev, entry]
      return next.slice(-20)
    })
  }, [])

  const updateTx = useCallback((id: string, updates: Partial<TrackedTx>) => {
    setTxQueue((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates, updatedAt: Date.now() } : tx))
    )
  }, [])

  const switchChain = useCallback(
    (key: string) => {
      if (key === selectedChainKey) return
      const exists = CHAINS.find((chain) => chain.key === key)
      setSelectedChainKey(exists ? exists.key : DEFAULT_CHAIN_KEY)
      toast.success(\`Switched network to \${exists?.name ?? getChainByKey(DEFAULT_CHAIN_KEY).name}\`)
    },
    [selectedChainKey, setSelectedChainKey]
  )

  useEffect(() => {
    let cancelled = false

    async function disconnectCurrent() {
      if (apiSubscriptionRef.current) {
        apiSubscriptionRef.current()
        apiSubscriptionRef.current = null
      }
      if (apiInstanceRef.current) {
        try {
          await apiInstanceRef.current.disconnect()
        } catch {
          // ignore disconnect errors
        }
        apiInstanceRef.current = null
      }
    }

    async function connect() {
      setApiState('connecting')
      setApiError(null)
      setBlockNumber(null)
      await disconnectCurrent()

      for (const candidate of activeChain.endpoints) {
        try {
          const { ApiPromise, WsProvider } = await import('@polkadot/api')
          const provider = new WsProvider(candidate)
          const nextApi = await ApiPromise.create({ provider })

          if (cancelled) {
            await nextApi.disconnect()
            return
          }

          const chain = await nextApi.rpc.system.chain()
          const properties = nextApi.registry.getChainProperties()
          const decimals = properties?.tokenDecimals?.[0]?.toNumber() ?? activeChain.decimals
          const symbol = properties?.tokenSymbol?.[0]?.toString() ?? activeChain.symbol

          apiInstanceRef.current = nextApi
          setApi(nextApi)
          setEndpoint(candidate)
          setChainName(chain.toString())
          setTokenDecimals(decimals)
          setTokenSymbol(symbol)
          formatBalance.setDefaults({ decimals, unit: symbol })

          apiSubscriptionRef.current = await nextApi.rpc.chain.subscribeNewHeads((header) => {
            setBlockNumber(header.number.toNumber())
          })

          setApiState('ready')
          return
        } catch (error) {
          console.error('[PolkadotUIProvider] Failed connecting to', candidate, error)
          setApiError((error as Error).message)
        }
      }

      setApiState('error')
    }

    connect().catch((error) => {
      console.error('[PolkadotUIProvider] Connection bootstrap failed', error)
      setApiState('error')
      setApiError((error as Error).message)
    })

    return () => {
      cancelled = true
      void disconnectCurrent()
    }
  }, [activeChain])

  const connectExtension = useCallback(
    async (silent = false) => {
      setConnectingExtension(true)
      try {
        const { web3Enable, web3Accounts } = await loadExtensionModule()
        const extensions = await web3Enable(projectConfig.name || 'MobiusAI Onchain')
        if (!extensions.length) {
          throw new Error('No wallet extension found. Install Polkadot{.js} extension and try again.')
        }

        const extensionNames = extensions
          .map((extension) => extension.name)
          .filter((name): name is string => Boolean(name))

        let injectedAccounts: InjectedAccountWithMeta[] = []
        if (extensionNames.length) {
          try {
            injectedAccounts = await web3Accounts({ extensions: extensionNames })
          } catch (error) {
            console.warn('[PolkadotUIProvider] Failed to fetch accounts with explicit extensions filter', error)
          }
        }
        if (!injectedAccounts.length) {
          injectedAccounts = await web3Accounts()
        }
        setAccounts(injectedAccounts)
        if (!injectedAccounts.length) {
          throw new Error('No accounts available inside your Polkadot wallet.')
        }

        const previouslySelected =
          typeof window !== 'undefined' ? window.localStorage.getItem('polkadot-ui-selected-account') : null

        const defaultAccount =
          (previouslySelected && injectedAccounts.find((acc) => acc.address === previouslySelected)?.address) ||
          injectedAccounts[0].address

        setSelectedAddress(defaultAccount)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('polkadot-ui-selected-account', defaultAccount)
        }

        if (!silent) {
          toast.success('Wallet connected')
        }
      } catch (error) {
        console.error('[PolkadotUIProvider] Wallet connection failed', error)
        setAccounts([])
        setSelectedAddress(null)
        if (!silent) {
          toast.error((error as Error).message)
        }
      } finally {
        setConnectingExtension(false)
      }
    },
    []
  )

  const disconnectExtension = useCallback(() => {
    setAccounts([])
    setSelectedAddress(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('polkadot-ui-selected-account')
    }
    toast('Wallet disconnected')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedAddress = window.localStorage.getItem('polkadot-ui-selected-account')
    if (!savedAddress) return
    connectExtension(true).catch(() => undefined)
  }, [connectExtension])

  const selectAccount = useCallback((address: string) => {
    setSelectedAddress(address)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('polkadot-ui-selected-account', address)
    }
  }, [])

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.address === selectedAddress) ?? null,
    [accounts, selectedAddress]
  )

  const signMessage = useCallback(
    async (message: string) => {
      if (!selectedAccount) {
        throw new Error('No account selected')
      }

      const { web3FromAddress } = await loadExtensionModule()
      const injector = await web3FromAddress(selectedAccount.address)
      const signRaw = injector?.signer?.signRaw

      if (!signRaw) {
        throw new Error('Wallet does not support signing')
      }

      const { signature } = await signRaw({
        address: selectedAccount.address,
        data: message,
        type: 'bytes',
      })

      return signature
    },
    [selectedAccount]
  )

  const signAndSend = useCallback<PolkadotUIContextValue['signAndSend']>(
    async (buildExtrinsic, callbacks) => {
      if (!api) {
        throw new Error('Polkadot API not ready')
      }
      if (!selectedAccount) {
        throw new Error('No account selected')
      }

      const extrinsic = buildExtrinsic(api, selectedAccount)
      const descriptor = {
        section: callbacks?.section ?? extrinsic.method.section,
        method: callbacks?.method ?? extrinsic.method.method,
        summary:
          callbacks?.summary ??
          extrinsic.method.meta?.docs?.[0]?.toString() ??
          \`\${extrinsic.method.section}.\${extrinsic.method.method}\`,
      }

      const txId = createTxId()
      const createdAt = Date.now()

      pushTx({
        id: txId,
        summary: descriptor.summary,
        section: descriptor.section,
        method: descriptor.method,
        status: 'pending',
        createdAt,
        updatedAt: createdAt,
      })

      try {
        const { web3FromAddress } = await loadExtensionModule()
        const injector = await web3FromAddress(selectedAccount.address)
        const unsub = await extrinsic.signAndSend(
          selectedAccount.address,
          { signer: injector.signer },
          (result: ISubmittableResult) => {
            callbacks?.onStatus?.(result)

            const txHash = result.txHash?.toHex?.() ?? result.txHash?.toString?.()
            if (txHash) {
              updateTx(txId, { hash: txHash })
            }

            if (result.status.isReady || result.status.isBroadcast) {
              callbacks?.onSubmitted?.()
            }

            if (result.dispatchError) {
              let message = 'Transaction failed'
              if (result.dispatchError.isModule) {
                const metaError = api.registry.findMetaError(result.dispatchError.asModule)
                message = \`\${metaError.section}.\${metaError.name}\`
              } else {
                message = result.dispatchError.toString()
              }
              const error = new Error(message)
              updateTx(txId, { status: 'error', error: message })
              callbacks?.onError?.(error)
              toast.error(message)
              unsub()
              return
            }

            if (result.status.isInBlock) {
              updateTx(txId, { status: 'inBlock' })
              callbacks?.onInBlock?.(result)
              toast.success('Transaction included in block')
            }

            if (result.status.isFinalized) {
              updateTx(txId, { status: 'finalized' })
              callbacks?.onFinalized?.(result)
              toast.success('Transaction finalized')
              unsub()
            }
          }
        )
      } catch (error) {
        const message = (error as Error).message
        updateTx(txId, { status: 'error', error: message })
        callbacks?.onError?.(error as Error)
        toast.error(message)
        throw error
      }
    },
    [api, pushTx, selectedAccount, updateTx]
  )

  const value = useMemo<PolkadotUIContextValue>(
    () => ({
      api,
      apiState,
      apiError,
      endpoint,
      blockNumber,
      chainName,
      tokenSymbol,
      tokenDecimals,
      chains: CHAINS,
      chainKey: activeChain.key,
      assetCatalog,
      accounts,
      favoriteAccounts,
      connectingExtension,
      selectedAccount,
      connectExtension,
      disconnectExtension,
      selectAccount,
      switchChain,
      signMessage,
      signAndSend,
      txQueue,
      dismissTx,
      clearTxHistory,
    }),
    [
      activeChain.key,
      accounts,
      api,
      apiError,
      apiState,
      assetCatalog,
      blockNumber,
      chainName,
      connectExtension,
      connectingExtension,
      disconnectExtension,
      dismissTx,
      endpoint,
      favoriteAccounts,
      selectAccount,
      signAndSend,
      signMessage,
      switchChain,
      tokenDecimals,
      tokenSymbol,
      txQueue,
      clearTxHistory,
      selectedAccount,
    ]
  )

  return (
    <PolkadotUIContext.Provider value={value}>
      <Toaster position="bottom-right" richColors />
      {children}
    </PolkadotUIContext.Provider>
  )
}
`,
  // components/polkadot-ui/ConnectWallet.tsx
  polkadotUiConnectWallet: `"use client"
import { Loader2, LogOut } from 'lucide-react'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'
import { projectConfig } from '@/lib/projectConfig'

function truncateAddress(address: string) {
  return \`\${address.slice(0, 6)}…\${address.slice(-6)}\`
}

export function ConnectWallet() {
  const {
    accounts,
    connectExtension,
    connectingExtension,
    disconnectExtension,
    selectedAccount,
    selectAccount,
  } = usePolkadotUI()

  if (selectedAccount) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-purple-600/40 bg-purple-950/20 px-3 py-2">
        <div>
          <p className="text-xs text-purple-300 uppercase tracking-wide">Connected account</p>
          <p className="font-mono text-sm text-white">{truncateAddress(selectedAccount.address)}</p>
          <p className="text-xs text-purple-200/70">{selectedAccount.meta.name || 'Unnamed account'}</p>
        </div>
        {accounts.length > 1 ? (
          <select
            className="rounded-md border border-purple-500/50 bg-purple-900/40 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={selectedAccount.address}
            onChange={(event) => selectAccount(event.target.value)}
          >
            {accounts.map((account) => (
              <option key={account.address} value={account.address}>
                {truncateAddress(account.address)} {account.meta.name ? \`(\${account.meta.name})\` : ''}
              </option>
            ))}
          </select>
        ) : null}
        <button
          onClick={disconnectExtension}
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-500"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </button>
      </div>
    )
  }

  const walletLabel = projectConfig.shortName
    ? \`Connect \${projectConfig.shortName}\`
    : 'Connect Polkadot Wallet'

  return (
    <button
      className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
      onClick={connectExtension}
      disabled={connectingExtension}
    >
      {connectingExtension ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {connectingExtension ? 'Connecting…' : walletLabel}
    </button>
  )
}
`,

  // components/polkadot-ui/NetworkIndicator.tsx
  polkadotUiNetworkIndicator: `"use client"
import { useMemo } from 'react'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

type Variant = 'ready' | 'connecting' | 'error' | 'idle'

const VARIANT_STYLES: Record<Variant, string> = {
  ready: 'bg-emerald-500/20 text-emerald-200 border-emerald-600/60',
  connecting: 'bg-amber-500/20 text-amber-200 border-amber-500/60',
  error: 'bg-rose-500/20 text-rose-200 border-rose-600/60',
  idle: 'bg-slate-500/10 text-slate-200 border-slate-600/40',
}

const VARIANT_LABEL: Record<Variant, string> = {
  ready: 'Connected',
  connecting: 'Connecting…',
  error: 'Connection error',
  idle: 'Idle',
}

export function NetworkIndicator({ className }: { className?: string }) {
  const { apiState, chainName, blockNumber, endpoint } = usePolkadotUI()

  const variant = useMemo<Variant>(() => {
    if (apiState === 'ready') return 'ready'
    if (apiState === 'connecting') return 'connecting'
    if (apiState === 'error') return 'error'
    return 'idle'
  }, [apiState])

  return (
    <div
      className={[
        'inline-flex items-center gap-3 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        VARIANT_STYLES[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="flex h-2.5 w-2.5 items-center justify-center">
        <span className="h-2 w-2 rounded-full bg-current" />
      </span>
      <span className="flex flex-col">
        <span>{chainName}</span>
        <span className="text-[10px] opacity-80">
          {VARIANT_LABEL[variant]} {blockNumber ? \`• #\${blockNumber}\` : ''}
        </span>
      </span>
      <span className="hidden text-[10px] opacity-60 md:inline">
        {endpoint.replace('wss://', '').replace('https://', '')}
      </span>
    </div>
  )
}
`,

  // components/polkadot-ui/RequireConnection.tsx
  polkadotUiRequireConnection: `"use client"
import type { ReactNode } from 'react'
import { NetworkIndicator } from '@/components/polkadot-ui/NetworkIndicator'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

interface RequireConnectionProps {
  children: ReactNode
  fallback?: ReactNode
  showIndicator?: boolean
}

export function RequireConnection({ children, fallback, showIndicator = true }: RequireConnectionProps) {
  const { apiState } = usePolkadotUI()

  if (apiState !== 'ready') {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="rounded-lg border border-purple-500/40 bg-purple-900/30 px-4 py-6 text-sm text-purple-100">
        <p className="font-semibold text-purple-200">Connect to the network to continue</p>
        <p className="mt-2 text-purple-100/80">
          Your Polkadot endpoint is currently unavailable. Open the wallet connection dialog and ensure your extension
          is unlocked.
        </p>
        {showIndicator ? <NetworkIndicator className="mt-4" /> : null}
      </div>
    )
  }

  return <>{children}</>
}
`,

  // components/polkadot-ui/RequireAccount.tsx
  polkadotUiRequireAccount: `"use client"
import type { ReactNode } from 'react'
import { ConnectWallet } from '@/components/polkadot-ui/ConnectWallet'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

interface RequireAccountProps {
  children: ReactNode
  fallback?: ReactNode
}

export function RequireAccount({ children, fallback }: RequireAccountProps) {
  const { selectedAccount } = usePolkadotUI()

  if (!selectedAccount) {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <div className="rounded-lg border border-purple-500/40 bg-purple-900/30 px-4 py-6 text-sm text-purple-100">
        <p className="font-semibold text-purple-200">Select an account to continue</p>
        <p className="mt-2 text-purple-100/80">
          Choose the account you want to use for signing transactions and managing balances.
        </p>
        <div className="mt-4">
          <ConnectWallet />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
`,

  // components/polkadot-ui/TxButton.tsx
  polkadotUiTxButton: `"use client"
import { useCallback, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import type { ApiPromise } from '@polkadot/api'
import type { SubmittableExtrinsic } from '@polkadot/api/types'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

interface TxButtonProps {
  label?: string
  className?: string
  disabled?: boolean
  buildExtrinsic: (api: ApiPromise, account: InjectedAccountWithMeta) => SubmittableExtrinsic<'promise'>
  summary?: string
  section?: string
  method?: string
  onSubmitted?: () => void
  onInBlock?: () => void
  onFinalized?: () => void
  onError?: (error: Error) => void
}

export function TxButton({
  label = 'Submit Transaction',
  className,
  disabled,
  buildExtrinsic,
  summary,
  section,
  method,
  onSubmitted,
  onInBlock,
  onFinalized,
  onError,
}: TxButtonProps) {
  const { apiState, selectedAccount, signAndSend } = usePolkadotUI()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClick = useCallback(async () => {
    if (!selectedAccount) return
    setIsSubmitting(true)

    try {
      await signAndSend(buildExtrinsic, {
        summary,
        section,
        method,
        onStatus: (result) => {
          if (result.status.isReady || result.status.isBroadcast || result.status.isInBlock) {
            onSubmitted?.()
          }
        },
        onInBlock: () => {
          onInBlock?.()
        },
        onFinalized: () => {
          onFinalized?.()
          setIsSubmitting(false)
        },
        onError: (error) => {
          setIsSubmitting(false)
          onError?.(error)
        },
      })
    } catch (error) {
      setIsSubmitting(false)
      onError?.(error as Error)
    }
  }, [buildExtrinsic, method, onError, onFinalized, onInBlock, onSubmitted, section, selectedAccount, signAndSend, summary])

  const isUnavailable = apiState !== 'ready' || !selectedAccount

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isSubmitting || isUnavailable}
      className={[
        'inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {isSubmitting ? 'Submitting…' : label}
    </button>
  )
}
`,

  polkadotUiTxNotification: `"use client"
import { Fragment } from 'react'
import { CheckCircle2, Info, Loader2, TriangleAlert, X } from 'lucide-react'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

type Variant = 'toast' | 'inline' | 'panel'
type Status = 'pending' | 'inBlock' | 'finalized' | 'error'

const STATUS_LABEL: Record<Status, string> = {
  pending: 'Pending',
  inBlock: 'In block',
  finalized: 'Finalized',
  error: 'Error',
}

const STATUS_STYLE: Record<Status, string> = {
  pending: 'border-white/10 bg-white/5 text-white/70',
  inBlock: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
  finalized: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
}

function StatusIcon({ status }: { status: Status }) {
  if (status === 'pending') {
    return <Loader2 className="h-4 w-4 animate-spin" />
  }
  if (status === 'inBlock') {
    return <Loader2 className="h-4 w-4 animate-spin text-amber-200" />
  }
  if (status === 'finalized') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-200" />
  }
  if (status === 'error') {
    return <TriangleAlert className="h-4 w-4 text-rose-200" />
  }
  return <Info className="h-4 w-4" />
}

export function TxNotification({ variant = 'toast' }: { variant?: Variant }) {
  const { txQueue, dismissTx, clearTxHistory } = usePolkadotUI()

  if (!txQueue.length) {
    if (variant === 'inline') {
      return (
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
          All transactions are complete.
        </div>
      )
    }
    if (variant === 'panel') {
      return (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60 backdrop-blur">
          Transactions will appear here after you submit an extrinsic.
        </section>
      )
    }
    return null
  }

  const items = txQueue.slice(-6).reverse()

  if (variant === 'toast') {
    return (
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[320px] flex-col gap-3">
        {items.map((tx) => (
          <div
            key={tx.id}
            className={[
              'pointer-events-auto overflow-hidden rounded-2xl border p-4 shadow-lg shadow-black/50 backdrop-blur',
              STATUS_STYLE[tx.status],
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              <StatusIcon status={tx.status} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{tx.summary}</p>
                <p className="text-xs text-white/70">
                  {tx.section}.{tx.method}
                </p>
                {tx.hash ? (
                  <p className="mt-1 font-mono text-[11px] text-white/50">hash: {tx.hash.slice(0, 18)}…</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismissTx(tx.id)}
                className="rounded-full border border-white/10 p-1 text-white/60 transition hover:border-white/30 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const listContent = (
    <div className="space-y-3">
      {items.map((tx) => (
        <div
          key={tx.id}
          className={[
            'rounded-xl border px-3 py-2 text-sm text-white/80 transition hover:border-white/20 hover:bg-white/5',
            STATUS_STYLE[tx.status],
          ].join(' ')}
        >
          <div className="flex items-start gap-3">
            <StatusIcon status={tx.status} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{tx.summary}</p>
              <p className="text-xs text-white/60">
                {STATUS_LABEL[tx.status]} · {tx.section}.{tx.method}
              </p>
              {tx.hash ? (
                <p className="mt-1 font-mono text-[11px] text-white/50">hash: {tx.hash.slice(0, 24)}…</p>
              ) : null}
              <p className="mt-1 text-[11px] text-white/40">
                Updated {new Date(tx.updatedAt).toLocaleTimeString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismissTx(tx.id)}
              className="rounded-full border border-white/10 p-1 text-white/60 transition hover:border-white/30 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  if (variant === 'panel') {
    return (
      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-white/60">Transactions</p>
            <h2 className="text-lg font-semibold text-white">Live status feed</h2>
          </div>
          <button
            type="button"
            onClick={() => clearTxHistory()}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 transition hover:border-white/40 hover:text-white"
          >
            Clear all
          </button>
        </header>
        {listContent}
      </section>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      {listContent}
    </div>
  )
}
`,

  // components/polkadot-ui/AccountInfo.tsx
  polkadotUiAccountInfo: `"use client"
import { useEffect, useState } from 'react'
import { formatBalance } from '@polkadot/util'
import { Copy } from 'lucide-react'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

interface AccountStats {
  free: string
  reserved: string
  miscFrozen: string
  feeFrozen: string
}

function truncate(address: string) {
  return \`\${address.slice(0, 6)}…\${address.slice(-6)}\`
}

export function AccountInfo() {
  const { api, selectedAccount, tokenSymbol } = usePolkadotUI()
  const [stats, setStats] = useState<AccountStats | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchStats() {
      if (!api || !selectedAccount) return
      const { data } = await api.query.system.account(selectedAccount.address)
      if (cancelled) return
      setStats({
        free: formatBalance(data.free, { withSi: true }),
        reserved: formatBalance(data.reserved, { withSi: true }),
        miscFrozen: formatBalance(data.miscFrozen, { withSi: true }),
        feeFrozen: formatBalance(data.feeFrozen, { withSi: true }),
      })
    }
    fetchStats().catch((error) => console.error('[AccountInfo] Failed to fetch account data', error))
    return () => {
      cancelled = true
    }
  }, [api, selectedAccount])

  if (!selectedAccount) {
    return null
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedAccount.address)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 1200)
    } catch (error) {
      console.error('Failed to copy address', error)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-purple-600/30 bg-purple-950/30 p-4 text-sm text-purple-100">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-purple-300/80">Address</p>
          <p className="font-mono text-sm">{truncate(selectedAccount.address)}</p>
          <p className="text-xs text-purple-200/70">{selectedAccount.meta.name || 'Unknown account'}</p>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-md border border-purple-500/40 px-3 py-1 text-xs font-medium text-purple-50 transition hover:bg-purple-500/20"
        >
          <Copy className="h-3.5 w-3.5" />
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {stats ? (
        <dl className="grid gap-3 rounded-lg bg-purple-900/30 p-3 text-xs text-purple-100/90">
          <div className="flex items-center justify-between">
            <dt className="text-purple-200/70">Free</dt>
            <dd className="font-mono text-purple-50">{stats.free}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-purple-200/70">Reserved</dt>
            <dd className="font-mono text-purple-50">{stats.reserved}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-purple-200/70">Frozen</dt>
            <dd className="font-mono text-purple-50">{stats.miscFrozen}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-purple-200/70">Fees</dt>
            <dd className="font-mono text-purple-50">{stats.feeFrozen}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-xs text-purple-200/60">Loading on-chain balances for {tokenSymbol}…</p>
      )}
    </div>
  )
}
`,

  // components/polkadot-ui/BalanceDisplay.tsx
  polkadotUiBalanceDisplay: `"use client"
import { useEffect, useState } from 'react'
import { formatBalance } from '@polkadot/util'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

interface BalanceDisplayProps {
  address?: string
  title?: string
  className?: string
}

export function BalanceDisplay({ address, title = 'Available balance', className }: BalanceDisplayProps) {
  const { api, selectedAccount, tokenSymbol } = usePolkadotUI()
  const [balance, setBalance] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchBalance(target: string) {
      if (!api) return
      const { data } = await api.query.system.account(target)
      if (cancelled) return
      setBalance(formatBalance(data.free, { forceUnit: '-', withUnit: tokenSymbol }))
    }

    const target = address || selectedAccount?.address
    if (!target) return
    fetchBalance(target).catch((error) => console.error('[BalanceDisplay] Fetch error', error))

    const interval = setInterval(() => {
      fetchBalance(target).catch(() => undefined)
    }, 12_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [address, api, selectedAccount, tokenSymbol])

  if (!address && !selectedAccount) {
    return null
  }

  return (
    <div
      className={[
        'flex flex-col rounded-lg border border-purple-600/30 bg-purple-900/30 px-4 py-3 text-sm text-purple-100 shadow-sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="text-xs uppercase tracking-wide text-purple-300/80">{title}</span>
      <span className="mt-1 text-lg font-semibold text-white">{balance ?? 'Loading…'}</span>
    </div>
  )
}
`,

  // components/polkadot-ui/AddressInput.tsx
  polkadotUiAddressInput: `"use client"
import { useMemo, useState } from 'react'
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

interface AddressInputProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
  placeholder?: string
  allowMultichain?: boolean
}

export function AddressInput({
  value,
  onChange,
  label = 'Address',
  placeholder = 'Enter an address',
  allowMultichain = false,
}: AddressInputProps) {
  const { tokenSymbol } = usePolkadotUI()
  const [internalValue, setInternalValue] = useState(value ?? '')
  const [isFocused, setIsFocused] = useState(false)

  const currentValue = value ?? internalValue

  const validation = useMemo(() => {
    if (!currentValue) return null
    try {
      const decoded = decodeAddress(currentValue)
      const normalized = encodeAddress(decoded, allowMultichain ? undefined : 0)
      const isSame = normalized === currentValue
      return {
        ok: true,
        normalized,
        info: isSame ? 'Valid address' : 'Normalized address format',
      }
    } catch (error) {
      return {
        ok: false,
        error: (error as Error).message,
      }
    }
  }, [allowMultichain, currentValue])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value.trim()
    setInternalValue(next)
    onChange?.(next)
  }

  return (
    <label className="block text-sm text-purple-100">
      <span className="text-xs uppercase tracking-wide text-purple-300/80">{label}</span>
      <div
        className={[
          'mt-1 flex items-center gap-2 rounded-md border px-3 py-2 transition focus-within:border-purple-400',
          validation?.ok === false
            ? 'border-rose-500/60 bg-rose-500/10'
            : isFocused
            ? 'border-purple-400 bg-purple-900/40'
            : 'border-purple-500/40 bg-purple-900/20',
        ].join(' ')}
      >
        <input
          value={currentValue}
          onChange={handleChange}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-purple-200/50"
        />
        <span className="rounded-md border border-purple-500/40 px-2 py-1 text-[10px] uppercase tracking-wide text-purple-200/80">
          {tokenSymbol}
        </span>
      </div>
      {validation ? (
        <p
          className={[
            'mt-1 text-xs',
            validation.ok ? 'text-emerald-300/80' : 'text-rose-300/80',
          ].join(' ')}
        >
          {validation.ok ? validation.info : validation.error}
        </p>
      ) : (
        <p className="mt-1 text-xs text-purple-300/60">Supports SS58 or EVM addresses</p>
      )}
    </label>
  )
}
`,

  // components/polkadot-ui/AmountInput.tsx
  polkadotUiAmountInput: `"use client"
import { useEffect, useState } from 'react'
import { usePolkadotUI } from '@/providers/PolkadotUIProvider'

interface AmountInputProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
  decimals?: number
  disabled?: boolean
}

export function AmountInput({
  value,
  onChange,
  label = 'Amount',
  decimals,
  disabled = false,
}: AmountInputProps) {
  const { tokenSymbol, tokenDecimals } = usePolkadotUI()
  const [internal, setInternal] = useState(value ?? '')
  const precision = decimals ?? tokenDecimals

  useEffect(() => {
    if (value !== undefined) {
      setInternal(value)
    }
  }, [value])

  const currentValue = value ?? internal

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let raw = event.target.value.replace(',', '.')
    const regex = new RegExp(\`^\\\\d*(?:\\\\.\\\\d{0,\${precision}})?$\`)
    if (raw === '' || regex.test(raw)) {
      setInternal(raw)
      onChange?.(raw)
    }
  }

  return (
    <label className="block text-sm text-purple-100">
      <span className="text-xs uppercase tracking-wide text-purple-300/80">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-md border border-purple-500/40 bg-purple-900/20 px-3 py-2">
        <input
          value={currentValue}
          onChange={handleChange}
          inputMode="decimal"
          disabled={disabled}
          className="flex-1 bg-transparent text-lg font-semibold text-white outline-none placeholder:text-purple-200/50 disabled:opacity-50"
          placeholder="0.0"
        />
        <span className="rounded-md border border-purple-500/40 px-2 py-1 text-xs uppercase tracking-wide text-purple-200/80">
          {tokenSymbol}
        </span>
      </div>
      <p className="mt-1 text-xs text-purple-300/60">Up to {precision} decimal places</p>
    </label>
  )
}
`,

  // components/polkadot-ui/SelectToken.tsx
  polkadotUiSelectToken: `"use client"
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface TokenOption {
  symbol: string
  name: string
  chainId: string
  decimals: number
}

interface SelectTokenProps {
  tokens?: TokenOption[]
  value?: TokenOption
  onChange?: (token: TokenOption) => void
}

const DEFAULT_TOKENS: TokenOption[] = [
  {
    symbol: 'DOT',
    name: 'Polkadot',
    chainId: 'polkadot',
    decimals: 10,
  },
  {
    symbol: 'KSM',
    name: 'Kusama',
    chainId: 'kusama',
    decimals: 12,
  },
  {
    symbol: 'PASEO',
    name: 'Paseo Testnet',
    chainId: 'paseo',
    decimals: 12,
  },
]

export function SelectToken({ tokens = DEFAULT_TOKENS, value, onChange }: SelectTokenProps) {
  const [open, setOpen] = useState(false)
  const active = value ?? tokens[0]

  return (
    <div className="relative w-full max-w-xs">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-md border border-purple-500/40 bg-purple-900/30 px-3 py-2 text-sm text-purple-100 transition hover:border-purple-400"
      >
        <span className="flex flex-col text-left">
          <span className="text-sm font-semibold text-white">{active.symbol}</span>
          <span className="text-xs text-purple-200/70">{active.name}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-purple-200" />
      </button>
      {open ? (
        <div className="absolute z-10 mt-2 w-full rounded-md border border-purple-600/30 bg-purple-950/90 shadow-xl backdrop-blur">
          <ul className="max-h-60 overflow-y-auto text-sm text-purple-100">
            {tokens.map((token) => (
              <li
                key={token.chainId}
                className="cursor-pointer px-3 py-2 transition hover:bg-purple-600/30"
                onClick={() => {
                  onChange?.(token)
                  setOpen(false)
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{token.symbol}</span>
                  <span className="text-xs text-purple-200/70">{token.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
`,

  polkadotUiSelectTokenDialog: `"use client"
import { X } from 'lucide-react'
import type { ChainAsset } from '@/lib/chains'

interface SelectTokenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokens: ChainAsset[]
  selectedToken: ChainAsset | null
  onSelect: (token: ChainAsset) => void
}

export function SelectTokenDialog({ open, onOpenChange, tokens, selectedToken, onSelect }: SelectTokenDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-slate-950/95 p-6 text-white shadow-lg">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-white/50">Token catalog</p>
            <h2 className="text-lg font-semibold text-white">Select token</h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-white/10 p-2 text-white/60 transition hover:border-white/30 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <ul className="max-h-72 space-y-2 overflow-y-auto pr-1 text-sm">
          {tokens.map((token) => {
            const isActive = token.key === selectedToken?.key
            return (
              <li key={token.key}>
                <button
                  type="button"
                  onClick={() => onSelect(token)}
                  className={[
                    'flex w-full flex-col rounded-xl border px-4 py-3 text-left transition',
                    isActive
                      ? 'border-purple-500 bg-purple-600/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  <span className="text-sm font-semibold text-white">{token.symbol}</span>
                  <span className="text-xs text-white/50">{token.name}</span>
                  <span className="text-[11px] text-white/40">Decimals: {token.decimals}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
`,

  // components/polkadot-ui/index.ts
  polkadotUiIndex: `export { ConnectWallet } from './ConnectWallet'
export { NetworkIndicator } from './NetworkIndicator'
export { RequireConnection } from './RequireConnection'
export { RequireAccount } from './RequireAccount'
export { TxButton } from './TxButton'
export { TxNotification } from './TxNotification'
export { AccountInfo } from './AccountInfo'
export { BalanceDisplay } from './BalanceDisplay'
export { AddressInput } from './AddressInput'
export { AmountInput } from './AmountInput'
export { SelectToken } from './SelectToken'
export { SelectTokenDialog } from './SelectTokenDialog'
export { usePolkadotUI } from '@/providers/PolkadotUIProvider'
`,

  // components/PolkadotSignInButton.tsx template  
  polkadotSignInButton: `"use client"
import { useState } from 'react'
import { signIn } from 'next-auth/react'

// Declare Polkadot extension types (injected by browser extension)
declare global {
  interface Window {
    injectedWeb3?: any
  }
}

export default function PolkadotSignInButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')

  async function handleSignIn() {
    console.log('🔵 Button clicked - starting sign-in flow')
    setLoading(true)
    setError('')
    setDebugInfo('Loading Polkadot library...')
    
    try {
      // Load Polkadot extension library dynamically
      console.log('🔵 Attempting to import @polkadot/extension-dapp')
      const polkadotDapp = await import('@polkadot/extension-dapp').catch(err => {
        console.error('🔴 Import error:', err)
        return null
      })
      
      if (!polkadotDapp) {
        const errMsg = 'Failed to load Polkadot library. Please open in new tab.'
        console.error('🔴', errMsg)
        setError(errMsg)
        setLoading(false)
        setDebugInfo('Import failed')
        return
      }
      
      console.log('✅ Polkadot library loaded successfully')
      setDebugInfo('Polkadot library loaded, requesting extension access...')
      
      const { web3Accounts, web3Enable } = polkadotDapp
      
      console.log('🔵 Calling web3Enable...')
      const extensions = await web3Enable('Mobius AI')
      console.log('✅ web3Enable result:', extensions)
      
      if (!extensions.length) {
        const errMsg = 'Please install Polkadot{.js} extension from https://polkadot.js.org/extension/'
        console.error('🔴', errMsg)
        setError(errMsg)
        setLoading(false)
        setDebugInfo('No extension found')
        return
      }
      
      setDebugInfo('Extension found, getting accounts...')
      console.log('🔵 Calling web3Accounts...')
      const accounts = await web3Accounts()
      console.log('✅ Accounts:', accounts)
      
      if (!accounts || !accounts.length) {
        const errMsg = 'No accounts found. Please add an account to your Polkadot wallet.'
        console.error('🔴', errMsg)
        setError(errMsg)
        setLoading(false)
        setDebugInfo('No accounts')
        return
      }
      
      const account = accounts[0]
      const address = account.address
      console.log('✅ Using account:', address)
      setDebugInfo(\`Using account: \${address.substring(0, 8)}...\`)

      console.log('🔵 Fetching nonce...')
      const nonceRes = await fetch('/api/polka/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })
      if (!nonceRes.ok) {
        const errText = await nonceRes.text()
        console.error('🔴 Failed to get nonce:', errText)
        throw new Error(\`Failed to get nonce: \${errText}\`)
      }
      const { challenge } = await nonceRes.json()
      console.log('✅ Got challenge:', challenge.substring(0, 20) + '...')
      setDebugInfo('Requesting signature...')

      console.log('🔵 Requesting signature from extension...')
      const injector = extensions[0]
      const signRaw = injector?.signer?.signRaw
      if (!signRaw) {
        console.error('🔴 Signer not available')
        throw new Error('Signer not available in extension')
      }

      const { signature } = await signRaw({
        address,
        data: challenge,
        type: 'bytes'
      })
      console.log('✅ Got signature:', signature.substring(0, 20) + '...')
      setDebugInfo('Authenticating...')

      console.log('🔵 Calling signIn...')
      const result = await signIn('polkadot', {
        address,
        challenge,
        signature,
        redirect: false
      })
      console.log('✅ SignIn result:', result)

      if (result?.error) {
        console.error('🔴 Authentication failed:', result.error)
        setError(\`Authentication failed: \${result.error}\`)
        setLoading(false)
        setDebugInfo('Auth failed')
      } else if (result?.ok) {
        console.log('✅ Authentication successful! Reloading page...')
        setDebugInfo('Success! Reloading...')
        // Success! Reload the page to refresh session
        window.location.reload()
      }
    } catch (err: any) {
      console.error('🔴 Sign-in error:', err)
      const errMsg = err?.message || 'Failed to sign in. Try "Open in New Tab" button above.'
      setError(errMsg)
      setLoading(false)
      setDebugInfo(\`Error: \${errMsg.substring(0, 50)}\`)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full"
      >
        {loading ? 'Connecting...' : 'Sign in with Polkadot Wallet'}
      </button>
      
      {debugInfo && !error && (
        <p className="text-sm text-blue-400 text-center">{debugInfo}</p>
      )}
      
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded p-3 w-full">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      
      <p className="text-xs text-gray-500 text-center">
        💡 If button doesn't work, use "Open in New Tab ↗" above
      </p>
      
      <div className="text-xs text-gray-600 text-center mt-2">
        <p>Don't have Polkadot extension?</p>
        <a 
          href="https://polkadot.js.org/extension/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 underline"
        >
          Install Polkadot.js Extension
        </a>
      </div>
    </div>
  )
}
`,

  // app/api/polka/nonce/route.ts template
  polkaNonceRoute: `import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json()
    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const challenge = \`Sign this message to authenticate with Mobius AI: \${Date.now()}\`
    const value = crypto.createHash('sha256').update(challenge).digest('base64')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    await prisma.nonce.create({
      data: {
        value,
        subject: address,
        expiresAt
      }
    })

    return NextResponse.json({ challenge })
  } catch (err: any) {
    console.error('Nonce generation error:', err)
    return NextResponse.json({ error: 'Failed to generate nonce' }, { status: 500 })
  }
}
`,

  // app/api/auth/[...nextauth]/route.ts template
  nextAuthRoute: `import NextAuth from 'next-auth'
import { authOptions } from '@/lib/authConfig'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
`,

  // Example React Query v5 hook - demonstrates correct syntax
  exampleReactQueryHook: `/**
 * Example React Query v5 Hook
 * 
 * This template demonstrates the CORRECT way to use React Query v5.
 * Reference this pattern when building data-fetching hooks.
 * 
 * Key changes from v4 to v5:
 * - useMutation: Pass options object with mutationFn
 * - useQuery: Pass options object with queryKey and queryFn
 * - Use isPending instead of isLoading
 * - invalidateQueries uses object syntax
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Example: Query hook (GET data)
export function useExampleQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: ['example', 'data'],
    queryFn: async () => {
      const response = await fetch('/api/example')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
    enabled,
    staleTime: 60000, // 1 minute
  })
}

// Example: Mutation hook (POST/PUT/DELETE data)
export function useExampleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; value: string }) => {
      const response = await fetch('/api/example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to mutate')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['example'] })
    },
    onError: (error) => {
      console.error('Mutation failed:', error)
    },
  })
}

// Example component usage:
/**
 * function ExampleComponent() {
 *   const { data, isPending, isError, error } = useExampleQuery()
 *   const mutation = useExampleMutation()
 * 
 *   if (isPending) return <div>Loading...</div>
 *   if (isError) return <div>Error: {error.message}</div>
 * 
 *   return (
 *     <div>
 *       <pre>{JSON.stringify(data, null, 2)}</pre>
 *       <button
 *         onClick={() => mutation.mutate({ name: 'test', value: '123' })}
 *         disabled={mutation.isPending}
 *       >
 *         {mutation.isPending ? 'Submitting...' : 'Submit'}
 *       </button>
 *     </div>
 *   )
 * }
 */
`
}

/**
 * Files that should ALWAYS use templates (AI should NOT generate these)
 */
export const IMMUTABLE_FILES = [
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
  'providers/PolkadotUIProvider.tsx',
  'providers/PreferenceStore.ts',
  'lib/projectConfig.ts',
  'components/forms/MintNftForm.tsx',
  'components/wallet/WalletPanel.tsx',
  'components/wallet/TxHistoryTable.tsx',
  'components/charts/NetworkHealth.tsx',
  'hooks/usePolkadotUI.ts',
  'hooks/usePreferenceStore.ts',
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
  'components/ui/tabs.tsx',
  'components/ui/card.tsx',
  'lib/chains.ts',
  'lib/reactQueryCompat.ts',
  'lib/tx/submit.ts',
  'lib/examples/useReactQueryExample.ts',
  // Removed: Prisma, NextAuth, API routes (not needed for static export)
]

/**
 * Files that AI can generate but should be validated/fixed
 */
export const VALIDATED_FILES = [
  'app/**/*.tsx',
  'app/**/*.ts',
  'components/**/*.tsx',
  'components/**/*.ts',
  'lib/**/*.ts'
]

/**
 * Get template for a file
 */
export function getTemplate(filePath: string): string | object | null {
  if (filePath === 'package.json') return TEMPLATES.packageJson
  if (filePath === 'tsconfig.json') return TEMPLATES.tsconfigJson
  if (filePath === 'next.config.mjs') return TEMPLATES.nextConfigMjs
  if (filePath === 'tailwind.config.ts') return TEMPLATES.tailwindConfig
  if (filePath === 'postcss.config.js') return TEMPLATES.postcssConfig
  if (filePath === 'app/globals.css') return TEMPLATES.globalsCss
  if (filePath === 'app/layout.tsx') return TEMPLATES.appRootLayout
  if (filePath === 'app/page.tsx') return TEMPLATES.appMarketingPage
  if (filePath === 'app/experience/page.tsx') return TEMPLATES.appExperiencePage
  if (filePath === 'providers/AppProviders.tsx') return TEMPLATES.appProviders
  if (filePath === 'providers/PolkadotUIProvider.tsx') return TEMPLATES.polkadotUiProvider
  if (filePath === 'providers/PreferenceStore.ts') return TEMPLATES.preferenceStore
  if (filePath === 'components/layout/AppShell.tsx') return TEMPLATES.layoutAppShell
  if (filePath === 'components/layout/NavItems.ts') return TEMPLATES.layoutNavItems
  if (filePath === 'components/forms/MintNftForm.tsx') return TEMPLATES.formMintNft
  if (filePath === 'components/wallet/WalletPanel.tsx') return TEMPLATES.walletPanel
  if (filePath === 'components/wallet/TxHistoryTable.tsx') return TEMPLATES.walletTxHistory
  if (filePath === 'components/charts/NetworkHealth.tsx') return TEMPLATES.chartNetworkHealth
  if (filePath === 'hooks/usePolkadotUI.ts') return TEMPLATES.hooksUsePolkadotUI
  if (filePath === 'hooks/usePreferenceStore.ts') return TEMPLATES.hooksUsePreferenceStore
  if (filePath === 'components/polkadot-ui/index.ts') return TEMPLATES.polkadotUiIndex
  if (filePath === 'components/polkadot-ui/ConnectWallet.tsx') return TEMPLATES.polkadotUiConnectWallet
  if (filePath === 'components/polkadot-ui/NetworkIndicator.tsx') return TEMPLATES.polkadotUiNetworkIndicator
  if (filePath === 'components/polkadot-ui/RequireConnection.tsx') return TEMPLATES.polkadotUiRequireConnection
  if (filePath === 'components/polkadot-ui/RequireAccount.tsx') return TEMPLATES.polkadotUiRequireAccount
  if (filePath === 'components/polkadot-ui/TxButton.tsx') return TEMPLATES.polkadotUiTxButton
  if (filePath === 'components/polkadot-ui/TxNotification.tsx') return TEMPLATES.polkadotUiTxNotification
  if (filePath === 'components/polkadot-ui/AccountInfo.tsx') return TEMPLATES.polkadotUiAccountInfo
  if (filePath === 'components/polkadot-ui/BalanceDisplay.tsx') return TEMPLATES.polkadotUiBalanceDisplay
  if (filePath === 'components/polkadot-ui/AddressInput.tsx') return TEMPLATES.polkadotUiAddressInput
  if (filePath === 'components/polkadot-ui/AmountInput.tsx') return TEMPLATES.polkadotUiAmountInput
  if (filePath === 'components/polkadot-ui/SelectToken.tsx') return TEMPLATES.polkadotUiSelectToken
  if (filePath === 'components/polkadot-ui/SelectTokenDialog.tsx') return TEMPLATES.polkadotUiSelectTokenDialog
  if (filePath === 'components/ui/tabs.tsx') return TEMPLATES.uiTabs
  if (filePath === 'components/ui/card.tsx') return TEMPLATES.uiCard
  if (filePath === 'lib/projectConfig.ts') return TEMPLATES.projectConfig
  if (filePath === 'lib/chains.ts') return TEMPLATES.chainConfig
  if (filePath === 'lib/reactQueryCompat.ts') return TEMPLATES.reactQueryCompat
  if (filePath === 'lib/tx/submit.ts') return TEMPLATES.txHelpers
  if (filePath === 'lib/examples/useReactQueryExample.ts') return TEMPLATES.exampleReactQueryHook
  
  return null
}

/**
 * Check if a file should use template (immutable)
 */
export function isImmutable(filePath: string): boolean {
  return IMMUTABLE_FILES.some(immutable => 
    filePath === immutable || filePath.endsWith(`/${immutable}`)
  )
}

