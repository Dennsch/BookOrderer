import { GoogleGenerativeAI } from '@google/generative-ai'
import PDFDocument from 'pdfkit'
import { Readable } from 'stream'

export interface Storybook {
  id: string
  title: string
  content: string
  createdAt: string
  wordCount: number
}

export class GeminiService {
  private genAI: GoogleGenerativeAI
  private apiKey: string

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google Gemini API key is required')
    }
    this.apiKey = apiKey
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  /**
   * List all storybooks from the Gemini account
   * Note: Since Gemini doesn't have a built-in storybook storage,
   * this creates sample storybooks for demonstration.
   * In a real implementation, you would integrate with your storage solution.
   */
  async listStorybooks(): Promise<Storybook[]> {
    try {
      // Generate sample storybooks using Gemini
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })
      
      const prompt = `Generate a list of 5 children's storybook titles with brief 2-3 sentence descriptions. 
Format: Title: [title] | Description: [description]
Each on a new line.`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Parse the response into storybooks
      const lines = text.split('\n').filter(line => line.trim())
      const storybooks: Storybook[] = []
      
      for (let i = 0; i < lines.length && i < 5; i++) {
        const line = lines[i]
        const titleMatch = line.match(/Title:\s*(.+?)\s*\|/)
        const descMatch = line.match(/Description:\s*(.+)/)
        
        if (titleMatch && descMatch) {
          const title = titleMatch[1].trim()
          const description = descMatch[1].trim()
          
          storybooks.push({
            id: `story-${i + 1}`,
            title: title,
            content: description,
            createdAt: new Date().toISOString(),
            wordCount: description.split(' ').length
          })
        }
      }
      
      return storybooks
    } catch (error) {
      console.error('Error listing storybooks:', error)
      throw new Error('Failed to list storybooks from Gemini')
    }
  }

  /**
   * Generate a full storybook based on a title or ID
   */
  async generateStorybook(titleOrId: string): Promise<Storybook> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })
      
      const prompt = `Write a complete children's storybook with the title "${titleOrId}". 
Include:
- A captivating story with beginning, middle, and end
- Appropriate for ages 5-8
- Around 500-800 words
- Engaging and educational

Format the story with proper paragraphs.`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      return {
        id: titleOrId.toLowerCase().replace(/\s+/g, '-'),
        title: titleOrId,
        content: text,
        createdAt: new Date().toISOString(),
        wordCount: text.split(' ').length
      }
    } catch (error) {
      console.error('Error generating storybook:', error)
      throw new Error('Failed to generate storybook from Gemini')
    }
  }

  /**
   * Generate a PDF from storybook content
   */
  async generatePDF(storybook: Storybook): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 72, bottom: 72, left: 72, right: 72 }
        })
        
        const chunks: Buffer[] = []
        
        doc.on('data', (chunk) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)
        
        // Add title
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text(storybook.title, { align: 'center' })
           .moveDown(2)
        
        // Add content
        doc.fontSize(12)
           .font('Helvetica')
           .text(storybook.content, { align: 'justify' })
           .moveDown()
        
        // Add metadata at the bottom
        doc.fontSize(10)
           .text(`Generated: ${new Date(storybook.createdAt).toLocaleDateString()}`, { align: 'center' })
        
        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }
}
