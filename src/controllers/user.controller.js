import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadAssetToCloudinary } from '../services/cloudinary.js'

import ApiResponse from '../lib/ApiResponse.js'
import ApiError from '../lib/ApiError.js'
import User from '../models/user.model.js'

const registerUser = asyncHandler(async (req, res, next) => {
  const { username, email, password, fullName } = req.body

  // check if all required fields are provided
  if ([username, email, password, fullName].some((field) => !field)) {
    return next(new ApiError(400, 'All fields are required'))
  }

  // check if user already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  })

  if (existingUser) {
    return next(new ApiError(409, 'User already exists'))
  }

  // upload avatar and coverImage to cloudinary
  const avatarLocalPath = req.files['avatar']?.[0]?.path
  const coverImageLocalPath = req.files['coverImage']?.[0]?.path

  if (!avatarLocalPath) {
    return next(new ApiError(400, 'Avatar is required'))
  }

  // upload to cloudinary
  const avatarCloudinary = await uploadAssetToCloudinary(avatarLocalPath)
  const coverImageCloudinary = coverImageLocalPath
    ? await uploadAssetToCloudinary(coverImageLocalPath)
    : null

  if (!avatarCloudinary) {
    return next(new ApiError(500, 'Error uploading avatar'))
  }

  if (coverImageLocalPath && !coverImageCloudinary) {
    return next(new ApiError(500, 'Error uploading coverImage'))
  }

  // create user
  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    fullName,
    password,
    avatar: avatarCloudinary.url,
    coverImage: coverImageCloudinary?.url || '',
  })

  if (!user) {
    return next(new ApiError(500, 'Error creating user'))
  }

  const {
    password: _,
    refreshToken,
    ...userWithoutPasswordAndRefreshToken
  } = user.toObject()

  return res
    .status(201)
    .json(
      new ApiResponse(201, 'User created', userWithoutPasswordAndRefreshToken)
    )
})

export { registerUser }
