import { NextRequest, NextResponse } from 'next/server'
import { MonitoringService } from '@/services/monitoringService'

export async function POST(request: NextRequest) {
  try {
    const monitoringService = MonitoringService.getInstance()
    
    // Stop monitoring
    monitoringService.stopMonitoring()
    
    const status = monitoringService.getStatus()

    return NextResponse.json({
      success: true,
      message: 'Google Drive monitoring stopped successfully',
      status
    })

  } catch (error: any) {
    console.error('Error stopping Google Drive monitoring:', error)
    return NextResponse.json(
      { error: `Failed to stop monitoring: ${error.message}` },
      { status: 500 }
    )
  }
}