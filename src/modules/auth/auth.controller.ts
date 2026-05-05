import { Request, Response } from 'express'
import { catchAsync } from '../../common/utils/async-handler'

import AuthService from './auth.service'
import { env } from '../../common/config/env'
import ApiResponse from '../../common/utils/api-response'
import ApiError from '../../common/utils/api-error'


class AuthenticationController {
  constructor(private readonly authService: AuthService) { }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }


  // LOGIN
  public login = catchAsync(async (req: Request, res: Response) => {
    const { email, password, redirect } = req.body

    const { sessionToken } = await this.authService.login({ email, password })
    // set an idp_session cookie for SSO across authorize requests
    res.cookie('idp_session', sessionToken, {
      httpOnly: true,
      maxAge: env.SESSION_EXPIRY_MS,
      domain: 'localhost',
      sameSite: 'lax',
    })

    if (redirect) return res.redirect(redirect)


    ApiResponse.ok(res, 'Login successful')
  })


  public loginPage = catchAsync(async (req: Request, res: Response) => {
    const redirect = typeof req.query.redirect === 'string' ? req.query.redirect : '/'
    const safeRedirect = this.escapeHtml(redirect)

    res.send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Sign in</title>
        <style>
          :root {
            color-scheme: light;
            --bg: #f4f7fb;
            --surface: #ffffff;
            --ink: #162033;
            --muted: #687385;
            --line: #d8e0ec;
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --focus: rgba(37, 99, 235, 0.2);
            --shadow: 0 22px 60px rgba(22, 32, 51, 0.14);
          }

          * {
            box-sizing: border-box;
          }

          body {
            min-height: 100vh;
            margin: 0;
            display: grid;
            place-items: center;
            padding: 32px 18px;
            background:
              radial-gradient(circle at 15% 20%, rgba(37, 99, 235, 0.12), transparent 28%),
              linear-gradient(135deg, #f8fbff 0%, var(--bg) 46%, #eef5f2 100%);
            color: var(--ink);
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          main {
            width: min(100%, 420px);
          }

          .panel {
            background: rgba(255, 255, 255, 0.94);
            border: 1px solid rgba(216, 224, 236, 0.86);
            border-radius: 8px;
            box-shadow: var(--shadow);
            padding: 34px;
          }

          .brand {
            width: 44px;
            height: 44px;
            display: grid;
            place-items: center;
            border-radius: 8px;
            background: var(--ink);
            color: #fff;
            font-size: 18px;
            font-weight: 800;
            line-height: 1;
            margin-bottom: 24px;
          }

          h1 {
            margin: 0;
            font-size: 30px;
            line-height: 1.15;
            font-weight: 800;
          }

          .intro {
            margin: 10px 0 28px;
            color: var(--muted);
            font-size: 15px;
            line-height: 1.5;
          }

          form {
            display: grid;
            gap: 18px;
          }

          label {
            display: grid;
            gap: 8px;
            color: var(--ink);
            font-size: 14px;
            font-weight: 650;
          }

          input {
            width: 100%;
            min-height: 48px;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: #fff;
            color: var(--ink);
            padding: 12px 14px;
            font: inherit;
            outline: none;
            transition: border-color 160ms ease, box-shadow 160ms ease;
          }

          input::placeholder {
            color: #98a3b3;
          }

          input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 4px var(--focus);
          }

          button {
            min-height: 50px;
            border: 0;
            border-radius: 8px;
            background: var(--primary);
            color: #fff;
            cursor: pointer;
            font: inherit;
            font-weight: 750;
            transition: background 160ms ease, transform 160ms ease, box-shadow 160ms ease;
            box-shadow: 0 12px 24px rgba(37, 99, 235, 0.24);
          }

          button:hover {
            background: var(--primary-dark);
            transform: translateY(-1px);
          }

          button:focus-visible {
            box-shadow: 0 0 0 4px var(--focus), 0 12px 24px rgba(37, 99, 235, 0.24);
            outline: none;
          }

          .hint {
            margin: 22px 0 0;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.45;
            text-align: center;
          }

          @media (max-width: 480px) {
            body {
              align-items: stretch;
              padding: 18px;
            }

            main {
              display: grid;
              align-items: center;
            }

            .panel {
              padding: 26px 22px;
            }

            h1 {
              font-size: 26px;
            }
          }
        </style>
      </head>
      <body>
        <main aria-labelledby="login-title">
          <section class="panel">
            <div class="brand" aria-hidden="true">ID</div>
            <h1 id="login-title">Sign in</h1>
            <p class="intro">Use your account credentials to continue to the requested application.</p>

            <form method="POST" action="${req.baseUrl}/login">
              <input type="hidden" name="redirect" value="${safeRedirect}" />

              <label>
                Email
                <input name="email" type="email" placeholder="you@example.com" autocomplete="email" required />
              </label>

              <label>
                Password
                <input name="password" type="password" placeholder="Enter your password" autocomplete="current-password" minlength="8" required />
              </label>

              <button type="submit">Sign in</button>
            </form>

             <p class="hint">
          Already have an account?
          <a href="${req.baseUrl}/register">Sign up</a>
        </p>
          </section>
        </main>
      </body>
    </html>
  `)
  })

  // AUTHORIZE
  public authorize = catchAsync(async (req: Request, res: Response) => {
    const { client_id, redirect_uri, state } = req.query

    // Support multiple cookie names for compatibility (idp_session preferred)
    const sessionToken = req.cookies?.idp_session || req.cookies?.sid || req.cookies?.session

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

    // if a sessionToken was issued/returned, set the idp_session cookie to extend SSO
    if ((tokens as any).sessionToken) {
      res.cookie('idp_session', (tokens as any).sessionToken, {
        httpOnly: true,
        maxAge: env.SESSION_EXPIRY_MS,
        domain: 'localhost',
        sameSite: 'lax',
      })
    }

    res.json(tokens)

  })

  public me = catchAsync(async (req: Request, res: Response) => {
    const user = await this.authService.getCurrentUser(+req.user!.userId)
    return ApiResponse.ok(res, 'User fetched', user);
  })



  public registerPage = catchAsync(async (req: Request, res: Response) => {
    const redirect = typeof req.query.redirect === 'string' ? req.query.redirect : '/'
    const safeRedirect = this.escapeHtml(redirect)

    res.send(`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Create account</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f7fb;
        --surface: #ffffff;
        --ink: #162033;
        --muted: #687385;
        --line: #d8e0ec;
        --primary: #2563eb;
        --primary-dark: #1d4ed8;
        --focus: rgba(37, 99, 235, 0.2);
        --shadow: 0 22px 60px rgba(22, 32, 51, 0.14);
      }

      * { box-sizing: border-box; }

      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 32px 18px;
        background:
          radial-gradient(circle at 15% 20%, rgba(37, 99, 235, 0.12), transparent 28%),
          linear-gradient(135deg, #f8fbff 0%, var(--bg) 46%, #eef5f2 100%);
        color: var(--ink);
        font-family: Inter, system-ui, sans-serif;
      }

      main { width: min(100%, 420px); }

      .panel {
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(216, 224, 236, 0.86);
        border-radius: 8px;
        box-shadow: var(--shadow);
        padding: 34px;
      }

      .brand {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: var(--ink);
        color: #fff;
        font-size: 18px;
        font-weight: 800;
        margin-bottom: 24px;
      }

      h1 {
        margin: 0;
        font-size: 30px;
        font-weight: 800;
      }

      .intro {
        margin: 10px 0 28px;
        color: var(--muted);
        font-size: 15px;
      }

      form {
        display: grid;
        gap: 18px;
      }

      label {
        display: grid;
        gap: 8px;
        font-size: 14px;
        font-weight: 650;
      }

      input {
        width: 100%;
        min-height: 48px;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 12px 14px;
        font: inherit;
        outline: none;
      }

      input:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 4px var(--focus);
      }

      button {
        min-height: 50px;
        border: 0;
        border-radius: 8px;
        background: var(--primary);
        color: #fff;
        font-weight: 750;
        cursor: pointer;
      }

      button:hover {
        background: var(--primary-dark);
      }

      .hint {
        margin-top: 20px;
        font-size: 13px;
        color: var(--muted);
        text-align: center;
      }
    </style>
  </head>

  <body>
    <main>
      <section class="panel">
        <div class="brand">ID</div>

        <h1>Create account</h1>
        <p class="intro">Register to continue to the application.</p>

        <form method="POST" action="${req.baseUrl}/register">
          <input type="hidden" name="redirect" value="${safeRedirect}" />

          <label>
            Full Name
            <input name="name" type="text" placeholder="John Doe" required />
          </label>

          <label>
            Email
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>

          <label>
            Password
            <input name="password" type="password" placeholder="Create a password" minlength="8" required />
          </label>

          <button type="submit">Create account</button>
        </form>

        <p class="hint">
          Already have an account?
          <a href="${req.baseUrl}/login">Sign in</a>
        </p>
      </section>
    </main>
  </body>
</html>
`)
  })

}
export default AuthenticationController
