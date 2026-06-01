import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import authRoutes from './modules/auth/auth.routes'
import serviceRoutes from './modules/service/service.routes'
import priceRoutes from './modules/price/price.routes'
import profileRoutes from './modules/profile/profile.routes'
import shiftRoutes    from './modules/shift/shift.routes'
import scheduleRoutes from './modules/schedule/schedule.routes'
import holidayRoutes  from './modules/holiday/holiday.routes'
import smsRoutes      from './modules/sms/sms.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
app.use('/api/auth', authRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/prices', priceRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/shifts',    shiftRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/holidays',  holidayRoutes)
app.use('/api/sms',       smsRoutes)
app.get('/health', (_, res) => res.json({ status: 'OK' }))

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

export default app