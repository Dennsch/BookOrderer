import { NextRequest, NextResponse } from 'next/server'
import { ProdigiService } from '@/services/prodigiService'

export async function GET(request: NextRequest) {
  try {
    // Initialize Prodigi service
    const prodigiService = new ProdigiService({
      apiKey: process.env.PRODIGI_API_KEY || '',
      apiUrl: process.env.PRODIGI_API_URL || 'https://api.prodigi.com/v4.0',
      environment: (process.env.PRODIGI_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox'
    })

    // Check if API key is configured
    if (!process.env.PRODIGI_API_KEY) {
      return NextResponse.json(
        { error: 'Prodigi API key not configured' },
        { status: 500 }
      )
    }

    const products = await prodigiService.getProducts()

    return NextResponse.json({
      success: true,
      products: products.products || products,
      count: products.products?.length || 0
    })

  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: `Failed to fetch products: ${error.message}` },
      { status: 500 }
    )
  }
}