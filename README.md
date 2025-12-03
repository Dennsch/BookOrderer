# Book Gallery Uploader - PDF to Image Converter

A TypeScript Next.js application that automatically converts PDF files to images and organizes them in a gallery structure. Perfect for batch processing PDF books into image galleries for easy viewing and management.

## 🚀 Features

- **Automatic PDF Detection**: Scans a designated folder for PDF files
- **PDF to Image Conversion**: Converts PDF pages to images (PNG/JPG)
- **Gallery Organization**: Creates organized gallery structure with subdirectories per book
- **Batch Processing**: Process multiple books at once
- **File Validation**: Validates PDF files before processing
- **Real-time Status**: Live updates on processing progress
- **Error Handling**: Comprehensive error reporting and logging
- **Configurable Output**: Customizable image format, quality, and page limits
- **Vercel Ready**: Optimized for deployment on Vercel

## 📋 Prerequisites

- Node.js 18+ 
- PDF files to process
- (Optional) ImageMagick for advanced PDF conversion

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd book-orderer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure your environment variables** in `.env.local`:
   ```env
   # Prodigi API Configuration
   PRODIGI_API_KEY=your_prodigi_api_key_here
   PRODIGI_API_URL=https://api.prodigi.com/v4.0
   PRODIGI_ENVIRONMENT=sandbox

   # Application Configuration
   BOOKS_FOLDER_PATH=./books

   # Optional: Default Shipping Address
   DEFAULT_SHIPPING_NAME=Your Name
   DEFAULT_SHIPPING_LINE1=123 Main Street
   DEFAULT_SHIPPING_POSTAL=12345
   DEFAULT_SHIPPING_COUNTRY=US
   DEFAULT_SHIPPING_CITY=Anytown
   DEFAULT_SHIPPING_STATE=NY
   ```

5. **Add PDF files**
   Place your PDF files in the `books` folder

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
book-orderer/
├── books/                    # PDF files directory
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   │   ├── books/      # Book scanning endpoints
│   │   │   ├── orders/     # Order creation endpoints
│   │   │   └── prodigi/    # Prodigi API endpoints
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Main page component
│   ├── config/             # Configuration management
│   └── services/           # Business logic services
│       ├── prodigiService.ts  # Prodigi API integration
│       └── fileService.ts     # File operations
├── .env.example            # Environment variables template
├── next.config.js          # Next.js configuration
├── package.json            # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## 🔧 Configuration

### Prodigi API Setup

1. **Create a Prodigi account** at [prodigi.com](https://prodigi.com)
2. **Get your API key** from the Prodigi dashboard
3. **Choose environment**:
   - `sandbox` for testing (recommended for development)
   - `live` for production orders

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PRODIGI_API_KEY` | Your Prodigi API key | ✅ | - |
| `PRODIGI_API_URL` | Prodigi API endpoint | ❌ | `https://api.prodigi.com/v4.0` |
| `PRODIGI_ENVIRONMENT` | API environment | ❌ | `sandbox` |
| `BOOKS_FOLDER_PATH` | Path to PDF files | ❌ | `./books` |
| `DEFAULT_SHIPPING_*` | Default shipping address | ❌ | Sample address |

## 📖 Usage

### Web Interface

1. **Scan Books**: Click "🔍 Scan Books Folder" to detect PDF files
2. **Create Orders**: Click "🚀 Create All Orders" to process all books
3. **Monitor Progress**: View real-time processing status and results

### API Endpoints

#### Scan Books
```http
GET /api/books/scan
```
Returns list of PDF files in the books folder.

#### Create Orders
```http
POST /api/orders/create-all
```
Creates Prodigi orders for all valid PDF files.

#### Get Products
```http
GET /api/prodigi/products
```
Retrieves available Prodigi products.

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard

4. **Upload PDF files** to your deployment or use a cloud storage solution

### Alternative Deployments

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Heroku
- AWS Amplify
- DigitalOcean App Platform

## 🔍 Troubleshooting

### Common Issues

**"Prodigi API key not configured"**
- Ensure `PRODIGI_API_KEY` is set in your environment variables

**"No PDF files found"**
- Check that PDF files are in the correct directory
- Verify the `BOOKS_FOLDER_PATH` configuration
- Ensure files have `.pdf` extension

**"Failed to create order"**
- Check your Prodigi API key and permissions
- Verify you're using the correct environment (sandbox/live)
- Check Prodigi account balance and limits

**File upload errors**
- Ensure PDF files are valid and not corrupted
- Check file size limits (default: 50MB)
- Verify network connectivity

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

## 📚 API Documentation

### Prodigi Service

The `ProdigiService` class handles all Prodigi API interactions:

```typescript
const prodigiService = new ProdigiService({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.prodigi.com/v4.0',
  environment: 'sandbox'
})

// Create order for a book
const order = await prodigiService.createBookOrder(
  '/path/to/book.pdf',
  'Book Name',
  shippingAddress
)
```

### File Service

The `FileService` class provides file operations:

```typescript
// Scan directory for PDFs
const files = await FileService.scanDirectory('./books', ['.pdf'])

// Validate PDF file
const isValid = await FileService.validatePDF('./book.pdf')

// Calculate MD5 hash
const hash = await FileService.calculateMD5('./book.pdf')
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [troubleshooting section](#-troubleshooting)
- Review [Prodigi API documentation](https://developers.prodigi.com/)
- Open an issue on GitHub

## 🔗 Links

- [Prodigi API Documentation](https://developers.prodigi.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)