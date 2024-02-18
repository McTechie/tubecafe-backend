import { DB_NAME } from '../constants.js'

import mongoose from 'mongoose'
import Logger, { Log } from '../lib/Logger.js'

const logger = new Logger()

async function connectDB() {
  try {
    const conn = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    logger.capture(
      `DB Connected to ${conn.connection.host}`,
      Log.type.INFO,
      Log.source.DB,
      Log.severity.SUCCESS
    )
  } catch (error) {
    logger.capture(
      `Connection Error | ${error}`,
      Log.type.ERROR,
      Log.source.DB,
      Log.severity.ERROR
    )

    process.exit(1)
  }
}

export default connectDB
