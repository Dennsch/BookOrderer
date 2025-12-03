import * as cron from 'node-cron'
import { GoogleDriveService, GoogleDriveFile } from './googleDriveService'
import { ProdigiService } from './prodigiService'
import { getConfig } from '@/config'

export interface MonitoringStatus {
  isRunning: boolean
  lastCheck?: string
  nextCheck?: string
  totalFilesProcessed: number
  successfulOrders: number
  failedOrders: number
  errors: string[]
}

export interface ProcessingResult {
  file: GoogleDriveFile
  success: boolean
  orderId?: string
  error?: string
  processedAt: string
}

export class MonitoringService {
  private static instance: MonitoringService
  private cronJob: cron.ScheduledTask | null = null
  private googleDriveService: GoogleDriveService
  private prodigiService: ProdigiService
  private status: MonitoringStatus
  private config = getConfig()

  private constructor() {
    this.status = {
      isRunning: false,
      totalFilesProcessed: 0,
      successfulOrders: 0,
      failedOrders: 0,
      errors: []
    }

    // Initialize services
    this.googleDriveService = new GoogleDriveService({
      credentialsPath: this.config.googleDrive.credentialsPath,
      folderId: this.config.googleDrive.folderId,
      tempDownloadPath: this.config.googleDrive.tempDownloadPath
    })

    this.prodigiService = new ProdigiService({
      apiKey: this.config.prodigi.apiKey,
      apiUrl: this.config.prodigi.apiUrl,
      environment: this.config.prodigi.environment
    })
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  async startMonitoring(): Promise<void> {
    if (this.cronJob) {
      console.log('Monitoring is already running')
      return
    }

    if (!this.config.googleDrive.enabled) {
      throw new Error('Google Drive monitoring is not enabled in configuration')
    }

    try {
      // Test Google Drive connection
      const connectionTest = await this.googleDriveService.testConnection()
      if (!connectionTest) {
        throw new Error('Failed to connect to Google Drive')
      }

      // Create cron expression for monitoring interval
      const cronExpression = `*/${this.config.googleDrive.monitoringInterval} * * * *`
      
      console.log(`Starting Google Drive monitoring every ${this.config.googleDrive.monitoringInterval} minutes`)
      
      this.cronJob = cron.schedule(cronExpression, async () => {
        await this.checkForNewFiles()
      }, {
        scheduled: false
      })

      this.cronJob.start()
      this.status.isRunning = true
      this.status.errors = []
      
      // Run initial check
      await this.checkForNewFiles()
      
      console.log('Google Drive monitoring started successfully')
    } catch (error) {
      console.error('Failed to start monitoring:', error)
      this.status.errors.push(`Failed to start monitoring: ${error}`)
      throw error
    }
  }

  stopMonitoring(): void {
    if (this.cronJob) {
      this.cronJob.stop()
      this.cronJob.destroy()
      this.cronJob = null
      this.status.isRunning = false
      console.log('Google Drive monitoring stopped')
    }
  }

  private async checkForNewFiles(): Promise<void> {
    try {
      console.log('Checking for new files in Google Drive...')
      this.status.lastCheck = new Date().toISOString()

      // Get new files from Google Drive
      const newFiles = await this.googleDriveService.getNewFiles()
      
      if (newFiles.length === 0) {
        console.log('No new files found')
        return
      }

      console.log(`Found ${newFiles.length} new file(s) to process`)

      // Process each new file
      for (const file of newFiles) {
        await this.processFile(file)
      }

      // Cleanup old temp files
      await this.googleDriveService.cleanupTempFiles()

    } catch (error) {
      console.error('Error during file check:', error)
      this.status.errors.push(`Check failed at ${new Date().toISOString()}: ${error}`)
      
      // Keep only last 10 errors
      if (this.status.errors.length > 10) {
        this.status.errors = this.status.errors.slice(-10)
      }
    }
  }

  private async processFile(file: GoogleDriveFile): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      file,
      success: false,
      processedAt: new Date().toISOString()
    }

    try {
      console.log(`Processing file: ${file.name} (${this.googleDriveService.formatFileSize(file.size)})`)

      // Download file from Google Drive
      const localFilePath = await this.googleDriveService.downloadFile(file)

      // Validate PDF
      const isValidPDF = await this.googleDriveService.validatePDF(localFilePath)
      if (!isValidPDF) {
        throw new Error('Downloaded file is not a valid PDF')
      }

      // Check file size
      if (file.size > this.config.app.maxFileSize) {
        throw new Error(`File size (${this.googleDriveService.formatFileSize(file.size)}) exceeds maximum allowed size`)
      }

      // Create book order
      const bookName = file.name.replace(/\.pdf$/i, '')
      const order = await this.prodigiService.createBookOrder(
        localFilePath,
        bookName,
        this.config.shipping.defaultAddress
      )

      // Mark file as processed
      await this.googleDriveService.markAsProcessed(file, order.id)

      result.success = true
      result.orderId = order.id
      
      this.status.totalFilesProcessed++
      this.status.successfulOrders++

      console.log(`✅ Successfully created order ${order.id} for ${file.name}`)

    } catch (error: any) {
      console.error(`❌ Failed to process ${file.name}:`, error.message)
      
      result.error = error.message
      this.status.totalFilesProcessed++
      this.status.failedOrders++

      // Still mark as processed to avoid retry loops for permanently failed files
      try {
        await this.googleDriveService.markAsProcessed(file)
      } catch (markError) {
        console.error('Failed to mark file as processed:', markError)
      }
    }

    return result
  }

  getStatus(): MonitoringStatus {
    if (this.cronJob && this.status.isRunning) {
      // Calculate next check time
      const nextRun = this.cronJob.nextDate()
      this.status.nextCheck = nextRun ? nextRun.toISOString() : undefined
    }
    
    return { ...this.status }
  }

  async getGoogleDriveFolderInfo(): Promise<{ name: string; id: string }> {
    return await this.googleDriveService.getFolderInfo()
  }

  async listGoogleDriveFiles(): Promise<GoogleDriveFile[]> {
    return await this.googleDriveService.listPDFFiles()
  }

  async getProcessedFiles() {
    return await this.googleDriveService.getProcessedFiles()
  }

  resetStats(): void {
    this.status.totalFilesProcessed = 0
    this.status.successfulOrders = 0
    this.status.failedOrders = 0
    this.status.errors = []
    console.log('Monitoring statistics reset')
  }
}