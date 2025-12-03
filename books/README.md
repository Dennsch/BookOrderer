# Books Directory

This directory is where you should place your PDF files for processing with the Prodigi API.

## Instructions

1. **Add PDF Files**: Place your PDF book files in this directory
2. **File Requirements**:
   - Must have `.pdf` extension
   - Should be valid PDF files
   - Recommended max size: 50MB per file
3. **File Naming**: Use descriptive names as they will be used for order identification

## Example Structure

```
books/
├── my-first-book.pdf
├── cookbook-recipes.pdf
├── travel-guide-2024.pdf
└── README.md (this file)
```

## Processing

Once you've added PDF files:
1. Run the application (`npm run dev`)
2. Open http://localhost:3000
3. Click "Scan Books Folder" to detect your files
4. Click "Create All Orders" to process them with Prodigi

## Notes

- The application will validate PDF files before processing
- Invalid or corrupted PDFs will be skipped
- Each PDF will create a separate Prodigi order
- Order details will be displayed in the web interface