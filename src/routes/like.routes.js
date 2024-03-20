import { Router } from 'express'
import {
  verifyJWT,
  verifyResourceExists,
} from '../middleware/auth.middleware.js'
import {
  likeResource,
  unlikeResource,
  getLikeCountByResourceId,
} from '../controllers/like.controller.js'

const router = Router()

router
  .route('/resource/:resourceId')
  .post(verifyJWT, verifyResourceExists, likeResource)
router
  .route('/resource/:resourceId')
  .delete(verifyJWT, verifyResourceExists, unlikeResource)
router
  .route('/count/:resourceId')
  .get(verifyJWT, verifyResourceExists, getLikeCountByResourceId)

export default router
