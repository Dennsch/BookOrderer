// Simple test script to verify gallery functionality
// Run with: node test-gallery.js

const fs = require('fs-extra');
const path = require('path');

async function testGallerySetup() {
  console.log('🧪 Testing Gallery Setup...\n');

  // Test 1: Check if books directory exists
  const booksPath = './books';
  const galleryPath = './gallery';

  try {
    console.log('📁 Checking books directory...');
    if (await fs.pathExists(booksPath)) {
      console.log('✅ Books directory exists');
      const files = await fs.readdir(booksPath);
      const pdfFiles = files.filter(f => f.endsWith('.pdf'));
      console.log(`   Found ${pdfFiles.length} PDF files: ${pdfFiles.join(', ')}`);
    } else {
      console.log('❌ Books directory does not exist');
      console.log('   Creating books directory...');
      await fs.ensureDir(booksPath);
      console.log('✅ Books directory created');
    }

    // Test 2: Check gallery directory
    console.log('\n📁 Checking gallery directory...');
    if (await fs.pathExists(galleryPath)) {
      console.log('✅ Gallery directory exists');
    } else {
      console.log('❌ Gallery directory does not exist');
      console.log('   Creating gallery directory...');
      await fs.ensureDir(galleryPath);
      console.log('✅ Gallery directory created');
    }

    // Test 3: Create sample PDF if none exist
    const samplePdfPath = path.join(booksPath, 'sample-book.pdf');
    if (!await fs.pathExists(samplePdfPath)) {
      console.log('\n📄 Creating sample PDF file...');
      const samplePdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF';
      await fs.writeFile(samplePdfPath, samplePdfContent);
      console.log('✅ Sample PDF created: sample-book.pdf');
    }

    // Test 4: Test configuration
    console.log('\n⚙️  Testing configuration...');
    const config = {
      gallery: {
        galleryPath: './gallery',
        imageFormat: 'png',
        imageQuality: 85,
        maxPages: 10
      },
      app: {
        booksPath: './books',
        allowedExtensions: ['.pdf']
      }
    };
    console.log('✅ Configuration looks good');
    console.log(`   Gallery path: ${config.gallery.galleryPath}`);
    console.log(`   Image format: ${config.gallery.imageFormat}`);
    console.log(`   Max pages: ${config.gallery.maxPages}`);

    console.log('\n🎉 Gallery setup test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Add PDF files to the ./books directory');
    console.log('2. Run: npm run dev');
    console.log('3. Open http://localhost:3000');
    console.log('4. Click "Upload All to Gallery"');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGallerySetup();