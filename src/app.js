import { JSON_LIMIT, URL_LIMIT, PREFIX } from './constants.js'
import { routeLogger } from './middleware/routeLogger.middleware.js'
import { generateSwaggerYAML } from './swaggerConfig.js'

import fs from 'fs'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'

import authRouter from './routes/auth.routes.js'
import userRouter from './routes/user.routes.js'
import channelRouter from './routes/channel.routes.js'

const app = express()

// middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
)
app.use(routeLogger())
app.use(express.json({ limit: JSON_LIMIT }))
app.use(express.urlencoded({ extended: true, limit: URL_LIMIT }))
app.use(express.static('public'))
app.use(cookieParser())

// docs
generateSwaggerYAML()
const yamlDocs = fs.readFileSync('./docs/swagger.yaml', 'utf8')
const parsedDocs = YAML.parse(yamlDocs)
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(parsedDocs, {
    customCss: '.swagger-ui .topbar { display: none }',
  })
)

// routes
app.use(`${PREFIX}/auth`, authRouter)
app.use(`${PREFIX}/u`, userRouter) // u represents user
app.use(`${PREFIX}/c`, channelRouter) // c represents channel

export { app }
