import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadAssetToCloudinary } from '../services/cloudinary.js'
import { sendEmail } from '../services/nodemailer.js'

import jwt from 'jsonwebtoken'
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
  const avatarLocal = req.files['avatar']?.[0]
  const coverImageLocal = req.files['coverImage']?.[0]

  if (!avatarLocal?.path) {
    throw new ApiError(400, 'Avatar is required')
  }

  // verify file formats
  if (!avatarLocal.mimetype.startsWith('image')) {
    throw new ApiError(400, 'Invalid avatar format')
  }

  if (coverImageLocal?.path && !coverImageLocal.mimetype.startsWith('image')) {
    throw new ApiError(400, 'Invalid coverImage format')
  }

  // upload to cloudinary
  const avatarCloudinary = await uploadAssetToCloudinary(
    avatarLocal.path,
    username,
    'avatar'
  )
  const coverImageCloudinary = coverImageLocal
    ? await uploadAssetToCloudinary(
        coverImageLocal.path,
        username,
        'cover_image'
      )
    : null

  if (!avatarCloudinary) {
    throw new ApiError(500, 'Error uploading avatar')
  }

  if (coverImageLocal && !coverImageCloudinary) {
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
    { refreshToken: '' },
    { new: true } // return updated user document
  )

  res
    .status(200)
    .clearCookie('accessToken')
    .clearCookie('refreshToken')
    .json(new ApiResponse(200, 'Logout successful'))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, 'User details', req.user))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  // get refresh token from cookies or request body
  // this token is encrypted and can only be decrypted by the server
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized')
  }

  try {
    // check if refresh token is valid
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    if (!decodedToken) {
      throw new ApiError(401, 'Unauthorized')
    }

    // check if user exists
    const user = await User.findById(decodedToken._id)

    if (!user) {
      throw new ApiError(404, 'Invalid refresh token')
    }

    // check if refresh token is still valid
    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, 'Refresh token expired')
    }

    // generate new access token and refresh token
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id)

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    }

    res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(
        new ApiResponse(200, 'Tokens refreshed', {
          accessToken,
          refreshToken: newRefreshToken,
        })
      )
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token')
  }
})

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  // check if old password is correct
  const user = await User.findById(req.user?._id)

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  const isPasswordCorrect = await user.comparePassword(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Invalid old password')
  }

  // update password
  user.password = newPassword
  await user.save({ validateBeforeSave: false }) // don't run validation for all fields

  res.status(200).json(new ApiResponse(200, 'Password changed successfully'))
})

const forgotPassword = asyncHandler(async (req, res) => {
  // get user from request object
  const user = req.user

  // generate reset token
  const resetToken = user.generateResetPasswordToken()

  // save reset token and expiry date
  await user.save({ validateBeforeSave: false }) // don't run validation for all fields

  // send email with reset token
  await sendEmail({
    email: user.email,
    subject: 'TubeCafe Account | Password Reset Token',
    resetToken,
  })

  res
    .status(200)
    .json(new ApiResponse(200, 'Password reset token sent to email'))
})

const verifyResetToken = asyncHandler(async (req, res) => {
  const { resetToken } = req.body

  // check if reset token is valid
  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpires: { $gt: Date.now() },
  })

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token')
  }

  res.status(200).json(new ApiResponse(200, 'Reset token verified'))
})

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body

  // check if reset token is valid
  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpires: { $gt: Date.now() },
  })

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token')
  }

  // update password
  user.password = newPassword
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined

  await user.save({ validateBeforeSave: false }) // don't run validation for all fields

  res.status(200).json(new ApiResponse(200, 'Password reset successful'))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
  changePassword,
  forgotPassword,
  verifyResetToken,
  resetPassword,
}
