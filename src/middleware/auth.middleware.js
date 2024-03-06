import { asyncHandler } from '../utils/asyncHandler.js'

import jwt from 'jsonwebtoken'
import ApiError from '../lib/ApiError.js'
import User from '../models/user.model.js'

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // extract access token from cookies or header
    const accessToken = req.cookies?.accessToken || req.headers['authorization']

    if (!accessToken) {
      throw new ApiError(401, 'Invalid Access Token')
    }

    // decode access token
    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    )

    if (!decodedToken) {
      throw new ApiError(401, 'Invalid Access Token')
    }

    // extract user from database
    const user = await User.findById(decodedToken._id).select(
      '-password -refreshToken'
    )

    if (!user) {
      throw new ApiError(404, 'Invalid Access Token')
    }

    // attach user to request object
    req.user = user
    next()
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid Access Token')
  }
})

export const verifyEmailExists = asyncHandler(async (req, _, next) => {
  const { email } = req.body

  if (!email) {
    throw new ApiError(400, 'Email is required')
  }

  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  req.user = user
  next()
})
