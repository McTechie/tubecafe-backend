import mongoose from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const playlistSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    thumbnail: {
      type: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    videos: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Video',
        },
        order: {
          type: Number, // Records the  order of the video in the playlist
          required: true,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
)

// add pagination plugin
playlistSchema.plugin(mongooseAggregatePaginate)

export default mongoose.model('Playlist', playlistSchema)
