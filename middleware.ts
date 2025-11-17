import { NextResponse } from 'next/server'

export function middleware(req: Request) {
  const url = new URL(req.url)
  const isDashboard = url.pathname.startsWith('/dashboard')
  const hasSession = (req as any).cookies?.get?.('next-auth.session-token') || (req as any).cookies?.get?.('__Secure-next-auth.session-token')
  if (isDashboard && !hasSession) {
    url.pathname = '/signin'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard'] }

