import { db } from '../../common/db'
import { users, clients, authCodes, sessions, refreshTokens } from './auth.model'
import { eq } from 'drizzle-orm'


class AuthRepository {
    // USER
    public async findUserByEmail(email: string) {
        const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
        return result[0] || null
    }

    public async findUserById(id: number) {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
        return result[0] || null
    }

    // CLIENT
    public async findClient(clientId: string) {
        const result = await db.select().from(clients).where(eq(clients.clientId, clientId)).limit(1)
        return result[0] || null
    }

    public async findClientById(id: number) {
        const result = await db.select().from(clients)
            .where(eq(clients.id, id))
            .limit(1)
        return result[0] || null
    }

    // SESSION
    public async createSession(data: {
        userId: number
        sessionToken: string
        expiresAt: Date
    }) {
        const result = await db.insert(sessions).values(data).returning();
        return result[0] || null
    }

    public async findSession(sessionToken: string) {
        const result = await db.select().from(sessions).where(eq(sessions.sessionToken, sessionToken)).limit(1)
        return result[0] || null
    }

    // AUTH CODE
    public async createAuthCode(data: {
        code: string
        userId: number
        clientId: number
        expiresAt: Date
    }) {
        const result = await db.insert(authCodes).values(data).returning();
        return result[0] || null
    }

    public async findAuthCode(code: string) {
        const result = await db.select().from(authCodes).where(eq(authCodes.code, code)).limit(1)
        return result[0] || null
    }

    public async deleteAuthCode(code: string) {
        const result = await db.delete(authCodes).where(eq(authCodes.code, code)).returning();
        return result[0] || null
    }

    public async createUser(data: {
        name: string
        email: string
        password: string
    }) {
        const result = await db.insert(users).values(data).returning()
        return result[0] || null
    }

    // REFRESH TOKENS
    public async createRefreshToken(data: {
        userId: number
        token: string,
        clientId: number,
        expiresAt: Date
    }) {
        const result = await db.insert(refreshTokens).values(data).returning();
        return result[0] || null
    }

    public async findRefreshToken(token: string) {
        const result = await db
            .select()
            .from(refreshTokens)
            .where(eq(refreshTokens.token, token))
            .limit(1)
        return result[0] || null
    }

    public async deleteRefreshToken(token: string) {
        const result = await db.delete(refreshTokens).where(eq(refreshTokens.token, token)).returning();
        return result[0] || null
    }

}


export default AuthRepository