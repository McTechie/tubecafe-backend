import { Router } from 'express'
import { verifyJWT } from '../middleware/auth.middleware.js'
import {
  createComment,
  getCommentsOnVideo,
  replyToComment,
  deleteComment,
} from '../controllers/comment.controller.js'

const router = Router()

router.route('/').post(verifyJWT, createComment)
router.route('/video/:videoId').get(verifyJWT, getCommentsOnVideo)
router.route('/:id/reply').post(verifyJWT, replyToComment)
router.route('/:id').delete(verifyJWT, deleteComment)

export default router
