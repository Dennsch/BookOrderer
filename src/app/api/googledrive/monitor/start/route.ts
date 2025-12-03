import { NextRequest, NextResponse } from 'next/server'
import { MonitoringService } from '@/services/monitoringService'
import { validateConfig } from '@/config'

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

    const monitoringService = MonitoringService.getInstance()
    
    // Check if already running
    const currentStatus = monitoringService.getStatus()
    if (currentStatus.isRunning) {
      return NextResponse.json({
        success: true,
        message: 'Monitoring is already running',
        status: currentStatus
      })
    }

    // Start monitoring
    await monitoringService.startMonitoring()
    
    const status = monitoringService.getStatus()

    return NextResponse.json({
      success: true,
      message: 'Google Drive monitoring started successfully',
      status
    })

  } catch (error: any) {
    console.error('Error starting Google Drive monitoring:', error)
    return NextResponse.json(
      { error: `Failed to start monitoring: ${error.message}` },
      { status: 500 }
    )
  }
}