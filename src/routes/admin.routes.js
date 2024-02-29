import { Router } from 'express'
import { verifyJWT } from '../middleware/auth.middleware.js'
import { getActionLogs } from '../controllers/actionLog.controller.js'

const router = Router()

router.route('/action-logs').get(verifyJWT, getActionLogs)

export default router
