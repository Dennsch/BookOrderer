import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { FileService } from '@/services/fileService'
import { getConfig } from '@/config'

export async function GET(request: NextRequest) {
  try {
    const config = getConfig()
    const booksPath = path.resolve(config.app.booksPath)
    
    console.log(`Scanning books directory: ${booksPath}`)
    
    // Scan directory for PDF files
    const fileInfos = await FileService.scanDirectory(booksPath, config.app.allowedExtensions)
    
    // Validate PDF files
    const validBooks = []
    for (const fileInfo of fileInfos) {
      const isValidPDF = await FileService.validatePDF(fileInfo.path)
      
      if (isValidPDF) {
        validBooks.push({
          name: fileInfo.name,
          path: fileInfo.path,
          size: fileInfo.size,
          sizeFormatted: FileService.formatFileSize(fileInfo.size),
          md5Hash: fileInfo.md5Hash
        })
      } else {
        console.warn(`Invalid PDF file detected: ${fileInfo.name}`)
      }
    }

    return NextResponse.json({
      success: true,
      books: validBooks,
      count: validBooks.length,
      scannedPath: booksPath
    })
  } catch (error: any) {
    console.error('Error scanning books:', error)
    return NextResponse.json(
      { error: `Failed to scan books directory: ${error.message}` },
      { status: 500 }
    )
  }
}