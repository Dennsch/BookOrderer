'use client'

import { useState, useEffect } from 'react'

interface BookFile {
  name: string
  path: string
  size: number
  sizeFormatted: string
  md5Hash: string
}

interface OrderResult {
  bookName: string
  fileName: string
  fileSize: string
  success: boolean
  orderId?: string
  status?: string
  created?: string
  error?: string
}

interface ProcessingSummary {
  totalProcessed: number
  successCount: number
  failureCount: number
  successRate: string
}

export default function Home() {
  const [books, setBooks] = useState<BookFile[]>([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState<OrderResult[]>([])
  const [summary, setSummary] = useState<ProcessingSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scanBooks = async () => {
    setScanning(true)
    setError(null)
    
    try {
      const response = await fetch('/api/books/scan')
      const data = await response.json()
      
      if (response.ok) {
        setBooks(data.books)
        console.log(`Found ${data.books.length} books in ${data.scannedPath}`)
      } else {
        setError(data.error || 'Failed to scan books')
      }
    } catch (error) {
      console.error('Error scanning books:', error)
      setError('Network error while scanning books')
    } finally {
      setScanning(false)
    }
  }

  const processAllBooks = async () => {
    setLoading(true)
    setResults([])
    setSummary(null)
    setError(null)
    
    try {
      const response = await fetch('/api/orders/create-all', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResults(data.results)
        setSummary(data.summary)
        console.log(`Processing completed: ${data.summary.successRate} success rate`)
      } else {
        setError(data.error || 'Failed to process books')
        if (data.details) {
          console.error('Configuration errors:', data.details)
        }
      }
    } catch (error) {
      console.error('Error processing books:', error)
      setError('Network error while processing books')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    scanBooks()
  }, [])

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem', textAlign: 'center' }}>
        📚 Book Orderer - Prodigi Integration
      </h1>
      
      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>📁 Available Books</h2>
        <div style={{ marginBottom: '1rem' }}>
          <button 
            className="button" 
            onClick={scanBooks} 
            disabled={scanning}
            style={{ marginRight: '1rem' }}
          >
            {scanning ? (
              <>
                <span className="loading"></span> Scanning...
              </>
            ) : (
              '🔍 Scan Books Folder'
            )}
          </button>
          
          <button 
            className="button" 
            onClick={processAllBooks} 
            disabled={loading || books.length === 0}
          >
            {loading ? (
              <>
                <span className="loading"></span> Processing...
              </>
            ) : (
              '🚀 Create All Orders'
            )}
          </button>
        </div>
        
        {books.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: '2px dashed #dee2e6'
          }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              📂 No PDF books found in the books folder
            </p>
            <p style={{ color: '#6c757d' }}>
              Add some PDF files to the <code>/books</code> directory and scan again.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
              Found {books.length} book(s):
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {books.map((book, index) => (
                <div key={index} style={{ 
                  padding: '1rem', 
                  background: '#f8f9fa', 
                  marginBottom: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ color: '#495057' }}>{book.name}</strong>
                    <div style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: '0.25rem' }}>
                      Size: {book.sizeFormatted} • Hash: {book.md5Hash.substring(0, 8)}...
                    </div>
                  </div>
                  <div style={{ 
                    background: '#e3f2fd', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    color: '#1976d2'
                  }}>
                    PDF
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {summary && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>📊 Processing Summary</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#495057' }}>
                {summary.totalProcessed}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Total Processed</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#d4edda', borderRadius: '6px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#155724' }}>
                {summary.successCount}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#155724' }}>Successful</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8d7da', borderRadius: '6px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#721c24' }}>
                {summary.failureCount}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#721c24' }}>Failed</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#cce5ff', borderRadius: '6px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#004085' }}>
                {summary.successRate}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#004085' }}>Success Rate</div>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>📋 Order Results</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {results.map((result, index) => (
              <div 
                key={index} 
                style={{
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  borderRadius: '6px',
                  border: `2px solid ${result.success ? '#28a745' : '#dc3545'}`,
                  background: result.success ? '#f8fff9' : '#fff8f8'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {result.success ? '✅' : '❌'} {result.bookName}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                      File: {result.fileName} ({result.fileSize})
                    </div>
                    {result.success ? (
                      <div style={{ fontSize: '0.9rem' }}>
                        <div style={{ color: '#28a745' }}>
                          <strong>Order ID:</strong> {result.orderId}
                        </div>
                        <div style={{ color: '#6c757d' }}>
                          <strong>Status:</strong> {result.status}
                        </div>
                        {result.created && (
                          <div style={{ color: '#6c757d' }}>
                            <strong>Created:</strong> {new Date(result.created).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: '#dc3545', fontSize: '0.9rem' }}>
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}