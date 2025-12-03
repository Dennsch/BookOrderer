import axios, { AxiosInstance } from 'axios'
import FormData from 'form-data'
import fs from 'fs-extra'

export interface ProdigiConfig {
  apiKey: string
  apiUrl: string
  environment: 'sandbox' | 'live'
}

export interface OrderItem {
  sku: string
  copies: number
  sizing: string
  attributes: Record<string, any>
  assets: Asset[]
}

export interface Asset {
  printArea: string
  url?: string
  md5Hash?: string
}

export interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  postalOrZipCode: string
  countryCode: string
  townOrCity: string
  stateOrCounty?: string
}

export interface CreateOrderRequest {
  shippingMethod: number
  idempotencyKey: string
  items: OrderItem[]
  shippingAddress: ShippingAddress
  metadata?: Record<string, any>
}

export interface CreateOrderResponse {
  id: string
  created: string
  lastUpdated: string
  callbackUrl?: string
  merchantReference?: string
  shippingMethod: number
  idempotencyKey: string
  status: {
    stage: string
    issues: any[]
    details: {
      downloadAssets: string
      printReadyAssetsPrepared: string
      allocateProductionLocation: string
      inProduction: string
      shipping: string
    }
  }
  charges: any[]
  shipments: any[]
  items: any[]
  shippingAddress: ShippingAddress
  metadata?: Record<string, any>
}

export class ProdigiService {
  private client: AxiosInstance
  private config: ProdigiConfig

  constructor(config: ProdigiConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
    })
  }

  async uploadAsset(filePath: string): Promise<{ url: string; md5Hash: string }> {
    try {
      // First, get upload URL
      const uploadResponse = await this.client.post('/assets/upload', {
        fileName: filePath.split('/').pop(),
        fileType: 'application/pdf'
      })

      const { uploadUrl, assetId } = uploadResponse.data

      // Upload the file
      const fileBuffer = await fs.readFile(filePath)
      const formData = new FormData()
      formData.append('file', fileBuffer, {
        filename: filePath.split('/').pop(),
        contentType: 'application/pdf'
      })

      await axios.put(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      })

      // Get asset details
      const assetResponse = await this.client.get(`/assets/${assetId}`)
      
      return {
        url: assetResponse.data.url,
        md5Hash: assetResponse.data.md5Hash
      }
    } catch (error) {
      console.error('Error uploading asset:', error)
      throw new Error(`Failed to upload asset: ${error}`)
    }
  }

  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const response = await this.client.post('/orders', request)
      return response.data
    } catch (error: any) {
      console.error('Error creating order:', error.response?.data || error.message)
      throw new Error(`Failed to create order: ${error.response?.data?.message || error.message}`)
    }
  }

  async createBookOrder(
    pdfPath: string, 
    bookName: string,
    shippingAddress: ShippingAddress
  ): Promise<CreateOrderResponse> {
    try {
      // Upload the PDF as an asset
      const asset = await this.uploadAsset(pdfPath)

      // Create order with the uploaded asset
      const orderRequest: CreateOrderRequest = {
        shippingMethod: 1, // Standard shipping
        idempotencyKey: `book-${bookName}-${Date.now()}`,
        items: [
          {
            sku: 'generic-hd-210x297mm-book-white-350gsm-gloss-perfect-bound-4pp', // A4 book SKU
            copies: 1,
            sizing: 'fillPrintArea',
            attributes: {},
            assets: [
              {
                printArea: 'default',
                url: asset.url,
                md5Hash: asset.md5Hash
              }
            ]
          }
        ],
        shippingAddress,
        metadata: {
          bookName,
          originalFileName: pdfPath.split('/').pop()
        }
      }

      return await this.createOrder(orderRequest)
    } catch (error) {
      console.error(`Error creating book order for ${bookName}:`, error)
      throw error
    }
  }

  async getProducts() {
    try {
      const response = await this.client.get('/products')
      return response.data
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }
}