import { NextRequest, NextResponse } from 'next/server'
import { GoogleDriveService } from '@/services/googleDriveService'
import { ProdigiService } from '@/services/prodigiService'
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

    // Check if Google Drive is enabled
    if (!config.googleDrive.enabled) {
      return NextResponse.json(
        { error: 'Google Drive integration is not enabled' },
        { status: 400 }
      )
    }

    // Initialize services
    const googleDriveService = new GoogleDriveService({
      credentialsPath: config.googleDrive.credentialsPath,
      folderId: config.googleDrive.folderId,
      tempDownloadPath: config.googleDrive.tempDownloadPath
    })

    const prodigiService = new ProdigiService({
      apiKey: config.prodigi.apiKey,
      apiUrl: config.prodigi.apiUrl,
      environment: config.prodigi.environment
    })

    console.log('Processing new files from Google Drive...')

    // Test connection
    const connectionTest = await googleDriveService.testConnection()
    if (!connectionTest) {
      return NextResponse.json(
        { error: 'Failed to connect to Google Drive' },
        { status: 500 }
      )
    }

    // Get new files
    const newFiles = await googleDriveService.getNewFiles()

    if (newFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new files found to process',
        results: [],
        summary: {
          totalProcessed: 0,
          successCount: 0,
          failureCount: 0,
          successRate: '0%'
        }
      })
    }

    const results = []

    // Process each new file
    for (const file of newFiles) {
      const bookName = file.name.replace(/\.pdf$/i, '')

      try {
        console.log(`Processing: ${file.name} (${googleDriveService.formatFileSize(file.size)})`)

        // Download file
        const localFilePath = await googleDriveService.downloadFile(file)

        // Validate PDF
        const isValidPDF = await googleDriveService.validatePDF(localFilePath)
        if (!isValidPDF) {
          throw new Error('Downloaded file is not a valid PDF')
        }

        // Check file size
        if (file.size > config.app.maxFileSize) {
          throw new Error(`File size exceeds maximum allowed size`)
        }

        // Create order
        const order = await prodigiService.createBookOrder(
          localFilePath,
          bookName,
          config.shipping.defaultAddress
        )

        // Mark as processed
        await googleDriveService.markAsProcessed(file, order.id)

        results.push({
          fileName: file.name,
          fileSize: googleDriveService.formatFileSize(file.size),
          bookName,
          success: true,
          orderId: order.id,
          status: order.status.stage,
          created: order.created
        })

        console.log(`✅ Successfully created order ${order.id} for ${file.name}`)

      } catch (error: any) {
        console.error(`❌ Failed to process ${file.name}:`, error.message)

        // Mark as processed even if failed to avoid retry loops
        try {
          await googleDriveService.markAsProcessed(file)
        } catch (markError) {
          console.error('Failed to mark file as processed:', markError)
        }

        results.push({
          fileName: file.name,
          fileSize: googleDriveService.formatFileSize(file.size),
          bookName,
          success: false,
          error: error.message
        })
      }
    }

    // Cleanup temp files
    await googleDriveService.cleanupTempFiles()

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalProcessed: newFiles.length,
        successCount,
        failureCount,
        successRate: `${Math.round((successCount / newFiles.length) * 100)}%`
      },
      processedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error processing new Google Drive files:', error)
    return NextResponse.json(
      { error: `Failed to process files: ${error.message}` },
      { status: 500 }
    )
  }
}