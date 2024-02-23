import { PAGE_LIMIT } from '../constants.js'

import ApiResponse from './ApiResponse.js'

class PaginatedApiResponse extends ApiResponse {
  constructor(
    statusCode,
    message,
    data,
    page = 0,
    totalPages = 1,
    limit = PAGE_LIMIT
  ) {
    super(statusCode, message, data)
    this.metadata = {
      page: page, // current page
      totalPage: totalPages, // total pages
      limit: limit, // items per page
      total: this.calculateTotal(data), // total items
    }
  }

  calculateTotal(data) {
    return data
      ? Array.isArray(data)
        ? data.length
        : Object.keys(data).length === 0
          ? 0
          : 1
      : 0
  }
}

export default PaginatedApiResponse
