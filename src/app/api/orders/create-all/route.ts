import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { ProdigiService } from '@/services/prodigiService'
import { FileService } from '@/services/fileService'
import { getConfig, validateConfig } from '@/config'

export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    const configValidation = validateConfig()
    if (!configValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Configuration validation failed', 
          details: configValidation.errors 
        },
        { status: 500 }
      )
    }

    const config = getConfig()
    
    // Initialize Prodigi service
    const prodigiService = new ProdigiService({
      apiKey: config.prodigi.apiKey,
      apiUrl: config.prodigi.apiUrl,
      environment: config.prodigi.environment
    })

    const booksPath = path.resolve(config.app.booksPath)
    
    console.log(`Processing books from: ${booksPath}`)
    
    // Scan directory for PDF files
    const fileInfos = await FileService.scanDirectory(booksPath, config.app.allowedExtensions)

    if (fileInfos.length === 0) {
      return NextResponse.json(
        { error: 'No PDF files found in books directory' },
        { status: 404 }
      )
    }

    // Validate PDF files
    const validBooks = []
    for (const fileInfo of fileInfos) {
      const isValidPDF = await FileService.validatePDF(fileInfo.path)
      
      if (isValidPDF) {
        validBooks.push(fileInfo)
      } else {
        console.warn(`Skipping invalid PDF file: ${fileInfo.name}`)
      }
    }

    if (validBooks.length === 0) {
      return NextResponse.json(
        { error: 'No valid PDF files found in books directory' },
        { status: 404 }
      )
    }

    const results = []

    // Process each valid PDF file
    for (const bookFile of validBooks) {
      const bookName = path.parse(bookFile.name).name

      try {
        console.log(`Processing book: ${bookName} (${FileService.formatFileSize(bookFile.size)})`)
        
        const order = await prodigiService.createBookOrder(
          bookFile.path,
          bookName,
          config.shipping.defaultAddress
        )

        results.push({
          bookName,
          fileName: bookFile.name,
          fileSize: FileService.formatFileSize(bookFile.size),
          success: true,
          orderId: order.id,
          status: order.status.stage,
          created: order.created
        })

        console.log(`✅ Successfully created order ${order.id} for ${bookName}`)
      } catch (error: any) {
        console.error(`❌ Failed to create order for ${bookName}:`, error.message)
        
        results.push({
          bookName,
          fileName: bookFile.name,
          fileSize: FileService.formatFileSize(bookFile.size),
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalProcessed: validBooks.length,
        successCount,
        failureCount,
        successRate: `${Math.round((successCount / validBooks.length) * 100)}%`
      },
      processedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error processing books:', error)
    return NextResponse.json(
      { error: `Failed to process books: ${error.message}` },
      { status: 500 }
    )
  }
}