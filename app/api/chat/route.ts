import { NextRequest } from 'next/server'
import { getGroqClient, DEFAULT_MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const messages = (body?.messages ?? []).map((m: any) => ({ role: m.role, content: m.content }))
  const client = getGroqClient()

  try {
    const chat = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are MobiusAI, an expert Polkadot dApp architect and code generator.' },
        ...messages
      ],
      temperature: 0.3
    })
    const reply = chat.choices?.[0]?.message?.content ?? ''
    return new Response(JSON.stringify({ reply }), { headers: { 'content-type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'Chat failed' }), { status: 500 })
  }
}

