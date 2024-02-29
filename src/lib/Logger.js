import fs from 'fs'
import path from 'path'
import ApiError from './ApiError.js'
import ApiResponse from './ApiResponse.js'
import ActionLog from '../models/actionLog.model.js'

const LogType = {
  LOG: 'log',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
}

const LogSource = {
  SERVER: 'server',
  DB: 'db',
  CLOUDINARY: 'cloudinary',
  SWAGGER: 'swagger',
  STRIPE: 'stripe',
}

const LogSeverity = {
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  DEBUG: 'debug',
}

export const Log = {
  type: LogType,
  source: LogSource,
  severity: LogSeverity,
}

class Logger {
  constructor() {
    this.logs = []
  }

  get count() {
    return this.logs.length
  }

  createLogDirectory(logPath) {
    fs.mkdirSync(logPath, (err) => {
      if (err) {
        console.error(`
          [${timestamp}] | [LOGGER_ERROR] >> Error creating logs directory: ${err}
        `)
      }
    })
  }

  createNewLogFile(logPath, timestamp) {
    fs.renameSync(
      path.join(logPath, 'server.log'),
      path.join(logPath, `server_${new Date().getTime()}.log`),
      (err) => {
        if (err) {
          console.error(`
            [${timestamp}] | [LOGGER_ERROR] >> Error creating new log file: ${err}
          `)
        }
      }
    )
  }

  writeLogToFile(logPath, timestamp, source, severity, message) {
    fs.appendFileSync(
      path.join(logPath, 'server.log'),
      `[${timestamp}] | [${source.toUpperCase()}_${severity.toUpperCase()}] > ${message}\n`,
      (err) => {
        if (err)
          console.error(`
          [${timestamp}] | [LOGGER_ERROR] >> Error writing to log file: ${err}
        `)

        // Retrieve file size after writing to it
        const stats = fs.statSync(path.join(logPath, 'server.log'))
        const fileSizeInBytes = stats.size
        const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024)
        const shouldCreateNewLogFile = fileSizeInMegabytes > 1
        if (shouldCreateNewLogFile) this.createNewLogFile(logPath, timestamp)
      }
    )
  }

  writeLogToDB(log) {
    try {
      const newLog = new ActionLog(log)
      newLog.save()
      return new ApiResponse(201, 'Log written to DB')
    } catch (error) {
      return new ApiError(500, 'Error writing log to DB')
    }
  }

  capture(
    message,
    logType = Log.type.LOG, // log, error, warn, info, debug
    source = Log.type.SERVER, // server, db, cloudinary, stripe
    severity = Log.severity.INFO // info, success, error, warning, debug
  ) {
    const timestamp = new Date().toUTCString()

    this.logs.push({
      message,
      logType,
      source,
      severity,
      timestamp,
    })

    console[logType](
      `[${timestamp}] | [${source.toUpperCase()}_${severity.toUpperCase()}] >> ${message}`
    )

    // to prevent timeouts, write logs to DB in the background
    // setImmediate(() => {
    //   this.writeLogToDB({
    //     type: logType,
    //     source,
    //     severity,
    //     message,
    //     timestamp,
    //   })
    // })

    const logPath = path.join(process.cwd(), 'logs')

    if (fs.existsSync(logPath)) {
      this.writeLogToFile(logPath, timestamp, source, severity, message)
    } else {
      this.createLogDirectory(logPath)
      this.writeLogToFile(logPath, timestamp, source, severity, message)
    }
  }
}

export default Logger
