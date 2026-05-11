import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' })

  try {
    const payload = verifyToken(token)
    ;(req as any).user = payload
    next()
  } catch {
    res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' })
  }
}