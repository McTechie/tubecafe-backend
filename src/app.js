import { routeLogger } from './middleware/routeLogger.middleware.js'
import { JSON_LIMIT, URL_LIMIT } from './constants.js'

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

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

// routes
import userRouter from './routes/user.routes.js'

app.use('/api/v1/users', userRouter)

export { app }
