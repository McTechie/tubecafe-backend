import { Router } from 'express'
import { upload } from '../middleware/multer.middleware.js'
import { verifyJWT } from '../middleware/auth.middleware.js'
import {
  getVideos,
  getVideoById,
  togglePublishVideo,
  uploadVideo,
  updateVideo,
  updateVideoAsset,
  deleteVideo,
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
router.route('/:id').patch(verifyJWT, updateVideo)
router.route('/:id/update-asset').patch(
  verifyJWT,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  updateVideoAsset
)
router.route('/:id').delete(verifyJWT, deleteVideo)

export default router
