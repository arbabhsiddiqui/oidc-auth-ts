import { Router } from 'express'
import * as controller from './oidc.controller'

export const router = Router()

router.get('/.well-known/openid-configuration', controller.discovery)
router.get('/.well-known/jwks.json', controller.jwks)