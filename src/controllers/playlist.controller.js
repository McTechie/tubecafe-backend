import { asyncHandler } from '../utils/asyncHandler.js'
import {
  deleteAssetFromCloudinaryByURL,
  uploadAssetToCloudinary,
} from '../services/cloudinary.js'

import mongoose from 'mongoose'
import ApiResponse from '../lib/ApiResponse.js'
import ApiError from '../lib/ApiError.js'
import Playlist from '../models/playlist.model.js'

const createPlaylist = asyncHandler(async (req, res) => {
  const { title, description } = req.body

  if (!title || !description) {
    throw new ApiError(400, 'Title and description are required')
  }

  // upload thumbnail to cloudinary
  const thumbnailFile = req.files['thumbnail']?.[0]

  // verify file format
  if (thumbnailFile?.path && !thumbnailFile.mimetype.startsWith('image')) {
    throw new ApiError(400, 'Invalid thumbnail format')
  }

  // upload to cloudinary
  const thumbnailCloudinary = thumbnailFile
    ? await uploadAssetToCloudinary(thumbnailFile.path)
    : null

  if (thumbnailFile && !thumbnailCloudinary) {
    throw new ApiError(500, 'Error uploading thumbnail')
  }

  const thumbnail = thumbnailCloudinary?.url || ''

  // create playlist
  const playlist = await Playlist.create({
    title,
    description,
    thumbnail,
    owner: req.user._id,
  })

  if (!playlist) {
    throw new ApiError(500, 'Error creating playlist')
  }

  res
    .status(201)
    .json(new ApiResponse(201, 'Playlist created successfully', playlist))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { id: _id } = req.params

  const { videoId } = req.body

  if (!_id) {
    throw new ApiError(400, 'Playlist ID is required')
  }

  if (!videoId) {
    throw new ApiError(400, 'Video ID is required')
  }

  // Fetch the current playlist
  const playlist = await Playlist.findById(_id)

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found')
  }

  // Calculate the order for the new video
  const maxOrder = playlist.videos.reduce(
    (max, video) => Math.max(max, video.order),
    0
  )
  const order = maxOrder + 1

  // Push the new video to the playlist
  playlist.videos.push({ _id: videoId, order })

  // Save the updated playlist
  await playlist.save()

  res
    .status(200)
    .json(new ApiResponse(200, 'Video added to playlist successfully', {}))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { id: _id } = req.params
  const { videoId, order } = req.body

  if (!_id) {
    throw new ApiError(400, 'Playlist ID is required')
  }

  if (!videoId || !order) {
    throw new ApiError(400, 'Video ID and order are required')
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { _id },
    {
      $pull: {
        videos: { _id: videoId, order },
      },
    },
    { new: true } // Return the updated document
  )

  if (!updatedPlaylist) {
    throw new ApiError(404, 'Playlist not found')
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Video removed from playlist successfully', {}))
})

// TODO: test the functionality of this endpoint
const reorderVideosInPlaylist = asyncHandler(async (req, res) => {
  const { id: _id } = req.params
  const { currentIdx, destinationIdx } = req.body

  if (!_id) {
    throw new ApiError(400, 'Playlist ID is required')
  }

  if (!currentIdx || !destinationIdx) {
    throw new ApiError(400, 'Current and destination indices are required')
  }

  // Fetch the current playlist
  const playlist = await Playlist.findById(_id)

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found')
  }

  // Validate indexes
  if (currentIdx < 0 || currentIdx >= playlist.videos.length) {
    throw new ApiError(400, 'Invalid current index')
  }

  if (destinationIdx < 0 || destinationIdx >= playlist.videos.length) {
    throw new ApiError(400, 'Invalid destination index')
  }

  // Reorder the video
  const movedVideo = playlist.videos.splice(currentIdx, 1)[0]
  playlist.videos.splice(destinationIdx, 0, movedVideo)

  // Update order values
  playlist.videos.forEach((video, index) => {
    video.order = index
  })

  // Save the updated playlist
  const updatedPlaylist = await playlist.save()

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        'Videos reordered in playlist successfully',
        updatedPlaylist
      )
    )
})

const togglePublishPlaylist = asyncHandler(async (req, res) => {
  const { id: _id } = req.params

  if (!_id) {
    throw new ApiError(400, 'Playlist ID is required')
  }

  const playlist = await Playlist.findOneAndUpdate(
    { _id },
    { $set: { isPublished: req.body.isPublished } },
    { new: true }
  )

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found')
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Playlist toggled successfully', playlist))
})

