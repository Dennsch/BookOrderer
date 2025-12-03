import fs from 'fs-extra'
import path from 'path'
import crypto from 'crypto'

export interface FileInfo {
  name: string
  path: string
  size: number
  extension: string
  md5Hash: string
}

export class FileService {
  static async scanDirectory(directoryPath: string, extensions: string[] = ['.pdf']): Promise<FileInfo[]> {
    try {
      if (!await fs.pathExists(directoryPath)) {
        throw new Error(`Directory does not exist: ${directoryPath}`)
      }

      const files = await fs.readdir(directoryPath)
      const fileInfos: FileInfo[] = []

      for (const file of files) {
        const filePath = path.join(directoryPath, file)
        const stats = await fs.stat(filePath)

        if (stats.isFile()) {
          const extension = path.extname(file).toLowerCase()
          
          if (extensions.length === 0 || extensions.includes(extension)) {
            const md5Hash = await this.calculateMD5(filePath)
            
            fileInfos.push({
              name: file,
              path: filePath,
              size: stats.size,
              extension,
              md5Hash
            })
          }
        }
      }

      return fileInfos
    } catch (error) {
      console.error('Error scanning directory:', error)
      throw error
    }
  }

  static async calculateMD5(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath)
      const hash = crypto.createHash('md5')
      hash.update(fileBuffer)
      return hash.digest('hex')
    } catch (error) {
      console.error('Error calculating MD5:', error)
      throw error
    }
  }

  static async validatePDF(filePath: string): Promise<boolean> {
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

  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  static async ensureDirectory(directoryPath: string): Promise<void> {
    try {
      await fs.ensureDir(directoryPath)
    } catch (error) {
      console.error('Error ensuring directory:', error)
      throw error
    }
  }
}