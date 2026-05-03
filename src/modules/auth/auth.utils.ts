import jwt from 'jsonwebtoken';
import { PRIVATE_KEY } from '../../common/config/cert';
import { env } from '../../common/config/env'
export const generateAccessToken = (userId: number, clientId: string): string => {
    return jwt.sign(
        {
            sub: userId,
            iss: env.ISSUER,
            aud: clientId,
        },
        PRIVATE_KEY,
        {
            algorithm: 'RS256',
            expiresIn: '15m',
        }
    );
};

// Since you're building an OIDC provider, you'll need this soon:
export const generateIdToken = (payload: object): string => {
    return jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '1h' });
};