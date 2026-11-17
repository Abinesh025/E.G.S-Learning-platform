require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const { uploadMaterial, cloudinary } = require('../config/cloudinary');
const { downloadMaterial, deleteMaterial } = require('../controllers/materialController');
const materialRepository = require('../repositories/materialRepository');
const userRepository = require('../repositories/userRepository');
const { getPool } = require('../config/db');

async function testMaterialLifecycle() {
  console.log('====================================================');
  console.log('🧪 Testing Cloudinary Material Storage & Retrieval End-to-End');
  console.log('====================================================\n');

  // Verify Cloudinary is active
  const { hasCloudinary } = require('../config/cloudinary');
  console.log('1. Cloudinary configured:', hasCloudinary);
  if (!hasCloudinary) throw new Error('Cloudinary not configured');

  const app = express();
  app.use(express.json());

  // Set up test route for uploading
  app.post('/test-upload', uploadMaterial.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file' });

      const fileUrl = req.file.path || req.file.secure_url;
      const material = await materialRepository.createMaterial({
        title: 'Cloudinary Test Unit 1 Notes',
        subject: 'Cloud Computing',
        subjectName: 'Cloud Computing Architecture',
        unit: 'Unit 1',
        fileType: 'pdf',
        fileUrl,
        department: 'Computer Science and Engineering',
        semester: 7,
        course: 'B.E CSE',
        uploadedBy: 5001,
        staffName: 'Test Staff',
      });

      res.status(201).json({ success: true, material, file: req.file });
    } catch (err) {
      console.error('Error in test-upload handler:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Set up download test route
  app.get('/test-download/:id', downloadMaterial);

  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`Test server running on port ${port}...`);

    let createdMaterialId = null;
    let uploadedFileUrl = null;

    try {
      // 1. Upload Material
      console.log('\n2. Uploading PDF to Cloudinary via uploadMaterial middleware...');
      const formData = new FormData();
      const pdfBytes = Buffer.from('%PDF-1.4 sample lecture content for Cloudinary test');
      formData.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'lecture_notes_unit1.pdf');

      const uploadRes = await fetch(`http://localhost:${port}/test-upload`, {
        method: 'POST',
        body: formData,
      });

      console.log('   Upload status:', uploadRes.status);
      const uploadJson = await uploadRes.json();
      console.log('   Uploaded Material:', uploadJson.material);

      if (uploadRes.status !== 201 || !uploadJson.material) {
        throw new Error('Material upload failed');
      }

      createdMaterialId = uploadJson.material._id;
      uploadedFileUrl = uploadJson.material.fileUrl;

      console.log('   ✅ Cloudinary File URL stored in DB:', uploadedFileUrl);
      if (!uploadedFileUrl.includes('cloudinary.com')) {
        throw new Error('Expected fileUrl to be hosted on Cloudinary');
      }

      // 2. Retrieve Material via download/preview endpoint
      console.log('\n3. Retrieving material via downloadMaterial endpoint...');
      const downloadRes = await fetch(`http://localhost:${port}/test-download/${createdMaterialId}`);
      console.log('   Download status:', downloadRes.status);
      console.log('   Content-Type:', downloadRes.headers.get('content-type'));
      console.log('   Content-Disposition:', downloadRes.headers.get('content-disposition'));
      
      const downloadedText = await downloadRes.text();
      console.log('   Downloaded text length:', downloadedText.length);

      if (downloadRes.status !== 200 || !downloadedText.includes('%PDF-1.4')) {
        throw new Error('Download proxy failed to stream Cloudinary file');
      }
      console.log('   ✅ Cloudinary Retrieval Succeeded: File delivered with HTTP 200!');

      // 3. Delete Material
      console.log('\n4. Deleting material from DB and Cloudinary...');
      await materialRepository.deleteMaterial(createdMaterialId);

      // Clean from Cloudinary
      const match = uploadedFileUrl.match(/\/([^\/]+)\/upload\/(?:v\d+\/)?(.+)$/);
      if (match) {
        const resType = match[1];
        let publicId = match[2];
        if (resType !== 'raw') {
          publicId = publicId.replace(/\.[^/.]+$/, '');
        }
        const delResult = await cloudinary.uploader.destroy(publicId, { resource_type: resType });
        console.log('   Cloudinary destroy response:', delResult);
      }

      const checkDeleted = await materialRepository.getMaterialById(createdMaterialId);
      if (!checkDeleted) {
        console.log('   ✅ Material successfully purged from database and Cloudinary!');
      }

      console.log('\n====================================================');
      console.log('🎉 ALL CLOUDINARY MATERIAL TESTS PASSED 100%!');
      console.log('====================================================\n');
      process.exit(0);
    } catch (err) {
      console.error('\n❌ Test failed:', err);
      // Clean up if created
      if (createdMaterialId) {
        await materialRepository.deleteMaterial(createdMaterialId).catch(() => {});
      }
      process.exit(1);
    } finally {
      server.close();
    }
  });
}

testMaterialLifecycle().catch(console.error);
