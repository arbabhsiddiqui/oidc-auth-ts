import { Request, Response } from 'express'
import * as service from './auth.service'

// LOGIN
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password, redirect } = req.body

        const { sessionToken } = await service.login(email, password)
        res.cookie('session', sessionToken, { httpOnly: true })

        if (redirect) return res.redirect(redirect)

        res.json({ success: true })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
}


export const loginPage = (req: Request, res: Response) => {
    const redirect = req.query.redirect || '/'

    res.send(`
    <html>
      <body>
        <h2>Login</h2>
        <form method="POST" action="${req.baseUrl}/login">
          <input type="hidden" name="redirect" value="${redirect}" />
          
          <div>
            <input name="email" placeholder="Email" />
          </div>
          
          <div>
            <input name="password" type="password" placeholder="Password" />
          </div>
          
          <button type="submit">Login</button>
        </form>
      </body>
    </html>
  `)
}

// AUTHORIZE
export const authorize = async (req: Request, res: Response) => {
    try {
        const { client_id, redirect_uri, state } = req.query

        const sessionToken = req.cookies?.session

        const result = await service.authorize({
            clientId: client_id as string,
            redirectUri: redirect_uri as string,
            sessionToken,
        })

        if (result.requiresLogin) {
            return res.redirect(`${req.baseUrl}/login?redirect=${encodeURIComponent(req.originalUrl)}`)
        }

        const redirectUrl = `${redirect_uri}?code=${result.code}&state=${state}`

        return res.redirect(redirectUrl)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
}

// TOKEN
export const token = async (req: Request, res: Response) => {
    try {
        const { code, client_id, client_secret } = req.body

        const tokens = await service.exchangeToken({
            code,
            clientId: client_id,
            clientSecret: client_secret,
        })

        res.json(tokens)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
}


export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body

        const user = await service.register(name, email, password)

        res.json(user)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
}

export const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body

        const tokens = await service.refresh(refreshToken)

        res.json(tokens)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
}