import { Router } from 'express'
import { verifyJWT } from '../middleware/auth.middleware.js'
import {
  getChannelProfile,
  getChannelVideos,
} from '../controllers/channel.controller.js'

const router = Router()

router.route('/:username').get(verifyJWT, getChannelProfile)
router.route('/:username/videos').get(verifyJWT, getChannelVideos)

export default router
