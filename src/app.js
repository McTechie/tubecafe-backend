import { JSON_LIMIT, URL_LIMIT, PREFIX } from './constants.js'
import { routeLogger } from './middleware/routeLogger.middleware.js'
import { generateSwaggerYAML } from './swaggerConfig.js'

import fs from 'fs'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'

import authRouter from './routes/auth.routes.js'
import userRouter from './routes/user.routes.js'
import channelRouter from './routes/channel.routes.js'

const app = express()

// docs
generateSwaggerYAML()
const yamlDocs = fs.readFileSync('./docs/swagger.yaml', 'utf8')
const parsedDocs = YAML.parse(yamlDocs)

// rate limiter
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
})

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
app.use(limiter)
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
