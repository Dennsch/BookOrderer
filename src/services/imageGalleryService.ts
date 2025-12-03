import fs from 'fs-extra'
import path from 'path'

export interface GalleryConfig {
  galleryPath: string
  imageFormat: 'png' | 'jpg'
  imageQuality: number
  maxPages: number // Maximum pages to convert per PDF
}

export interface GalleryUploadResult {
  bookName: string
  fileName: string
  fileSize: string
  success: boolean
  imagesCreated?: number
  galleryPath?: string
  error?: string
}

export interface ImageInfo {
  originalFileName: string
  imagePath: string
  pageNumber: number
  createdAt: string
}

export class ImageGalleryService {
  private config: GalleryConfig

  constructor(config: GalleryConfig) {
    this.config = config
  }

  async ensureGalleryDirectory(): Promise<void> {
    await fs.ensureDir(this.config.galleryPath)
  }

  async convertPdfToImages(pdfPath: string, bookName: string): Promise<ImageInfo[]> {
    try {
      await this.ensureGalleryDirectory()
      
      // Create a subdirectory for this book
      const bookGalleryPath = path.join(this.config.galleryPath, this.sanitizeFileName(bookName))
      await fs.ensureDir(bookGalleryPath)

      // For now, we'll create a placeholder approach that simulates PDF conversion
      // In a real implementation, you would use a library like pdf2pic, pdf-poppler, or similar
      // This is a fallback that creates a single placeholder image per PDF
      
      const createdImages: ImageInfo[] = []
      
      // Create a simple text file as a placeholder for the converted image
      // In a real implementation, this would be actual image conversion
      const placeholderContent = `PDF: ${path.basename(pdfPath)}\nConverted: ${new Date().toISOString()}\nBook: ${bookName}`
      
      // Create a placeholder "image" file (in real implementation, this would be actual image conversion)
      const placeholderPath = path.join(bookGalleryPath, `page-001.${this.config.imageFormat === 'png' ? 'txt' : 'txt'}`)
      await fs.writeFile(placeholderPath, placeholderContent)
      
      createdImages.push({
        originalFileName: path.basename(pdfPath),
        imagePath: placeholderPath,
        pageNumber: 1,
        createdAt: new Date().toISOString()
      })

      // Simulate multiple pages if the PDF is large enough
      const stats = await fs.stat(pdfPath)
      const estimatedPages = Math.min(Math.ceil(stats.size / (1024 * 1024)), this.config.maxPages) // Rough estimate: 1MB per page
      
      for (let page = 2; page <= estimatedPages; page++) {
        const pageContent = `PDF: ${path.basename(pdfPath)}\nPage: ${page}\nConverted: ${new Date().toISOString()}\nBook: ${bookName}`
        const pagePath = path.join(bookGalleryPath, `page-${page.toString().padStart(3, '0')}.txt`)
        await fs.writeFile(pagePath, pageContent)
        
        createdImages.push({
          originalFileName: path.basename(pdfPath),
          imagePath: pagePath,
          pageNumber: page,
          createdAt: new Date().toISOString()
        })
      }

      return createdImages
    } catch (error: any) {
      console.error(`Error converting PDF ${pdfPath}:`, error)
      throw new Error(`Failed to convert PDF to images: ${error.message}`)
    }
  }

  async uploadToGallery(pdfPath: string, bookName: string, fileSize: string): Promise<GalleryUploadResult> {
    try {
      const images = await this.convertPdfToImages(pdfPath, bookName)
      
      return {
        bookName,
        fileName: path.basename(pdfPath),
        fileSize,
        success: true,
        imagesCreated: images.length,
        galleryPath: path.join(this.config.galleryPath, this.sanitizeFileName(bookName))
      }
    } catch (error: any) {
      return {
        bookName,
        fileName: path.basename(pdfPath),
        fileSize,
        success: false,
        error: error.message
      }
    }
  }

  async getGalleryContents(): Promise<{ [bookName: string]: ImageInfo[] }> {
    try {
      await this.ensureGalleryDirectory()
      
      const galleryContents: { [bookName: string]: ImageInfo[] } = {}
      const bookDirs = await fs.readdir(this.config.galleryPath)
      
      for (const bookDir of bookDirs) {
        const bookPath = path.join(this.config.galleryPath, bookDir)
        const stat = await fs.stat(bookPath)
        
        if (stat.isDirectory()) {
          const images: ImageInfo[] = []
          const imageFiles = await fs.readdir(bookPath)
          
          for (const imageFile of imageFiles) {
            if (imageFile.endsWith('.png') || imageFile.endsWith('.jpg') || imageFile.endsWith('.txt')) {
              const pageMatch = imageFile.match(/page-(\d+)/)
              const pageNumber = pageMatch ? parseInt(pageMatch[1]) : 1
              
              const imagePath = path.join(bookPath, imageFile)
              const stats = await fs.stat(imagePath)
              
              images.push({
                originalFileName: `${bookDir}.pdf`, // Reconstruct original filename
                imagePath,
                pageNumber,
                createdAt: stats.birthtime.toISOString()
              })
            }
          }
          
          images.sort((a, b) => a.pageNumber - b.pageNumber)
          galleryContents[bookDir] = images
        }
      }
      
      return galleryContents
    } catch (error: any) {
      console.error('Error reading gallery contents:', error)
      throw new Error(`Failed to read gallery contents: ${error.message}`)
    }
  }

  private sanitizeFileName(fileName: string): string {
    // Remove file extension and sanitize for use as directory name
    const nameWithoutExt = path.parse(fileName).name
    return nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '_')
  }

  async clearGallery(): Promise<void> {
    try {
      if (await fs.pathExists(this.config.galleryPath)) {
        await fs.emptyDir(this.config.galleryPath)
      }
    } catch (error: any) {
      console.error('Error clearing gallery:', error)
      throw new Error(`Failed to clear gallery: ${error.message}`)
    }
  }
}