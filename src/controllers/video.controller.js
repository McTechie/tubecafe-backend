import { asyncHandler } from '../utils/asyncHandler.js'
import { PAGE_LIMIT } from '../constants.js'
import {
  deleteAssetFromCloudinaryByURL,
  uploadAssetToCloudinary,
} from '../services/cloudinary.js'

import ApiResponse from '../lib/ApiResponse.js'
import ApiError from '../lib/ApiError.js'
import User from '../models/user.model.js'
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
  const { incrementView } = req.body

  if (!_id) {
    throw new ApiError(400, 'Video ID is required')
  }

  const video = await Video.findOneAndUpdate(
    { _id, isPublished: true }, // Find video by id and isPublished
    { $inc: { views: incrementView ? 1 : 0 } }, // Increment views by 1, only if it is viewable
    { new: true }
  ).populate('owner', '_id username email')

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  // add this video to user's watch history
  if (incrementView) {
    const owner = await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { watchHistory: _id },
    })

    if (!owner) {
      throw new ApiError(500, 'Error updating user watch history')
    }
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Fetched video successfully', video))
})

const togglePublishVideo = asyncHandler(async (req, res) => {
  const { id: _id } = req.params

  if (!_id) {
    throw new ApiError(400, 'Video ID is required')
  }

  const video = await Video.findOneAndUpdate(
    { _id },
    { $set: { isPublished: req.body.isPublished } },
    { new: true }
  )

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Video toggled successfully', video))
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

const updateVideoAsset = asyncHandler(async (req, res) => {
  const { id: _id } = req.params

  if (!_id) {
    throw new ApiError(400, 'Video ID is required')
  }

  const video = await Video.findOne({ _id })

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  const newVideoFile = req.files['video']?.[0]
  const newThumbnailFile = req.files['thumbnail']?.[0]

  if (newVideoFile?.path) {
    // delete existing video
    const existingVideoUrl = video.videoUrl

    try {
      await deleteAssetFromCloudinaryByURL(existingVideoUrl, 'video')
    } catch (error) {
      throw new ApiError(500, error.message)
    }

    // verify file formats
    if (!newVideoFile.mimetype.startsWith('video')) {
      throw new ApiError(400, 'Invalid video format')
    }

    // upload to cloudinary
    const newVideoCloudinary = await uploadAssetToCloudinary(newVideoFile.path)

    if (!newVideoCloudinary) {
      throw new ApiError(500, 'Error uploading video')
    }

    video.videoUrl = newVideoCloudinary.url
    video.duration = newVideoCloudinary.metadata.duration // in seconds
  }

  if (newThumbnailFile?.path) {
    // delete existing thumbnail
    const existingThumbnail = video.thumbnail

    try {
      await deleteAssetFromCloudinaryByURL(existingThumbnail, 'image')
    } catch (error) {
      throw new ApiError(500, error.message)
    }

    // verify file formats
    if (!newThumbnailFile.mimetype.startsWith('image')) {
      throw new ApiError(400, 'Invalid thumbnail format')
    }

    // upload to cloudinary
    const newThumbnailCloudinary = await uploadAssetToCloudinary(
      newThumbnailFile.path
    )

    if (!newThumbnailCloudinary) {
      throw new ApiError(500, 'Error uploading thumbnail')
    }

    video.thumbnail = newThumbnailCloudinary.url
  }

  await video.save()

  res
    .status(200)
    .json(new ApiResponse(200, 'Video asset updated successfully', video))
})

const updateVideo = asyncHandler(async (req, res) => {
  const { id: _id } = req.params
  const { title, description } = req.body

  if (!_id) {
    throw new ApiError(400, 'Video ID is required')
  }

  if (!title && !description) {
    throw new ApiError(400, 'Title or description is required')
  }

  const video = await Video.findOneAndUpdate(
    { _id },
    { $set: { title, description } },
    { new: true }
  )

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Video updated successfully', video))
})

const deleteVideo = asyncHandler(async (req, res) => {
  const { id: _id } = req.params

  if (!_id) {
    throw new ApiError(400, 'Video ID is required')
  }

  const video = await Video.findOne({ _id })

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  // delete video and thumbnail from cloudinary
  try {
    await deleteAssetFromCloudinaryByURL(video.videoUrl, 'video')
    await deleteAssetFromCloudinaryByURL(video.thumbnail, 'image')
  } catch (error) {
    throw new ApiError(500, error.message)
  }

  await video.remove()

  res
    .status(200)
    .json(new ApiResponse(200, 'Video deleted successfully', video))
})

export {
  getVideos,
  getVideoById,
  togglePublishVideo,
  uploadVideo,
  updateVideoAsset,
  updateVideo,
  deleteVideo,
}
