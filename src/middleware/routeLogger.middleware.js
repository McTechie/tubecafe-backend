import Logger from '../lib/Logger.js'

const logger = new Logger()

export function routeLogger() {
  return (req, res, next) => {
    logger.capture(
      `${req.method} -- ${req.originalUrl}`,
      'debug',
      'server',
      'debug'
    )
    next()
  }
}
