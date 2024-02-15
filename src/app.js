import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { JSON_LIMIT, URL_LIMIT } from './constants'

const app = express()

// middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
)

app.use(express.json({ limit: JSON_LIMIT }))

app.use(express.urlencoded({ extended: true, limit: URL_LIMIT }))

app.use(express.static('public'))

app.use(cookieParser())

export { app }
