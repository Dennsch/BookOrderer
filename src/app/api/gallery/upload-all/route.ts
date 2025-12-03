import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { ImageGalleryService, GalleryUploadResult } from '@/services/imageGalleryService'
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
    
    // Initialize Image Gallery service
    const galleryService = new ImageGalleryService({
      galleryPath: config.gallery.galleryPath,
      imageFormat: config.gallery.imageFormat,
      imageQuality: config.gallery.imageQuality,
      maxPages: config.gallery.maxPages
    })

    const booksPath = path.resolve(config.app.booksPath)
    
    console.log(`Processing books from: ${booksPath}`)
    console.log(`Gallery path: ${config.gallery.galleryPath}`)
    
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

    const results: GalleryUploadResult[] = []

    // Process each valid PDF file
    for (const bookFile of validBooks) {
      const bookName = path.parse(bookFile.name).name

      try {
        console.log(`Processing book: ${bookName} (${FileService.formatFileSize(bookFile.size)})`)
        
        const uploadResult = await galleryService.uploadToGallery(
          bookFile.path,
          bookName,
          FileService.formatFileSize(bookFile.size)
        )

        results.push(uploadResult)

        if (uploadResult.success) {
          console.log(`✅ Successfully uploaded ${bookName} to gallery (${uploadResult.imagesCreated} images created)`)
        } else {
          console.log(`❌ Failed to upload ${bookName} to gallery: ${uploadResult.error}`)
        }
      } catch (error: any) {
        console.error(`❌ Failed to process ${bookName}:`, error.message)
        
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
    const totalImagesCreated = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.imagesCreated || 0), 0)

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalProcessed: validBooks.length,
        successCount,
        failureCount,
        successRate: `${Math.round((successCount / validBooks.length) * 100)}%`,
        totalImagesCreated
      },
      processedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error processing books for gallery upload:', error)
    return NextResponse.json(
      { error: `Failed to process books: ${error.message}` },
      { status: 500 }
    )
  }
}