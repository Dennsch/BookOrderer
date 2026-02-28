import { NextResponse } from 'next/server'
import { GeminiService } from '@/services/geminiService'
import { getConfig } from '@/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = getConfig()
    
    if (!config.gemini.apiKey) {
      return NextResponse.json(
        { error: 'Google Gemini API key not configured' },
        { status: 500 }
      )
    }

    const geminiService = new GeminiService(config.gemini.apiKey)
    const storybooks = await geminiService.listStorybooks()

    return NextResponse.json({
      storybooks,
      count: storybooks.length
    })
  } catch (error) {
    console.error('Error fetching storybooks:', error)
    return NextResponse.json({ error: 'Failed to fetch storybooks' }, { status: 500 })
  }
}
