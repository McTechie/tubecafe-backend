import fs from 'fs'
import path from 'path'

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
