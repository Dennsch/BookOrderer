import { NextResponse } from 'next/server'
import { GeminiService } from '@/services/geminiService'
import { getConfig } from '@/config'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const config = getConfig()
    
    if (!config.gemini.apiKey) {
      return NextResponse.json(
        { error: 'Google Gemini API key not configured' },
        { status: 500 }
      )
    }

    const geminiService = new GeminiService(config.gemini.apiKey)
    
    // Generate the full storybook content
    const storybook = await geminiService.generateStorybook(params.id)
    
    // Generate PDF
    const pdfBuffer = await geminiService.generatePDF(storybook)
    
    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${storybook.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error downloading storybook:', error)
    return NextResponse.json({ error: 'Failed to download storybook' }, { status: 500 })
  }
}

