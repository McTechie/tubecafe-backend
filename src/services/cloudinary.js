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

const uploadAssetToCloudinary = async (
  localFilePath,
  username,
  uploadClass
) => {
  try {
    if (!localFilePath) return null

    const options = {
      resource_type: 'auto',
      public_id:
        username && uploadClass ? `${uploadClass}_${username}` : undefined,
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

    // make sure file exists before unlinking
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath) // remove the temporary local file from the server
    }

    const { secure_url, public_id, ...metadata } = uploadResult

    return {
      url: secure_url,
      publicId: public_id,
      metadata,
    }
  } catch (error) {
    logger.capture(
      `Upload Error: ${error.message}`,
      Log.type.ERROR,
      Log.source.CLOUDINARY,
      Log.severity.ERROR
    )

    // make sure file exists before unlinking
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath) // remove the temporary local file from the server
    }

    logger.capture(
      `Local file removed: ${localFilePath}`,
      Log.type.DEBUG,
      Log.source.SERVER,
      Log.severity.INFO
    )

    return null
  }
}

const deleteAssetFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null

    const deleteResult = await cloudinary.uploader.destroy(publicId)

    logger.capture(
      `Asset deleted: ${deleteResult.result}`,
      Log.type.DEBUG,
      Log.source.CLOUDINARY,
      Log.severity.SUCCESS
    )

    return deleteResult
  } catch (error) {
    logger.capture(
      `Delete Error: ${error.message}`,
      Log.type.ERROR,
      Log.source.CLOUDINARY,
      Log.severity.ERROR
    )

    return null
  }
}

export { uploadAssetToCloudinary, deleteAssetFromCloudinary }
