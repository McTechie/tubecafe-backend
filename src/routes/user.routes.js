import { Router } from 'express'
import { upload } from '../middleware/multer.middleware.js'
import { verifyJWT } from '../middleware/auth.middleware.js'
import {
  getUsers,
  getUserById,
  updateUserAccount,
  deleteUserAccount,
  updateUserAvatar,
  updateUserCoverImage,
  getWatchHistory,
} from '../controllers/user.controller.js'

const router = Router()

router.route('/').get(verifyJWT, getUsers)
router
  .route('/update-avatar')
  .put(verifyJWT, upload.single('avatar'), updateUserAvatar)
router
  .route('/update-cover-image')
  .put(verifyJWT, upload.single('coverImage'), updateUserCoverImage)
router.route('/:id').get(verifyJWT, getUserById)
router.route('/:id').put(verifyJWT, updateUserAccount)
router.route('/:id').delete(verifyJWT, deleteUserAccount)
router.route('/:id/watch-history').get(verifyJWT, getWatchHistory)

export default router
