import { asyncHandler } from '../utils/asyncHandler.js'
import { PAGE_LIMIT } from '../constants.js'

import ApiResponse from '../lib/ApiResponse.js'
import ApiError from '../lib/ApiError.js'
import ActionLog from '../models/actionLog.model.js'

const getActionLogs = asyncHandler(async (req, res) => {
  const { type, source, severity, page = 1, limit = PAGE_LIMIT } = req.query

  const aggregateQuery = ActionLog.aggregate([
    {
      $match: {
        // Filter by type, source, and severity
        $and: [
          type ? { type } : {},
          source ? { source } : {},
          severity ? { severity } : {},
        ],
      },
    },
    { $sort: { timestamp: -1 } },
  ])

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  }

  const actionLogs = await ActionLog.aggregatePaginate(aggregateQuery, options)

  if (!actionLogs) {
    throw new ApiError(404, 'No action logs found')
  }

  res.status(200).json(new ApiResponse(200, actionLogs))
})

export { getActionLogs }
