import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

async function connectDB() {
  try {
    const conn = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`[SUCCESS] | DB Connected to ${conn.connection.host}`)
  } catch (error) {
    console.error('[ERROR] | Connecting to the database |', error)
    process.exit(1)
  }
}

export default connectDB
