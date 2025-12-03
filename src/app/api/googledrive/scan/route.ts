import { NextRequest, NextResponse } from 'next/server'
import { GoogleDriveService } from '@/services/googleDriveService'
import { getConfig, validateConfig } from '@/config'

export async function GET(request: NextRequest) {
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

    // Initialize Google Drive service
    const googleDriveService = new GoogleDriveService({
      credentialsPath: config.googleDrive.credentialsPath,
      folderId: config.googleDrive.folderId,
      tempDownloadPath: config.googleDrive.tempDownloadPath
    })

    console.log(`Scanning Google Drive folder: ${config.googleDrive.folderId}`)

    // Test connection
    const connectionTest = await googleDriveService.testConnection()
    if (!connectionTest) {
      return NextResponse.json(
        { error: 'Failed to connect to Google Drive' },
        { status: 500 }
      )
    }

    // Get folder info
    const folderInfo = await googleDriveService.getFolderInfo()

    // List PDF files
    const files = await googleDriveService.listPDFFiles()

    // Get processed files for comparison
    const processedFiles = await googleDriveService.getProcessedFiles()

    // Categorize files
    const newFiles = files.filter(file => {
      const isProcessed = processedFiles.some(processed => 
        processed.id === file.id && processed.md5Checksum === file.md5Checksum
      )
      return !isProcessed
    })

    const processedFilesList = files.filter(file => {
      const isProcessed = processedFiles.some(processed => 
        processed.id === file.id && processed.md5Checksum === file.md5Checksum
      )
      return isProcessed
    })

    // Format files for response
    const formatFile = (file: any) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      sizeFormatted: googleDriveService.formatFileSize(file.size),
      modifiedTime: file.modifiedTime,
      md5Checksum: file.md5Checksum
    })

    return NextResponse.json({
      success: true,
      folder: folderInfo,
      files: {
        all: files.map(formatFile),
        new: newFiles.map(formatFile),
        processed: processedFilesList.map(formatFile)
      },
      counts: {
        total: files.length,
        new: newFiles.length,
        processed: processedFilesList.length
      },
      scannedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error scanning Google Drive:', error)
    return NextResponse.json(
      { error: `Failed to scan Google Drive: ${error.message}` },
      { status: 500 }
    )
  }
}