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
} from '../controllers/user.controller.js'

const router = Router()

router.route('/').get(verifyJWT, getUsers)
router
  .route('/update-avatar')
  .put(
    verifyJWT,
    upload.fields([{ name: 'avatar', maxCount: 1 }]),
    updateUserAvatar
  )
router
  .route('/update-cover-image')
  .put(
    verifyJWT,
    upload.fields([{ name: 'coverImage', maxCount: 1 }]),
    updateUserCoverImage
  )
router.route('/:id').get(verifyJWT, getUserById)
router.route('/:id').put(verifyJWT, updateUserAccount)
router.route('/:id').delete(verifyJWT, deleteUserAccount)

export default router
