"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import NextDynamic from 'next/dynamic'
const PolkadotSignInButton = NextDynamic(() => import('@/components/PolkadotSignInButton'), { ssr: false })
export const dynamic = 'force-dynamic'

export default function SignInPage() {
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    if (!email || !password) return
    const res = await signIn('credentials', { redirect: false, email, password, callbackUrl: '/dashboard' })
    if (res?.ok) router.push(res.url || '/dashboard')
  }
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md glass rounded-xl p-8">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-sm text-white/70 mt-1">Welcome back to MobiusAI</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input name="email" className="w-full rounded-md bg-black/40 border border-white/10 px-4 py-3 outline-none" placeholder="Email" type="email" />
          <input name="password" className="w-full rounded-md bg-black/40 border border-white/10 px-4 py-3 outline-none" placeholder="Password" type="password" />
          <button className="w-full px-4 py-3 rounded-md bg-primary text-black font-semibold">Sign in</button>
        </form>
        <div className="mt-4">
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-white/50">Or continue with</span>
            </div>
          </div>
          <PolkadotSignInButton />
        </div>
        <p className="text-sm text-white/60 mt-4">
          No account? <Link className="text-primary" href="/signup">Create one</Link>
        </p>
      </div>
    </main>
  )
}

