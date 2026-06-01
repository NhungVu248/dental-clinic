import { Router } from 'express'
import * as ctrl from './sms.controller'
import { authenticate, requireRole } from '../../middlewares/auth.middleware'

const router = Router()
const admin  = [authenticate, requireRole('ADMIN')] as const

router.get('/config',            ...admin, ctrl.getConfig)
router.put('/config',            ...admin, ctrl.updateConfig)
router.put('/templates/:type',   ...admin, ctrl.updateTemplate)
router.get('/stats',             ...admin, ctrl.getStats)
router.get('/logs',              ...admin, ctrl.getLogs)
router.post('/test',             ...admin, ctrl.sendTest)

export default router
