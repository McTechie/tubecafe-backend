import { asyncHandler } from '../utils/asyncHandler.js'
import { PAGE_LIMIT } from '../constants.js'
import { uploadAssetToCloudinary } from '../services/cloudinary.js'

import ApiResponse from '../lib/ApiResponse.js'
import ApiError from '../lib/ApiError.js'
import Video from '../models/video.model.js'

const getVideos = asyncHandler(async (req, res) => {
  const { sortBy, sortType, query, page = 1, limit = PAGE_LIMIT } = req.query

  // MongoDB Aggregation Pipeline
  // 1. Match videos based on query parameters
  // 2. Lookup owner details
  // 3. Unwind owner details
  // 4. Project only required fields
  const aggregateQuery = Video.aggregate([
    {
      $match: {
        $and: [
          query
            ? {
                $or: [
                  { title: { $regex: query, $options: 'i' } },
                  { description: { $regex: query, $options: 'i' } },
                ],
              }
            : {},
          { isPublished: true },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
      },
    },
    {
      $unwind: '$owner',
    },
    {
      $project: {
        title: 1,
        description: 1,
        videoUrl: 1,
        thumbnail: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        owner: {
          _id: 1,
          username: 1,
          avatar: 1,
        },
      },
    },
  ])

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { [sortBy || 'createdAt']: sortType || 'desc' },
  }

  const videos = await Video.aggregatePaginate(aggregateQuery, options)

  res
    .status(200)
    .json(new ApiResponse(200, 'Fetched videos successfully', videos))
})

const getVideoById = asyncHandler(async (req, res) => {
  const { id: _id } = req.params

  if (!_id) {
    throw new ApiError(400, 'Video ID is required')
  }

  const video = await Video.findOneAndUpdate(
    { _id, isPublished: true }, // Find video by id and isPublished
    { $inc: { views: 1 } }, // Increment views by 1
    { new: true }
  ).populate('owner', '_id username email')

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Fetched video successfully', video))
})

const togglePublishVideo = asyncHandler(async (req, res) => {
  const { id: _id } = req.params

  console.log('works')

  if (!_id) {
    throw new ApiError(400, 'Video ID is required')
  }

  const video = await Video.findOneAndUpdate(
    { _id },
    { $set: { isPublished: true } },
    { new: true }
  )

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Video published successfully', video))
})

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body

  // upload avatar and coverImage to cloudinary
  const videoFile = req.files['video']?.[0]
  const thumbnailFile = req.files['thumbnail']?.[0]

  if (!videoFile?.path) {
    throw new ApiError(400, 'Video is required')
  }

  if (!thumbnailFile?.path) {
    throw new ApiError(400, 'Thumbnail is required')
  }

  // verify file formats
  if (!videoFile.mimetype.startsWith('video')) {
    throw new ApiError(400, 'Invalid video format')
  }

  if (!thumbnailFile.mimetype.startsWith('image')) {
    throw new ApiError(400, 'Invalid thumbnail format')
  }

  // upload to cloudinary
  const videoCloudinary = await uploadAssetToCloudinary(videoFile.path)
  const thumbnailCloudinary = await uploadAssetToCloudinary(thumbnailFile.path)

  if (!videoCloudinary) {
    throw new ApiError(500, 'Error uploading video')
  }

  if (!thumbnailCloudinary) {
    throw new ApiError(500, 'Error uploading thumbnail')
  }

  const videoUrl = videoCloudinary.url
  const thumbnail = thumbnailCloudinary.url
  const duration = videoCloudinary.metadata.duration // in seconds

  // create video
  const video = await Video.create({
    title,
    description,
    videoUrl,
    thumbnail,
    duration,
    owner: req.user._id,
  })

  if (!video) {
    throw new ApiError(500, 'Error creating video')
  }

  res
    .status(201)
    .json(new ApiResponse(201, 'Video uploaded successfully', video))
})

export { getVideos, getVideoById, togglePublishVideo, uploadVideo }
