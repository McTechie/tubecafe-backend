import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadAssetToCloudinary } from '../services/cloudinary.js'
import { PAGE_LIMIT } from '../constants.js'

import mongoose from 'mongoose'
import User from '../models/user.model.js'
import ApiError from '../lib/ApiError.js'
import ApiResponse from '../lib/ApiResponse.js'

const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = PAGE_LIMIT } = req.query

  const aggregateQuery = User.aggregate([
    { $sort: { createdAt: -1 } }, // Sort by createdAt field
    { $project: { password: 0, refreshToken: 0 } }, // Exclude fields from the result
    { $skip: (page - 1) * limit }, // Skip documents based on pagination
  ])

  const users = await User.aggregatePaginate(aggregateQuery, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  })

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

  // verify file format
  if (!avatarLocalPath.mimetype.startsWith('image')) {
    throw new ApiError(400, 'Invalid avatar format')
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

  // verify file format
  if (!coverImageLocalPath.mimetype.startsWith('image')) {
    throw new ApiError(400, 'Invalid cover image format')
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

const getWatchHistory = asyncHandler(async (req, res) => {
  // MongoDB aggregation pipeline to get user's watch history
  // 1. Match the user
  // 2. Lookup the videos collection to get the watch history
  // 3. Sub-pipeline to lookup the users collection to get the owner of the video
  // 4. Add the owner to the video
  // 5. Another sub-pipeline to project only the required fields of the owner
  // 6. Add the owner field to the watch history

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'watchHistory',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $arrayElemAt: ['$owner', 0],
              },
            },
          },
        ],
      },
    },
  ])

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        'Watch history fetched successfully',
        user[0].watchHistory
      )
    )
})

export {
  getUsers,
  getUserById,
  updateUserAccount,
  deleteUserAccount,
  updateUserAvatar,
  updateUserCoverImage,
  getWatchHistory,
}
