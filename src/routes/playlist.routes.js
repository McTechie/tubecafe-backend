import { Router } from 'express'
import { upload } from '../middleware/multer.middleware.js'
import { verifyJWT } from '../middleware/auth.middleware.js'
import {
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  reorderVideosInPlaylist,
  togglePublishPlaylist,
  updatePlaylist,
  updatePlaylistThumbnail,
  deletePlaylist,
  getPlaylistVideos,
} from '../controllers/playlist.controller.js'

const router = Router()

router
  .route('/')
  .post(
    verifyJWT,
    upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
    createPlaylist
  )
router.route('/add/:id').patch(verifyJWT, addVideoToPlaylist)
router.route('/remove/:id').patch(verifyJWT, removeVideoFromPlaylist)
router.route('/reorder/:id').patch(verifyJWT, reorderVideosInPlaylist)
router.route('/toggle-publish/:id').patch(verifyJWT, togglePublishPlaylist)
router
  .route('/update-thumbnail/:id')
  .patch(
    verifyJWT,
    upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
    updatePlaylistThumbnail
  )
router.route('/videos/:id').get(verifyJWT, getPlaylistVideos)
router.route('/:id').patch(verifyJWT, updatePlaylist)
router.route('/:id').delete(verifyJWT, deletePlaylist)

export default router
