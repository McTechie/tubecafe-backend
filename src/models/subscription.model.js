import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, // the user who is subscribing
      ref: 'User',
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId, // the user who is being subscribed to
      ref: 'User',
    },
  },
  { timestamps: true }
)

export default mongoose.model('Subscription', subscriptionSchema)
