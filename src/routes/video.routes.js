import { Router } from 'express'
import { upload } from '../middleware/multer.middleware.js'
import { verifyJWT } from '../middleware/auth.middleware.js'
import {
  getVideos,
  getVideoById,
  togglePublishVideo,
  uploadVideo,
} from '../controllers/video.controller.js'

const router = Router()

router.route('/').get(verifyJWT, getVideos)
router.route('/upload').post(
  verifyJWT,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  uploadVideo
)
router.route('/toggle-publish/:id').put(verifyJWT, togglePublishVideo)
router.route('/:id').get(verifyJWT, getVideoById)
// router.route('/:id').delete(verifyJWT, deleteVideo)
// router.route('/:id').put(verifyJWT, updateVideo)

export default router
