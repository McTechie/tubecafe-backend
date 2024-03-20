import { asyncHandler } from '../utils/asyncHandler.js'

import ApiResponse from '../lib/ApiResponse.js'
import ApiError from '../lib/ApiError.js'
import Like from '../models/like.model.js'

const likeResource = asyncHandler(async (req, res) => {
  const userId = req.user._id
  const resourceId = req.resource._id

  const like = await Like.findOne({
    likedBy: userId,
    [resourceType]: resourceId,
  })

  if (like) {
    throw new ApiError(400, 'You have already liked this video')
  }

  const newLike = await Like.create({
    likedBy: userId,
    [resourceType]: resourceId,
  })

  res.status(201).json(new ApiResponse(201, {}))
})

const unlikeResource = asyncHandler(async (req, res) => {
  const userId = req.user._id
  const resourceId = req.resource._id

  const like = await Like.findOne({
    likedBy: userId,
    [resourceType]: resourceId,
  })

  if (!like) {
    throw new ApiError(400, 'You have not liked this video')
  }

  await like.remove()

  res.status(200).json(new ApiResponse(200, {}))
})

const getLikeCountByResourceId = asyncHandler(async (req, res) => {
  const resourceId = req.resource._id

  const likeCount = await Like.countDocuments({
    [resourceType]: resourceId,
  })

  res.status(200).json(new ApiResponse(200, { likeCount }))
})

export { likeResource, unlikeResource, getLikeCountByResourceId }
