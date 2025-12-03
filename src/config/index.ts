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
  googleDrive: {
    enabled: boolean
    credentialsPath: string
    folderId: string
    monitoringInterval: number // in minutes
    tempDownloadPath: string
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
    },
    googleDrive: {
      enabled: process.env.GOOGLE_DRIVE_ENABLED === 'true',
      credentialsPath: process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || './google-credentials.json',
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
      monitoringInterval: parseInt(process.env.GOOGLE_DRIVE_MONITORING_INTERVAL || '5'), // 5 minutes default
      tempDownloadPath: process.env.GOOGLE_DRIVE_TEMP_PATH || './temp/downloads'
    }
  }
}

export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const config = getConfig()
  const errors: string[] = []

  if (!config.prodigi.apiKey) {
    errors.push('PRODIGI_API_KEY is required')
  }

  if (!config.prodigi.apiUrl) {
    errors.push('PRODIGI_API_URL is required')
  }

  if (!['sandbox', 'live'].includes(config.prodigi.environment)) {
    errors.push('PRODIGI_ENVIRONMENT must be either "sandbox" or "live"')
  }

  // Google Drive validation (only if enabled)
  if (config.googleDrive.enabled) {
    if (!config.googleDrive.folderId) {
      errors.push('GOOGLE_DRIVE_FOLDER_ID is required when Google Drive is enabled')
    }

    if (!config.googleDrive.credentialsPath) {
      errors.push('GOOGLE_DRIVE_CREDENTIALS_PATH is required when Google Drive is enabled')
    }

    if (config.googleDrive.monitoringInterval < 1) {
      errors.push('GOOGLE_DRIVE_MONITORING_INTERVAL must be at least 1 minute')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}