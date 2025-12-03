import { google, drive_v3 } from 'googleapis'
import fs from 'fs-extra'
import path from 'path'
import crypto from 'crypto'

export interface GoogleDriveConfig {
  credentialsPath: string
  folderId: string
  tempDownloadPath: string
}

export interface GoogleDriveFile {
  id: string
  name: string
  size: number
  mimeType: string
  modifiedTime: string
  md5Checksum?: string
  downloadUrl?: string
}

export interface ProcessedFile {
  id: string
  name: string
  md5Checksum: string
  processedAt: string
  orderId?: string
}

export class GoogleDriveService {
  private drive: drive_v3.Drive
  private config: GoogleDriveConfig
  private processedFilesPath: string

  constructor(config: GoogleDriveConfig) {
    this.config = config
    this.processedFilesPath = path.join(config.tempDownloadPath, 'processed-files.json')
    this.initializeAuth()
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Check if credentials file exists
      if (!await fs.pathExists(this.config.credentialsPath)) {
        throw new Error(`Google Drive credentials file not found: ${this.config.credentialsPath}`)
      }

      // Load service account credentials
      const credentials = await fs.readJson(this.config.credentialsPath)
      
      // Create JWT auth client
      const auth = new google.auth.JWT(
        credentials.client_email,
        undefined,
        credentials.private_key,
        ['https://www.googleapis.com/auth/drive.readonly']
      )

      // Initialize Google Drive API
      this.drive = google.drive({ version: 'v3', auth })
      
      console.log('Google Drive service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error)
      throw error
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.drive.about.get({ fields: 'user' })
      console.log(`Connected to Google Drive as: ${response.data.user?.emailAddress}`)
      return true
    } catch (error) {
      console.error('Google Drive connection test failed:', error)
      return false
    }
  }

  async listPDFFiles(): Promise<GoogleDriveFile[]> {
    try {
      const response = await this.drive.files.list({
        q: `'${this.config.folderId}' in parents and mimeType='application/pdf' and trashed=false`,
        fields: 'files(id,name,size,mimeType,modifiedTime,md5Checksum)',
        orderBy: 'modifiedTime desc'
      })

      const files = response.data.files || []
      
      return files.map(file => ({
        id: file.id!,
        name: file.name!,
        size: parseInt(file.size || '0'),
        mimeType: file.mimeType!,
        modifiedTime: file.modifiedTime!,
        md5Checksum: file.md5Checksum
      }))
    } catch (error) {
      console.error('Error listing PDF files from Google Drive:', error)
      throw new Error(`Failed to list files: ${error}`)
    }
  }

  async getNewFiles(): Promise<GoogleDriveFile[]> {
    try {
      const allFiles = await this.listPDFFiles()
      const processedFiles = await this.getProcessedFiles()
      
      // Filter out already processed files
      const newFiles = allFiles.filter(file => {
        const isProcessed = processedFiles.some(processed => 
          processed.id === file.id && processed.md5Checksum === file.md5Checksum
        )
        return !isProcessed
      })

      console.log(`Found ${newFiles.length} new files out of ${allFiles.length} total files`)
      return newFiles
    } catch (error) {
      console.error('Error getting new files:', error)
      throw error
    }
  }

  async downloadFile(file: GoogleDriveFile): Promise<string> {
    try {
      // Ensure temp directory exists
      await fs.ensureDir(this.config.tempDownloadPath)

      // Create local file path
      const localFilePath = path.join(this.config.tempDownloadPath, file.name)

      // Download file
      const response = await this.drive.files.get({
        fileId: file.id,
        alt: 'media'
      }, { responseType: 'stream' })

      // Write to local file
      const writeStream = fs.createWriteStream(localFilePath)
      
      return new Promise((resolve, reject) => {
        response.data
          .pipe(writeStream)
          .on('error', reject)
          .on('finish', () => {
            console.log(`Downloaded: ${file.name} (${this.formatFileSize(file.size)})`)
            resolve(localFilePath)
          })
      })
    } catch (error) {
      console.error(`Error downloading file ${file.name}:`, error)
      throw new Error(`Failed to download file: ${error}`)
    }
  }

  async markAsProcessed(file: GoogleDriveFile, orderId?: string): Promise<void> {
    try {
      const processedFiles = await this.getProcessedFiles()
      
      const processedFile: ProcessedFile = {
        id: file.id,
        name: file.name,
        md5Checksum: file.md5Checksum || '',
        processedAt: new Date().toISOString(),
        orderId
      }

      processedFiles.push(processedFile)
      
      // Ensure directory exists
      await fs.ensureDir(path.dirname(this.processedFilesPath))
      
      // Save updated processed files list
      await fs.writeJson(this.processedFilesPath, processedFiles, { spaces: 2 })
      
      console.log(`Marked file as processed: ${file.name}`)
    } catch (error) {
      console.error('Error marking file as processed:', error)
      throw error
    }
  }

  async getProcessedFiles(): Promise<ProcessedFile[]> {
    try {
      if (await fs.pathExists(this.processedFilesPath)) {
        return await fs.readJson(this.processedFilesPath)
      }
      return []
    } catch (error) {
      console.error('Error reading processed files:', error)
      return []
    }
  }

  async cleanupTempFiles(): Promise<void> {
    try {
      if (await fs.pathExists(this.config.tempDownloadPath)) {
        const files = await fs.readdir(this.config.tempDownloadPath)
        
        for (const file of files) {
          const filePath = path.join(this.config.tempDownloadPath, file)
          const stats = await fs.stat(filePath)
          
          // Skip the processed files tracking file
          if (file === 'processed-files.json') {
            continue
          }
          
          // Delete files older than 1 hour
          const oneHourAgo = Date.now() - (60 * 60 * 1000)
          if (stats.mtime.getTime() < oneHourAgo) {
            await fs.remove(filePath)
            console.log(`Cleaned up temp file: ${file}`)
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error)
    }
  }

  async validatePDF(filePath: string): Promise<boolean> {
    try {
      const fileBuffer = await fs.readFile(filePath)
      
      // Check PDF magic number (first 4 bytes should be %PDF)
      const pdfHeader = fileBuffer.slice(0, 4).toString()
      return pdfHeader === '%PDF'
    } catch (error) {
      console.error('Error validating PDF:', error)
      return false
    }
  }

  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  async getFolderInfo(): Promise<{ name: string; id: string }> {
    try {
      const response = await this.drive.files.get({
        fileId: this.config.folderId,
        fields: 'id,name'
      })

      return {
        id: response.data.id!,
        name: response.data.name!
      }
    } catch (error) {
      console.error('Error getting folder info:', error)
      throw new Error(`Failed to get folder info: ${error}`)
    }
  }
}