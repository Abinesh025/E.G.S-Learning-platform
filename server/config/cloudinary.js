const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')
const path = require('path')

// Check if Cloudinary is fully configured with valid credentials
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'YOUR_CLOUD_NAME' &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('your_')
)

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

// Storage for materials (pdf, video, audio, docs)
let materialStorage

if (hasCloudinary) {
  materialStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const ext = path.extname(file.originalname).toLowerCase()
      const baseName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'material'

      let resource_type = 'raw'
      if (file.mimetype.startsWith('video/')) resource_type = 'video'
      else if (file.mimetype.startsWith('audio/')) resource_type = 'video'
      else if (file.mimetype.startsWith('image/')) resource_type = 'image'

      const params = {
        folder: 'egs-materials',
        resource_type,
        // Raw files (PDFs, Office docs, text) require file extension in public_id
        public_id: resource_type === 'raw'
          ? `${baseName}-${Date.now()}${ext}`
          : `${baseName}-${Date.now()}`,
      }

      if (resource_type !== 'raw') {
        params.allowed_formats = ['mp4', 'mp3', 'webm', 'wav', 'ogg', 'jpg', 'jpeg', 'png', 'webp', 'gif']
      }

      return params
    },
  })
} else {
  // Fallback to local disk storage
  const fs = require('fs')
  const uploadDir = path.join(__dirname, '../uploads/materials')
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  materialStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      cb(null, `material-${Date.now()}${path.extname(file.originalname)}`)
    }
  })
}

// Storage for avatars
let avatarStorage

if (hasCloudinary) {
  avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'egs-avatars',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ width: 256, height: 256, crop: 'fill' }],
    },
  })
} else {
  const fs = require('fs')
  const uploadDir = path.join(__dirname, '../uploads/avatars')
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      cb(null, `avatar-${req.user ? req.user._id : Date.now()}${path.extname(file.originalname)}`)
    }
  })
}

/**
 * Generates an authenticated retrieval download URL for Cloudinary materials
 * Handles account-level ACL restrictions seamlessly
 */
function getCloudinaryDownloadUrl(fileUrl) {
  if (!fileUrl || !fileUrl.includes('cloudinary.com')) return fileUrl

  try {
    const match = fileUrl.match(/\/([^\/]+)\/upload\/(?:v\d+\/)?(.+)$/)
    if (match) {
      const type = match[1]
      const publicIdWithExt = match[2]
      const ext = path.extname(publicIdWithExt).replace(/^\./, '')

      if (type === 'raw') {
        return cloudinary.utils.private_download_url(publicIdWithExt, ext, {
          resource_type: 'raw',
          type: 'upload',
          expires_at: Math.floor(Date.now() / 1000) + 7200, // 2 hours expiry
        })
      }
    }
  } catch (e) {
    console.warn('Failed to sign Cloudinary download URL, using original URL:', e.message)
  }
  return fileUrl
}

const uploadMaterial = multer({
  storage: materialStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
})

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

module.exports = {
  cloudinary,
  uploadMaterial,
  uploadAvatar,
  hasCloudinary,
  getCloudinaryDownloadUrl,
}
