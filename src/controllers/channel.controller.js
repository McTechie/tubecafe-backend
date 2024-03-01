import { asyncHandler } from '../utils/asyncHandler.js'
import { PAGE_LIMIT } from '../constants.js'

import User from '../models/user.model.js'
import Video from '../models/video.model.js'
import ApiError from '../lib/ApiError.js'
import ApiResponse from '../lib/ApiResponse.js'

const getChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params

  if (!username?.trim()) {
    throw new ApiError(400, 'Username is required')
  }

  // MongoDB aggregation pipeline to get channel profile
  // 1. Match the user with the username
  // 2. Lookup the subscriptions collection to get the channel subscribers
  // 3. Lookup the subscriptions collection to get the channels the user is subscribed to
  // 4. Add channelSubscribers, subscribedTo, and isSubscribed fields
  // 5. Project the fields to return

  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'channelSubscribers',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
      },
    },
    {
      $addFields: {
        subscriberCount: { $size: '$channelSubscribers' },
        subscribedToCount: { $size: '$subscribedTo' },
        isSubscribed: {
          $in: [req.user._id, '$channelSubscribers.subscriber'],
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        createdAt: 1,
      },
    },
  ])

  if (!channel?.length) {
    throw new ApiError(404, 'Channel not found')
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, 'Channel profile fetched successfully', channel[0])
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
  const { username } = req.params
  const { sortBy, sortType, query, page = 1, limit = PAGE_LIMIT } = req.query

  if (!username?.trim()) {
    throw new ApiError(400, 'Username is required')
  }

  const channel = await User.findOne({ username: username.toLowerCase() })

  if (!channel) {
    throw new ApiError(404, 'Channel not found')
  }

  // MongoDB Aggregation Pipeline
  // 1. Match videos based on query parameters and channel id
  // 2. Lookup owner details
  // 3. Unwind owner details
  // 4. Project only required fields
  const aggregateQuery = Video.aggregate([
    {
      $match: {
        $and: [
          { owner: channel._id },
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

export { getChannelProfile, getChannelVideos }
