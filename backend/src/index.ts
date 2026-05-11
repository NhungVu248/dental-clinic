import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './modules/auth/auth.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.get('/health', (_, res) => res.json({ status: 'OK' }))

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

export default app