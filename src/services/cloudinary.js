import { v2 as cloudinary } from 'cloudinary'

import fs from 'fs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadAssetToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null

    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    })

    console.log(uploadResult)

    logger.capture(
      `Asset uploaded: ${uploadResult.public_id}`,
      'debug',
      'cloudinary',
      'success'
    )

    return {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
      metadata: uploadResult.metadata,
    }
  } catch (error) {
    logger.capture(`Upload Error | ${error}`, 'error', 'cloudinary', 'error')

    fs.unlinkSync(localFilePath) // remove the temporary local file from the server

    logger.capture(
      `Local file removed: ${localFilePath}`,
      'debug',
      'server',
      'info'
    )

    return null
  }
}
