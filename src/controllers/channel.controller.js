import { asyncHandler } from '../utils/asyncHandler.js'

import User from '../models/user.model.js'
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

export { getChannelProfile }
