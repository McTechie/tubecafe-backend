import { v2 as cloudinary } from 'cloudinary'
import Logger, { Log } from '../lib/Logger.js'

import fs from 'fs'
import dotenv from 'dotenv'

const logger = new Logger()

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadAssetToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null

    const options = {
      resource_type: 'auto',
    }

    const uploadResult = await cloudinary.uploader.upload(
      localFilePath,
      options
    )

    logger.capture(
      `Asset uploaded: ${uploadResult.public_id}`,
      Log.type.DEBUG,
      Log.source.CLOUDINARY,
      Log.severity.SUCCESS
    )

    fs.unlinkSync(localFilePath) // remove the temporary local file from the server

    return {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
      metadata: uploadResult.metadata,
    }
  } catch (error) {
    logger.capture(
      `Upload Error: ${error.message}`,
      Log.type.ERROR,
      Log.source.CLOUDINARY,
      Log.severity.ERROR
    )

    fs.unlinkSync(localFilePath) // remove the temporary local file from the server

    logger.capture(
      `Local file removed: ${localFilePath}`,
      Log.type.DEBUG,
      Log.source.SERVER,
      Log.severity.INFO
    )

    return null
  }
}

export { uploadAssetToCloudinary }
