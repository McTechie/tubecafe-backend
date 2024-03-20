import { asyncHandler } from '../utils/asyncHandler.js'
import { PAGE_LIMIT } from '../constants.js'

import ApiResponse from '../lib/ApiResponse.js'
import ApiError from '../lib/ApiError.js'
import Comment from '../models/comment.model.js'
import Video from '../models/video.model.js'

const createComment = asyncHandler(async (req, res) => {
  const { videoId, text } = req.body
  const userId = req.user._id

  if (!videoId || !text) {
    throw new ApiError(400, 'videoId and text are required')
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  const newComment = await Comment.create({
    content: text,
    video: videoId,
    owner: userId,
  })

  res.status(201).json(new ApiResponse(201, newComment))
})

const getCommentsOnVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { page = 1, limit = PAGE_LIMIT } = req.query

  if (!videoId) {
    throw new ApiError(400, 'videoId is required')
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  const aggregateQuery = User.aggregate([
    { $sort: { createdAt: -1 } }, // Sort by createdAt field
    { $project: { password: 0, refreshToken: 0 } }, // Exclude fields from the result
    { $skip: (page - 1) * limit }, // Skip documents based on pagination
  ])

  const comments = Comment.aggregatePaginate(aggregateQuery, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  })

  if (!comments) {
    throw new ApiError(404, 'No comments found')
  }

  res.status(200).json(new ApiResponse(200, comments))
})

const replyToComment = asyncHandler(async (req, res) => {
  const { id: _id } = req.params
  const { text } = req.body
  const userId = req.user._id

  if (!_id || !text) {
    throw new ApiError(400, 'commentId and text are required')
  }

  const comment = await Comment.findById(_id)

  if (!comment) {
    throw new ApiError(400, 'Comment not found')
  }

  const newComment = await Comment.create({
    content: text,
    video: comment.video,
    owner: userId,
  })

  comment.replies.push(newComment._id)
  await comment.save()

  res.status(201).json(new ApiResponse(201, newComment))
})

const deleteComment = asyncHandler(async (req, res) => {
  const { id: _id } = req.params
  const userId = req.user._id

  if (!_id) {
    throw new ApiError(400, 'commentId is required')
  }

  const comment = await Comment.findOneAndDelete({
    _id,
    owner: userId,
  })

  if (!comment) {
    throw new ApiError(400, 'Comment not found')
  }

  res.status(200).json(new ApiResponse(200, comment))
})

export { createComment, getCommentsOnVideo, replyToComment, deleteComment }
