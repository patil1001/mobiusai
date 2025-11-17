import Link from 'next/link'

export default function SignInPage() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md glass rounded-xl p-8">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-sm text-white/70 mt-1">Welcome back to MobiusAI</p>
        <form className="mt-6 space-y-4">
          <input className="w-full rounded-md bg-black/40 border border-white/10 px-4 py-3 outline-none" placeholder="Email" type="email" />
          <input className="w-full rounded-md bg-black/40 border border-white/10 px-4 py-3 outline-none" placeholder="Password" type="password" />
          <button className="w-full px-4 py-3 rounded-md bg-primary text-black font-semibold">Sign in</button>
        </form>
        <p className="text-sm text-white/60 mt-4">
          No account? <Link className="text-primary" href="/signup">Create one</Link>
        </p>
      </div>
    </main>
  )
}

