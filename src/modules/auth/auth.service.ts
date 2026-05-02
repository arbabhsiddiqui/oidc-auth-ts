import * as repo from './auth.repository'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { PRIVATE_KEY } from '../../common/config/cert'
import { env } from 'process'

const ACCESS_TOKEN_EXPIRY = '15m'

export const login = async (email: string, password: string) => {
    const [user] = await repo.findUserByEmail(email)
    if (!user) throw new Error('Invalid credentials')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new Error('Invalid credentials')

    const sessionToken = crypto.randomUUID()

    await repo.createSession({
        userId: user.id,
        sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    const accessToken = jwt.sign(
        {
            sub: user.id,
            iss: env.ISSUER,
            aud: client.clientId,
        },
        PRIVATE_KEY,
        { algorithm: 'RS256', expiresIn: '15m' }
    )

    const refreshToken = crypto.randomUUID()

    await repo.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    return { sessionToken, accessToken, refreshToken }
}

// AUTHORIZE FLOW
export const authorize = async ({
    clientId,
    redirectUri,
    sessionToken,
}: {
    clientId: string
    redirectUri: string
    sessionToken?: string
}) => {
    const [client] = await repo.findClient(clientId)
    if (!client) throw new Error('Invalid client')

    if (client.redirectUri !== redirectUri) {
        throw new Error('Invalid redirect URI')
    }

    if (!sessionToken) {
        return { requiresLogin: true }
    }

    const [session] = await repo.findSession(sessionToken)
    if (!session) {
        return { requiresLogin: true }
    }

    const code = crypto.randomUUID()

    await repo.createAuthCode({
        code,
        userId: session.userId,
        clientId: client.id,
        expiresAt: new Date(Date.now() + 60 * 1000), // 1 min
    })

    return { code }
}

// TOKEN EXCHANGE
export const exchangeToken = async ({
    code,
    clientId,
    clientSecret,
}: {
    code: string
    clientId: string
    clientSecret: string
}) => {
    const [client] = await repo.findClient(clientId)
    if (!client) throw new Error('Invalid client')

    if (client.clientSecret !== clientSecret) {
        throw new Error('Invalid client secret')
    }

    const [authCode] = await repo.findAuthCode(code)
    if (!authCode) throw new Error('Invalid code')

    if (authCode.expiresAt < new Date()) {
        throw new Error('Code expired')
    }

    // one-time use
    await repo.deleteAuthCode(code)

    const accessToken = jwt.sign(
        { sub: authCode.userId },
        PRIVATE_KEY,
        { algorithm: 'RS256', expiresIn: ACCESS_TOKEN_EXPIRY }
    )

    return { accessToken }
}


export const register = async (name: string, email: string, password: string) => {
    const hashed = await bcrypt.hash(password, 10)

    const [user] = await repo.createUser({
        name,
        email,
        password: hashed,
    })

    return user
}


export const refresh = async (token: string) => {
    const [stored] = await repo.findRefreshToken(token)

    if (!stored) throw new Error('Invalid refresh token')

    if (stored.expiresAt < new Date()) {
        throw new Error('Refresh token expired')
    }

    // rotate token (IMPORTANT)
    await repo.deleteRefreshToken(token)

    const newRefreshToken = crypto.randomUUID()

    await repo.createRefreshToken({
        userId: stored.userId,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    const accessToken = jwt.sign(
        { sub: stored.userId },
        PRIVATE_KEY,
        { algorithm: 'RS256', expiresIn: '15m' }
    )

    return { accessToken, refreshToken: newRefreshToken }
}