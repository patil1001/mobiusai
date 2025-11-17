import OpenAI from 'openai'

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  return new OpenAI({
    baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    apiKey
  })
}

export const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

