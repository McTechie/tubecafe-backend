import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import Logger, { Log } from './lib/Logger.js'

const logger = new Logger()

const routesDir = path.join('./src/routes')

const convertToYAML = (obj) => {
  const swaggerYAML = {
    swagger: '2.0',
    info: {
      title: "TubeCafe's API",
      version: '1.0.0',
      description: 'The backend app for TubeCafe, a video sharing platform.',
      contact: {
        name: 'Mcvean Soans (McTechie)',
        url: 'https://github.com/McTechie',
      },
    },
    basePath: '/api/v1',
    paths: obj,
  }

  return YAML.stringify(swaggerYAML)
}

const generateSwaggerYAML = () => {
  try {
    // check if the directory exists
    if (!fs.existsSync(routesDir)) {
      logger.capture(
        `The routes directory does not exist.`,
        Log.type.ERROR,
        Log.source.SWAGGER,
        Log.severity.ERROR
      )
    } else {
      let paths = {}

      // Read each file in the routes directory
      fs.readdirSync(routesDir).forEach(async (file) => {
        // Each route file exports an Express router
        const route = await import(path.join('..', routesDir, file))
        const routePath = `/${file.replace('.routes.js', '')}` // auth, user, channel

        // Iterate through the routes defined in the file
        route.default.stack.forEach((layer) => {
          const method = Object.keys(layer.route.methods)[0]
          const route =
            (['/auth', '/admin'].includes(routePath)
              ? routePath
              : routePath.substring(0, 2)) + layer.route.path

          if (!paths[route]) paths[route] = {}

          paths[route][method] = {
            tags: [
              routePath.substring(1).charAt(0).toUpperCase() +
                routePath.substring(2),
            ],
          }
        })

        logger.capture(
          `Swagger YAML generated successfully.`,
          Log.type.INFO,
          Log.source.SWAGGER,
          Log.severity.INFO
        )

        fs.writeFileSync(
          path.join('docs', 'swagger.yaml'),
          convertToYAML(paths)
        )
      })
    }
  } catch (error) {
    logger.capture(
      `Error generating Swagger YAML: ${error}`,
      Log.type.ERROR,
      Log.source.SWAGGER,
      Log.severity.ERROR
    )
  }
}

export { generateSwaggerYAML }
