export interface AppConfig {
  prodigi: {
    apiKey: string
    apiUrl: string
    environment: 'sandbox' | 'live'
  }
  app: {
    booksPath: string
    maxFileSize: number
    allowedExtensions: string[]
  }
  gallery: {
    galleryPath: string
    imageFormat: 'png' | 'jpg'
    imageQuality: number
    maxPages: number
  }
  shipping: {
    defaultAddress: {
      name: string
      line1: string
      line2?: string
      postalOrZipCode: string
      countryCode: string
      townOrCity: string
      stateOrCounty?: string
    }
  }
}

export const getConfig = (): AppConfig => {
  return {
    prodigi: {
      apiKey: process.env.PRODIGI_API_KEY || '',
      apiUrl: process.env.PRODIGI_API_URL || 'https://api.prodigi.com/v4.0',
      environment: (process.env.PRODIGI_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox'
    },
    app: {
      booksPath: process.env.BOOKS_FOLDER_PATH || './books',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '50') * 1024 * 1024, // 50MB default
      allowedExtensions: ['.pdf']
    },
    gallery: {
      galleryPath: process.env.GALLERY_PATH || './gallery',
      imageFormat: (process.env.GALLERY_IMAGE_FORMAT as 'png' | 'jpg') || 'png',
      imageQuality: parseInt(process.env.GALLERY_IMAGE_QUALITY || '85'),
      maxPages: parseInt(process.env.GALLERY_MAX_PAGES || '10') // Convert up to 10 pages per PDF
    },
    shipping: {
      defaultAddress: {
        name: process.env.DEFAULT_SHIPPING_NAME || 'Book Customer',
        line1: process.env.DEFAULT_SHIPPING_LINE1 || '123 Main Street',
        line2: process.env.DEFAULT_SHIPPING_LINE2,
        postalOrZipCode: process.env.DEFAULT_SHIPPING_POSTAL || '12345',
        countryCode: process.env.DEFAULT_SHIPPING_COUNTRY || 'US',
        townOrCity: process.env.DEFAULT_SHIPPING_CITY || 'Anytown',
        stateOrCounty: process.env.DEFAULT_SHIPPING_STATE || 'NY'
      }
    }
  }
}

export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const config = getConfig()
  const errors: string[] = []

  // Gallery configuration is always required now
  if (!config.gallery.galleryPath) {
    errors.push('GALLERY_PATH is required')
  }

  if (!['png', 'jpg'].includes(config.gallery.imageFormat)) {
    errors.push('GALLERY_IMAGE_FORMAT must be either "png" or "jpg"')
  }

  if (config.gallery.imageQuality < 1 || config.gallery.imageQuality > 100) {
    errors.push('GALLERY_IMAGE_QUALITY must be between 1 and 100')
  }

  if (config.gallery.maxPages < 1) {
    errors.push('GALLERY_MAX_PAGES must be at least 1')
  }

  // Prodigi configuration is now optional since we're not creating orders
  // Only validate if API key is provided (indicating intent to use Prodigi)
  if (config.prodigi.apiKey) {
    if (!config.prodigi.apiUrl) {
      errors.push('PRODIGI_API_URL is required when PRODIGI_API_KEY is provided')
    }

    if (!['sandbox', 'live'].includes(config.prodigi.environment)) {
      errors.push('PRODIGI_ENVIRONMENT must be either "sandbox" or "live"')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}