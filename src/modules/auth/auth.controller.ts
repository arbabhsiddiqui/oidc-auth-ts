import { Request, Response } from 'express'
import { catchAsync } from '../../common/utils/async-handler'

import AuthService from './auth.service'
import ApiResponse from '../../common/utils/api-response'
import ApiError from '../../common/utils/api-error'


class AuthenticationController {
    constructor(private readonly authService: AuthService) { }


    // LOGIN
    public login = catchAsync(async (req: Request, res: Response) => {
        const { email, password, redirect } = req.body

        const { sessionToken } = await this.authService.login({ email, password })
        res.cookie('session', sessionToken, { httpOnly: true })

        if (redirect) return res.redirect(redirect)


        ApiResponse.ok(res, 'Login successful')
    })


    public loginPage = catchAsync(async (req: Request, res: Response) => {
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
    })

    // AUTHORIZE
    public authorize = catchAsync(async (req: Request, res: Response) => {
        const { client_id, redirect_uri, state } = req.query

        const sessionToken = req.cookies?.session

        const result = await this.authService.authorize({
            clientId: client_id as string,
            redirectUri: redirect_uri as string,
            sessionToken,
        })

        if (result.requiresLogin) {
            return res.redirect(`${req.baseUrl}/login?redirect=${encodeURIComponent(req.originalUrl)}`)
        }

        const redirectUrl = `${redirect_uri}?code=${result.code}&state=${state}`

        return res.redirect(redirectUrl)
    })

    // TOKEN
    public token = catchAsync(async (req: Request, res: Response) => {
        const { code, client_id, client_secret } = req.body

        const tokens = await this.authService.exchangeToken({
            code,
            clientId: client_id,
            clientSecret: client_secret,
        })

        res.json(tokens)

    })


    public register = catchAsync(async (req: Request, res: Response) => {

        const { name, email, password } = req.body

        const user = await this.authService.register(name, email, password)

        return ApiResponse.created(res, 'User registered successfully', user);
    })

    public refresh = catchAsync(async (req: Request, res: Response) => {
        const { refreshToken } = req.body

        const tokens = await this.authService.refresh(refreshToken)

        res.json(tokens)

    })

    public me = catchAsync(async (req: Request, res: Response) => {
        const user = await this.authService.getCurrentUser(+req.user!.userId)
        return ApiResponse.ok(res, 'User fetched', user);
    })
}
export default AuthenticationController