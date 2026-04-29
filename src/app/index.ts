import express from 'express'
import type { Express } from 'express'


export function createExpressApplication(): Express {
    const app = express()


    app.use(express.json())

    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok' })
    })

    return app
}