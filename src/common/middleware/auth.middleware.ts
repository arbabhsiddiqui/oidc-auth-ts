import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PUBLIC_KEY } from '../config/cert'

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader) {
            return res.status(401).json({ error: 'No token' })
        }

        const token = authHeader.split(' ')[1]

        if (!token) {
            return res.status(401).json({ error: 'Invalid token format' })
        }

        const payload = jwt.verify(
            token,
            PUBLIC_KEY,
            { algorithms: ['RS256'] }
        );


        (req as any).user = payload

        next()
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' })
    }
}