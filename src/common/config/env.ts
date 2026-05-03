import { z } from 'zod'
import "dotenv/config"

const toNumberOrUndefined = (val: unknown) => {
    if (val === '' || val == null) return undefined
    if (typeof val === 'string') {
        const n = Number(val)
        return Number.isNaN(n) ? undefined : n
    }
    if (typeof val === 'number') return Number.isNaN(val) ? undefined : val
    return undefined
}

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.preprocess(toNumberOrUndefined, z.number().int().positive().default(8080)),
    DATABASE_URI: z.string().default('postgresql://postgres:password@localhost:5432/mydb'),
    ISSUER: z.string().default('http://localhost:6001'),
    SESSION_EXPIRY_MS: z.preprocess(toNumberOrUndefined, z.number().int().positive().default(7 * 24 * 60 * 60 * 1000)), // 7 days
    AUTH_CODE_EXPIRY_MS: z.preprocess(toNumberOrUndefined, z.number().int().positive().default(60 * 1000)), // 1 minute
})

export const env = envSchema.parse(process.env)