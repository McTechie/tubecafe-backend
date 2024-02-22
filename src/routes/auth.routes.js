import { Router } from 'express'
import { upload } from '../middleware/multer.middleware.js'
import { verifyJWT } from '../middleware/auth.middleware.js'
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
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
router.route('/logout').post(verifyJWT, logoutUser) // secured route
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT, changePassword) // secured route
router.route('/me').get(verifyJWT, getCurrentUser) // secured route

export default router
