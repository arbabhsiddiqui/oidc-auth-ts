
import express from 'express'
import type { Router } from 'express'
import AuthenticationController from './auth.controller'
import { authenticate } from '../../common/middleware/auth.middleware'
import AuthService from './auth.service';
import AuthRepository from './auth.repository';
import { validate } from '../../common/middleware/validate.middleware';
import { loginSchema } from './auth.schema';

// 1. Manually resolve dependencies (The "Composition Root")
const authRepo = new AuthRepository();
const authService = new AuthService(authRepo);
const authController = new AuthenticationController(authService);

export const authRouter: Router = express.Router()


authRouter.get('/authorize', authController.authorize)
authRouter.post('/token', authController.token)

authRouter.get('/login', authController.loginPage)
authRouter.post('/login', validate(loginSchema), authController.login)


authRouter.get('/register', authController.registerPage)
authRouter.post('/register', authController.register)

authRouter.post('/refresh', authController.refresh)

authRouter.get('/me', authenticate, authController.me)