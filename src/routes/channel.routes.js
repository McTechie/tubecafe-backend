import { Router } from 'express'
import { verifyJWT } from '../middleware/auth.middleware.js'
import { getChannelProfile } from '../controllers/channel.controller.js'

const router = Router()

router.route('/:username').get(verifyJWT, getChannelProfile)

export default router
