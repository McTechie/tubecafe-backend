// this handler is used as a HOF to wrap the controller functions
// in a try/catch block to handle any errors that may occur

export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
