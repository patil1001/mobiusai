import Link from 'next/link'

export default function SignUpPage() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md glass rounded-xl p-8">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="text-sm text-white/70 mt-1">Get started with MobiusAI</p>
        <form className="mt-6 space-y-4">
          <input className="w-full rounded-md bg-black/40 border border-white/10 px-4 py-3 outline-none" placeholder="Name" />
          <input className="w-full rounded-md bg-black/40 border border-white/10 px-4 py-3 outline-none" placeholder="Email" type="email" />
          <input className="w-full rounded-md bg-black/40 border border-white/10 px-4 py-3 outline-none" placeholder="Password" type="password" />
          <button className="w-full px-4 py-3 rounded-md bg-primary text-black font-semibold">Create account</button>
        </form>
        <p className="text-sm text-white/60 mt-4">
          Already have an account? <Link className="text-primary" href="/signin">Sign in</Link>
        </p>
      </div>
    </main>
  )
}

