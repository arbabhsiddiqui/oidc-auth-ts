import { Request, Response } from 'express'
import { JsonWebTokenError } from 'jsonwebtoken'
import { env } from 'node:process'
import { PUBLIC_KEY } from '../../common/config/cert'
import jose from "node-jose";


export const discovery = (req: Request, res: Response) => {
    res.json({
        issuer: env.ISSUER,

        authorization_endpoint: `${env.ISSUER}/api/v1/auth/authorize`,
        token_endpoint: `${env.ISSUER}/api/v1/auth/token`,

        jwks_uri: `${env.ISSUER}/.well-known/jwks.json`,

        response_types_supported: ['code'],
        subject_types_supported: ['public'],

        id_token_signing_alg_values_supported: ['RS256'],

        scopes_supported: ['openid', 'email', 'profile'],

        token_endpoint_auth_methods_supported: ['client_secret_post'],
    })
}


export const jwks = async (req: Request, res: Response) => {
    const key = await jose.JWK.asKey(PUBLIC_KEY, 'pem');
    return res.json({ keys: [key.toJSON()] });
}