"use client"

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
      aria-controls={`tab-panel-${value}`}
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

