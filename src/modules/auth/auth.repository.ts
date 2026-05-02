import { db } from '../../common/db'
import { users, clients, authCodes, sessions, refreshTokens } from './auth.schema'
import { eq } from 'drizzle-orm'

// USER
export const findUserByEmail = (email: string) => {
    return db.select().from(users).where(eq(users.email, email)).limit(1)
}

// CLIENT
export const findClient = (clientId: string) => {
    return db.select().from(clients).where(eq(clients.clientId, clientId)).limit(1)
}

export const findClientById = (id: number) => {
    return db.select().from(clients)
        .where(eq(clients.id, id))
        .limit(1)
}

// SESSION
export const createSession = (data: {
    userId: number
    sessionToken: string
    expiresAt: Date
}) => {
    return db.insert(sessions).values(data)
}

export const findSession = (sessionToken: string) => {
    return db.select().from(sessions).where(eq(sessions.sessionToken, sessionToken)).limit(1)
}

// AUTH CODE
export const createAuthCode = (data: {
    code: string
    userId: number
    clientId: number
    expiresAt: Date
}) => {
    return db.insert(authCodes).values(data)
}

export const findAuthCode = (code: string) => {
    return db.select().from(authCodes).where(eq(authCodes.code, code)).limit(1)
}

export const deleteAuthCode = (code: string) => {
    return db.delete(authCodes).where(eq(authCodes.code, code))
}

export const createUser = (data: {
    name: string
    email: string
    password: string
}) => {
    return db.insert(users).values(data).returning()
}

// REFRESH TOKENS
export const createRefreshToken = (data: {
    userId: number
    token: string,
    clientId: number,
    expiresAt: Date
}) => {
    return db.insert(refreshTokens).values(data)
}

export const findRefreshToken = (token: string) => {
    return db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, token))
        .limit(1)
}

export const deleteRefreshToken = (token: string) => {
    return db.delete(refreshTokens).where(eq(refreshTokens.token, token))
}

