import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadAssetToCloudinary } from '../services/cloudinary.js'
import { PAGE_LIMIT } from '../constants.js'

import User from '../models/user.model.js'
import ApiError from '../lib/ApiError.js'
import ApiResponse from '../lib/ApiResponse.js'
import PaginatedApiResponse from '../lib/PaginatedApiResponse.js'

const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 0
  const limit = parseInt(req.query.limit) || PAGE_LIMIT

  const users = await User.find({})
    .select('-password -refreshToken')
    .limit(limit)
    .skip(page * limit)
    .exec()

  if (!users) {
    throw new ApiError(404, 'No users found')
  }

  const totalUsers = await User.countDocuments()
  const totalPages = Math.ceil(totalUsers / limit)

  res
    .status(200)
    .json(
      new PaginatedApiResponse(
        200,
        'Users fetched successfully',
        users,
        page,
        totalPages,
        limit
      )
    )
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

  if (!fullName && !email) {
    throw new ApiError(400, 'Full name or email is required')
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
  const newAvatarCloudinary = await uploadAssetToCloudinary(
    avatarLocalPath,
    req.user.username,
    'avatar'
  )

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
  const newCoverImageCloudinary = await uploadAssetToCloudinary(
    coverImageLocalPath,
    req.user.username,
    'cover_image'
  )

  if (!newCoverImageCloudinary) {
    throw new ApiError(500, 'Error uploading cover image')
  }

  // update user's cover image
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: newCoverImageCloudinary.url,
      },
    },
    { new: true }
  ).select('-password -refreshToken')

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
