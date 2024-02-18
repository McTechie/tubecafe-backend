import { app } from './app.js'

import dotenv from 'dotenv'
import connectDB from './db/config.js'
import Logger, { Log } from './lib/Logger.js'

// env variables
dotenv.config({ path: './.env' })

// port
const PORT = process.env.PORT || 8000

const logger = new Logger()

// connect to db
connectDB()
  .then(() => {
    // start listening for requests
    app.listen(PORT, () => {
      logger.capture(
        `Running on port ${PORT}`,
        Log.type.INFO,
        Log.source.SERVER,
        Log.severity.SUCCESS
      )
    })
  })
  .catch((err) => {
    logger.capture(
      `Unable to Start Server: ${err.message}`,
      Log.type.ERROR,
      Log.source.SERVER,
      Log.severity.ERROR
    )
  })
