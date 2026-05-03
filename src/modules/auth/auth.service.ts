import AuthRepository from './auth.repository'
import bcrypt from 'bcrypt'
import crypto from 'crypto'



import ApiError from '../../common/utils/api-error'
import { env } from '../../common/config/env'

import { generateAccessToken } from './auth.utils'
import { LoginInput } from './auth.schema'


class AuthService {

    constructor(private readonly _authRepo: AuthRepository) { }


    public async login(payload: LoginInput) {
        const { email, password } = payload
        const user = await this._authRepo.findUserByEmail(email)
        if (!user) throw ApiError.unauthorized('Invalid credentials');

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) throw ApiError.unauthorized('Invalid credentials')

        const sessionToken = crypto.randomUUID()

        await this._authRepo.createSession({
            userId: user.id,
            sessionToken,
            expiresAt: new Date(Date.now() + env.SESSION_EXPIRY_MS),
        })

        return { sessionToken }
    }

    // AUTHORIZE FLOW
    public async authorize({
        clientId,
        redirectUri,
        sessionToken,
    }: {
        clientId: string
        redirectUri: string
        sessionToken?: string
    }) {
        const client = await this._authRepo.findClient(clientId)
        if (!client) throw ApiError.badRequest('Invalid client')

        if (client.redirectUri !== redirectUri) {
            throw ApiError.badRequest('Invalid redirect URI')
        }

        if (!sessionToken) {
            return { requiresLogin: true }
        }

        const session = await this._authRepo.findSession(sessionToken)
        if (!session) {
            return { requiresLogin: true }
        }

        const code = crypto.randomUUID()

        await this._authRepo.createAuthCode({
            code,
            userId: session.userId,
            clientId: client.id,
            expiresAt: new Date(Date.now() + env.AUTH_CODE_EXPIRY_MS), // 1 minute
        })

        return { code }
    }

    // TOKEN EXCHANGE
    public async exchangeToken({
        code,
        clientId,
        clientSecret,
    }: {
        code: string
        clientId: string
        clientSecret: string
    }) {
        const client = await this._authRepo.findClient(clientId)
        if (!client) throw ApiError.badRequest('Invalid client')

        if (client.clientSecret !== clientSecret) {
            throw ApiError.badRequest('Invalid client secret')
        }

        const authCode = await this._authRepo.findAuthCode(code)
        if (!authCode) throw ApiError.badRequest('Invalid code')

        if (authCode.expiresAt < new Date()) {
            throw ApiError.badRequest('Code expired')
        }

        await this._authRepo.deleteAuthCode(code)

        const accessToken = generateAccessToken(authCode.userId, client.clientId)


        const refreshToken = crypto.randomUUID()

        await this._authRepo.createRefreshToken({
            userId: authCode.userId,
            token: refreshToken,
            clientId: client.id, // 👈 IMPORTANT
            expiresAt: new Date(Date.now() + env.SESSION_EXPIRY_MS),
        })

        return { accessToken, refreshToken }
    }

    public async register(name: string, email: string, password: string) {

        const userExists = await this._authRepo.findUserByEmail(email)

        if (userExists) {
            throw ApiError.conflict('Email already in use')
        }



        const hashed = await bcrypt.hash(password, 10)



        const user = await this._authRepo.createUser({
            name,
            email,
            password: hashed,
        })


        return { name, email }
    }


    public async refresh(token: string) {
        const stored = await this._authRepo.findRefreshToken(token)

        if (!stored) throw ApiError.badRequest('Invalid refresh token')

        if (stored.expiresAt < new Date()) {
            throw ApiError.badRequest('Refresh token expired')
        }

        // rotate token (IMPORTANT)
        await this._authRepo.deleteRefreshToken(token)

        const newRefreshToken = crypto.randomUUID()

        await this._authRepo.createRefreshToken({
            userId: stored.userId,
            token: newRefreshToken,
            clientId: stored.clientId,
            expiresAt: new Date(Date.now() + env.SESSION_EXPIRY_MS),
        })

        const accessToken = generateAccessToken(stored.userId, String(stored.clientId))

        return { accessToken, refreshToken: newRefreshToken }
    }

    public async getCurrentUser(userId: number) {
        const user = await this._authRepo.findUserById(userId);
        if (!user) throw ApiError.notFound('User not found');

        const { password, ...userProfile } = user;
        return userProfile;
    }
}

export default AuthService