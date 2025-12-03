import { NextRequest, NextResponse } from 'next/server'
import { MonitoringService } from '@/services/monitoringService'
import { getConfig } from '@/config'

export async function GET(request: NextRequest) {
  try {
    const config = getConfig()
    const monitoringService = MonitoringService.getInstance()
    
    const status = monitoringService.getStatus()
    
    // Get additional information if Google Drive is enabled
    let folderInfo = null
    let processedFiles = []
    
    if (config.googleDrive.enabled) {
      try {
        folderInfo = await monitoringService.getGoogleDriveFolderInfo()
        processedFiles = await monitoringService.getProcessedFiles()
      } catch (error) {
        console.warn('Could not fetch additional Google Drive info:', error)
      }
    }

    return NextResponse.json({
      success: true,
      googleDriveEnabled: config.googleDrive.enabled,
      monitoringInterval: config.googleDrive.monitoringInterval,
      status,
      folderInfo,
      processedFiles: processedFiles.slice(-10), // Last 10 processed files
      retrievedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error getting Google Drive status:', error)
    return NextResponse.json(
      { error: `Failed to get status: ${error.message}` },
      { status: 500 }
    )
  }
}