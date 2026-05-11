import { Router } from 'express'
import * as ctrl from './auth.controller'
import { authenticate } from '../../middlewares/auth.middleware'

const router = Router()

router.get('/check-setup', ctrl.checkSetup)
router.post('/setup', ctrl.setupAdmin)
router.post('/login', ctrl.login)
router.post('/change-password', authenticate, ctrl.changePassword)
router.post('/forgot-password', ctrl.requestReset)
router.post('/reset-password', ctrl.resetPassword)

export default router