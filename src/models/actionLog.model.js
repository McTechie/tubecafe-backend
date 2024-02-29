import mongoose from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const actionLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  source: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  severity: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
})

actionLogSchema.plugin(mongooseAggregatePaginate)

export default mongoose.model('ActionLog', actionLogSchema, 'action_logs')
