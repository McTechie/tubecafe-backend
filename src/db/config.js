import { DB_NAME } from '../constants.js'

import mongoose from 'mongoose'
import Logger from '../lib/Logger.js'

const logger = new Logger()

async function connectDB() {
  try {
    const conn = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    logger.capture(
      `DB Connected to ${conn.connection.host}`,
      'info',
      'db',
      'success'
    )
  } catch (error) {
    logger.capture(`Connection Error | ${error}`, 'error', 'db', 'error')
    process.exit(1)
  }
}

export default connectDB
