
import express from 'express'
import type { Router } from 'express'
import * as controller from './auth.controller'
import { authenticate } from '../../common/middleware/auth.middleware'

export const authRouter: Router = express.Router()


authRouter.get('/authorize', controller.authorize)
authRouter.post('/token', controller.token)

authRouter.get('/login', controller.loginPage)

authRouter.post('/login', controller.login)
authRouter.post('/register', controller.register)
authRouter.post('/refresh', controller.refresh)

authRouter.get('/me', authenticate, (req, res) => {
    res.json({ user: (req as any).user })
})