const updatePlaylistThumbnail = asyncHandler(async (req, res) => {
  const { id: _id } = req.params

  if (!_id) {
    throw new ApiError(400, 'Playlist ID is required')
  }

  const playlist = await Playlist.findOne({ _id })

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found')
  }

  const newThumbnailFile = req.files['thumbnail']?.[0]

  if (newThumbnailFile?.path) {
    // delete existing thumbnail
    const existingThumbnail = playlist.thumbnail

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

    playlist.thumbnail = newThumbnailCloudinary.url
  }

  await playlist.save()

  res
    .status(200)
    .json(new ApiResponse(200, 'Thumbnail updated successfully', playlist))
})

const updatePlaylist = asyncHandler(async (req, res) => {
  const { id: _id } = req.params
  const { title, description } = req.body

  if (!_id) {
    throw new ApiError(400, 'Playlist ID is required')
  }

  if (!title && !description) {
    throw new ApiError(400, 'Title or description is required')
  }

  const playlist = await Playlist.findOneAndUpdate(
    { _id },
    { $set: { title, description } },
    { new: true }
  )

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found')
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Playlist updated successfully', playlist))
})

const deletePlaylist = asyncHandler(async (req, res) => {
  const { id: _id } = req.params

  if (!_id) {
    throw new ApiError(400, 'Playlist ID is required')
  }

  const playlist = await Playlist.findOne({ _id })

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found')
  }

  // delete thumbnail from cloudinary
  try {
    await deleteAssetFromCloudinaryByURL(playlist.thumbnail, 'image')
  } catch (error) {
    throw new ApiError(500, error.message)
  }

  await playlist.remove()

  res
    .status(200)
    .json(new ApiResponse(200, 'Playlist deleted successfully', playlist))
})

const getPlaylistVideos = asyncHandler(async (req, res) => {
  const { id: _id } = req.params
  const { page, limit } = req.query

  if (!_id) {
    throw new ApiError(400, 'Playlist ID is required')
  }

  const playlist = await Playlist.findOne({ _id })

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found')
  }

  // MongoDB aggregation pipeline
  // 1. Match the playlist with the given ID
  // 2. Lookup video details
  // 3. Unwind video details
  // 4. Lookup owner details
  // 5. Unwind owner details
  // 6. Project only required fields + isDeletable field + isReorderable field

  // _id is ObjectId type, so we need to convert it to ObjectId type
  // isDeletable field: true if the current user is the owner of the playlist
  // isReorderable field: true if the current user is the owner of the playlist

  const aggregateQuery = Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(_id),
      },
    },
    {
      $unwind: '$videos', // Separate videos into individual documents
    },
    {
      $lookup: {
        from: 'videos', // Lookup video details
        localField: 'videos._id',
        foreignField: '_id',
        as: 'videos',
      },
    },
    {
      $unwind: '$videos', // Unwind video details (convert from array[0] to object)
    },
    {
      $lookup: {
        from: 'users', // Lookup owner details
        localField: 'videos.owner',
        foreignField: '_id',
        as: 'videos.owner',
      },
    },
    {
      $unwind: '$videos.owner', // Unwind owner details
    },
    {
      $project: {
        _id: '$videos._id',
        title: '$videos.title',
        description: '$videos.description',
        thumbnail: '$videos.thumbnail',
        videoUrl: '$videos.videoUrl',
        isPublished: '$videos.isPublished',
        order: '$videos.order',
        isDeletable: {
          $cond: {
            if: { $eq: ['$owner._id', req.user._id] },
            then: true,
            else: false,
          },
        },
        isReorderable: {
          $cond: {
            if: { $eq: ['$owner._id', req.user._id] },
            then: true,
            else: false,
          },
        },
        owner: {
          _id: '$videos.owner._id',
          username: '$videos.owner.username',
          avatar: '$videos.owner.avatar',
        },
      },
    },
  ])

  const videos = await Playlist.aggregatePaginate(aggregateQuery, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  })

  res
    .status(200)
    .json(new ApiResponse(200, 'Fetched playlist videos successfully', videos))
})

export {
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  reorderVideosInPlaylist,
  togglePublishPlaylist,
  updatePlaylistThumbnail,
  updatePlaylist,
  deletePlaylist,
  getPlaylistVideos,
}
