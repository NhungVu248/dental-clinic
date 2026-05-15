import { Router } from 'express'
import * as ctrl from './service.controller'
import { authenticate, requireRole } from '../../middlewares/auth.middleware'

const router = Router()

router.get('/doctors', authenticate, requireRole('ADMIN'), ctrl.getDoctors)

router.get('/groups',              authenticate, requireRole('ADMIN'), ctrl.getServiceGroups)
router.post('/groups',             authenticate, requireRole('ADMIN'), ctrl.createServiceGroup)
router.put('/groups/:id',          authenticate, requireRole('ADMIN'), ctrl.updateServiceGroup)
router.delete('/groups/:id',       authenticate, requireRole('ADMIN'), ctrl.deleteServiceGroup)
router.get('/groups/:id/services', authenticate, requireRole('ADMIN'), ctrl.getGroupServices)

export default router
