import { v2 as cloudinary } from 'cloudinary'
import Logger, { Log } from '../lib/Logger.js'

import fs from 'fs'

const logger = new Logger()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadAssetToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null

    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    })

    // TODO: remove the console.log
    console.log(uploadResult)

    logger.capture(
      `Asset uploaded: ${uploadResult.public_id}`,
      Log.type.DEBUG,
      Log.source.CLOUDINARY,
      Log.severity.SUCCESS
    )

    return {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
      metadata: uploadResult.metadata,
    }
  } catch (error) {
    logger.capture(
      `Upload Error: ${error}`,
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
