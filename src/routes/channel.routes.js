import { Router } from 'express'
import { verifyJWT } from '../middleware/auth.middleware.js'
import {
  getChannelProfile,
  getChannelVideos,
  getChannelVideo,
} from '../controllers/channel.controller.js'

const router = Router()

router.route('/:username').get(verifyJWT, getChannelProfile)
router.route('/:username/videos').get(verifyJWT, getChannelVideos)
router.route('/:username/videos/:id').get(verifyJWT, getChannelVideo)

export default router
