import { Router } from 'express'
import { upload } from '../middleware/multer.middleware.js'
import { verifyEmailExists, verifyJWT } from '../middleware/auth.middleware.js'
import {
  loginUser,
  logoutUser,
  registerUser,
  getCurrentUser,
  refreshAccessToken,
  changePassword,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} from '../controllers/auth.controller.js'

const router = Router()

router.route('/register').post(
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  registerUser
)
router.route('/login').post(loginUser)
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/me').get(verifyJWT, getCurrentUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT, changePassword)
router.route('/forgot-password').post(verifyEmailExists, forgotPassword)
router.route('/verify-reset-token').post(verifyResetToken)
router.route('/reset-password').post(resetPassword)

export default router
