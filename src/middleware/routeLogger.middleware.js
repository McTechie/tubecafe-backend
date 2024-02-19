import Logger, { Log } from '../lib/Logger.js'

const logger = new Logger()

export function routeLogger() {
  return (req, _, next) => {
    logger.capture(
      `${req.method} -- ${req.originalUrl}`,
      Log.type.DEBUG,
      Log.source.SERVER,
      Log.severity.DEBUG
    )

    next()
  }
}
