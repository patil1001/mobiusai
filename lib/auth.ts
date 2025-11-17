// NOTE: This file contains client-side localStorage helpers AND re-exports server-side auth
// The authOptions re-export is safe because it's only executed when actually imported

export type User = {
  name: string
  email: string
  avatarUrl?: string
}

const KEY = 'mobius.user'

export function getUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  return raw ? (JSON.parse(raw) as User) : null
}

export function setUser(user: User) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(user))
}

export function clearUser() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}

export function isSignedIn(): boolean {
  return !!getUser()
}

// Re-export authOptions from authConfig for compatibility with example code in aiPrompts.ts
// This is safe because re-exports don't execute the module code until actually used
export { authOptions } from './authConfig'

