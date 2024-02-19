import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadAssetToCloudinary } from '../services/cloudinary.js'

import ApiResponse from '../lib/ApiResponse.js'
import ApiError from '../lib/ApiError.js'
import User from '../models/user.model.js'

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken

    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(500, 'Error generating access and refresh tokens')
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body

  // check if all required fields are provided
  if ([username, email, password, fullName].some((field) => !field)) {
    throw new ApiError(400, 'All fields are required')
  }

  // check if user already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  })

  if (existingUser) {
    throw new ApiError(409, 'User already exists')
  }

  // upload avatar and coverImage to cloudinary
  const avatarLocalPath = req.files['avatar']?.[0]?.path
  const coverImageLocalPath = req.files['coverImage']?.[0]?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar is required')
  }

  // upload to cloudinary
  const avatarCloudinary = await uploadAssetToCloudinary(avatarLocalPath)
  const coverImageCloudinary = coverImageLocalPath
    ? await uploadAssetToCloudinary(coverImageLocalPath)
    : null

  if (!avatarCloudinary) {
    throw new ApiError(500, 'Error uploading avatar')
  }

  if (coverImageLocalPath && !coverImageCloudinary) {
    throw new ApiError(500, 'Error uploading coverImage')
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
    throw new ApiError(500, 'Error creating user')
  }

  const {
    password: _,
    refreshToken,
    ...userWithoutPasswordAndRefreshToken
  } = user.toObject()

  res
    .status(201)
    .json(
      new ApiResponse(201, 'User created', userWithoutPasswordAndRefreshToken)
    )
})

const loginUser = asyncHandler(async (req, res) => {
  console.log(req.body)

  const { email, username, password } = req.body

  // check if username or email is provided
  if (!username && !email) {
    throw new ApiError(400, 'Username or email is required')
  }

  // check if user exists
  const user = await User.findOne({
    $or: [
      { username: username?.toLowerCase() },
      { email: email?.toLowerCase() },
    ],
  })

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  // check if password is correct
  const isPasswordCorrect = await user.comparePassword(password)

  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Invalid password')
  }

  // generate access token and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  )

  // return user details and tokens
  const {
    password: _,
    refreshToken: __,
    ...userWithoutPasswordAndRefreshToken
  } = user.toObject()

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  }

  res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(200, 'Login successful', {
        user: userWithoutPasswordAndRefreshToken,
        accessToken,
        refreshToken,
      })
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  // remove refresh token from user
  await User.findByIdAndUpdate(
    { _id: req.user._id },
    { refreshToken: undefined },
    { new: true } // return updated user document if required
  )

  res
    .status(200)
    .clearCookie('accessToken')
    .clearCookie('refreshToken')
    .json(new ApiResponse(200, 'Logout successful'))
})

export { registerUser, loginUser, logoutUser }
