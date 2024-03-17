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

const deleteAssetFromCloudinary = async (publicId, resourceType) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required')
    }

    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    })

    if (res.result !== 'ok') {
      throw new Error(res.result)
    }

    logger.capture(
      `Asset deleted: ${publicId}`,
      Log.type.DEBUG,
      Log.source.CLOUDINARY,
      Log.severity.SUCCESS
    )
  } catch (error) {
    logger.capture(
      `Delete Error: ${error.message} | Public ID: ${publicId} | Resource Type: ${resourceType}`,
      Log.type.ERROR,
      Log.source.CLOUDINARY,
      Log.severity.ERROR
    )

    throw new Error('Error deleting asset: ' + error.message)
  }
}

const deleteAssetFromCloudinaryByURL = async (url, resourceType) => {
  if (!url) {
    throw new Error('URL is required')
  }

  const publicId = url.split('/').pop().split('.')[0]

  await deleteAssetFromCloudinary(publicId, resourceType)
}

export {
  uploadAssetToCloudinary,
  deleteAssetFromCloudinary,
  deleteAssetFromCloudinaryByURL,
}
