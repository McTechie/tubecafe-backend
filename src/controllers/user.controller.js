import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadAssetToCloudinary } from '../services/cloudinary.js'

import ApiResponse from '../lib/ApiResponse.js'
import ApiError from '../lib/ApiError.js'
import User from '../models/user.model.js'

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password -refreshToken')

  if (!users) {
    throw new ApiError(404, 'No users found')
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Users fetched successfully', users))
})

const getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.id

  if (!userId) {
    throw new ApiError(400, 'User ID is required')
  }

  const user = await User.findById(userId).select('-password -refreshToken')

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  res.status(200).json(new ApiResponse(200, 'User fetched successfully', user))
})

const updateUserAccount = asyncHandler(async (req, res) => {
  const userId = req.params.id

  if (!userId) {
    throw new ApiError(400, 'User ID is required')
  }

  const { fullName, email } = req.body

  if (!fullName || !email) {
    throw new ApiError(400, 'Full name and email are required')
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select('-password -refreshToken')

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  res.status(200).json(new ApiResponse(200, 'User updated successfully', user))
})

const deleteUserAccount = asyncHandler(async (req, res) => {
  const userId = req.params.id

  if (!userId) {
    throw new ApiError(400, 'User ID is required')
  }

  const user = await User.findByIdAndDelete(userId).select(
    '-password -refreshToken'
  )

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  res.status(200).json(new ApiResponse(200, 'User deleted successfully', user))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  // get the local path of the uploaded avatar
  const avatarLocalPath = req.files['avatar']?.[0]?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar is required')
  }

  // upload to cloudinary
  const newAvatarCloudinary = await uploadAssetToCloudinary(avatarLocalPath)

  if (!newAvatarCloudinary) {
    throw new ApiError(500, 'Error uploading avatar')
  }

  // update user's avatar
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: newAvatarCloudinary.url,
      },
    },
    { new: true }
  ).select('-password -refreshToken')

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Avatar updated successfully', user))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // get the local path of the uploaded avatar
  const coverImageLocalPath = req.files['coverImage']?.[0]?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, 'Avatar is required')
  }

  // upload to cloudinary
  const newCoverImageCloudinary =
    await uploadAssetToCloudinary(coverImageLocalPath)

  if (!newCoverImageCloudinary) {
    throw new ApiError(500, 'Error uploading cover image')
  }

  // update user's avatar
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: newCoverImageCloudinary.url,
      },
    },
    { new: true }
  ).select('-password -refreshToken')

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Cover Image updated successfully', user))
})

export {
  getUsers,
  getUserById,
  updateUserAccount,
  deleteUserAccount,
  updateUserAvatar,
  updateUserCoverImage,
}
