import { Router } from 'express'
import * as ctrl from './auth.controller'
import { authenticate } from '../../middlewares/auth.middleware'

const router = Router()

// Public
router.get('/check-setup',      ctrl.checkSetup)
router.post('/setup',           ctrl.setupAdmin)
router.post('/register',        ctrl.registerAdmin)
router.post('/login',           ctrl.login)
router.post('/forgot-password', ctrl.requestReset)
router.post('/reset-password',  ctrl.resetPassword)

// Protected
router.post('/change-password',   authenticate, ctrl.changePassword)
router.get('/users',              authenticate, ctrl.getUsers)
router.patch('/users/:id/status', authenticate, ctrl.toggleUserStatus)
router.delete('/users/:id',       authenticate, ctrl.deleteUser)

export default router