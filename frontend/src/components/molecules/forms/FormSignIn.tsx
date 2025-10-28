// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { loginService } from '@/services/auth.service'
import { addLog } from '@/services/log.service'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { TbLoader } from 'react-icons/tb'
// import SSOHandler from '../SSOHandler'
import config from '@/configs/config'

interface FormSignInProps {
  setAuthType: (type: 'sign-in' | 'register' | 'forgot') => void
}

const FormSignIn = ({ setAuthType }: FormSignInProps) => {
  const [loading, setLoading] = useState(false)
  const [ssoLoading, setSSOLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      const [email, password] = [
        e.currentTarget.email.value,
        e.currentTarget.password.value,
      ]
      await loginService(email, password)
      // Server addLog have error after security patches
      // await addLog({
      //   name: `User log in`,
      //   description: `User ${email} logged in`,
      //   type: 'user-login@email',
      //   create_by: email,
      // })
      window.location.href = window.location.href
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data.message || 'Something went wrong')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={signIn} className="flex flex-col p-4 bg-white">
      {config.disableEmailLogin ? (
        <div className="flex flex-col h-full mb-16">
          <h2 className="text-xl font-semibold text-primary">
            Sign in with SSO
          </h2>
          <p className="text-base mt-2 text-muted-foreground">
            Your organization uses single sign-on (SSO) with{' '}
            <span className="font-bold">{window.location.hostname}</span>.
            Please sign in using your SSO credentials.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-primary">Sign In</h2>
          <div className="mt-6"></div>

          <div className="mt-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              className="mt-1"
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              className="mt-1"
            />
          </div>
          <div className="flex items-center justify-end mt-1">
            <Button
              type="button"
              variant="link"
              onClick={() => setAuthType('forgot')}
            >
              Forget Password
            </Button>
          </div>

          {error && (
            <span className="text-sm mt-2 text-destructive">{error}</span>
          )}

          <Button
            disabled={loading || ssoLoading}
            type="submit"
            className="w-full mt-2"
          >
            {loading && <TbLoader className="animate-spin text-lg mr-2" />}
            Sign in
          </Button>
          {!config.strictAuth && (
            <div className="mt-4 flex w-full justify-center items-center">
              <span className="text-muted-foreground">
                Don't have an account?
              </span>
              <Button
                type="button"
                onClick={() => setAuthType('register')}
                variant="link"
                className="text-primary text-sm! px-1.5!"
              >
                Register
              </Button>
            </div>
          )}
        </div>
      )}

      {config.sso && !config.disableEmailLogin && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase py-6">
            <span className="bg-white px-2 text-muted-foreground">
              {' '}
              Or continue with{' '}
            </span>
          </div>
        </div>
      )}

      {config.sso && config.sso === 'bosch' && (
        <div
          onClick={(event) => {
            setSSOLoading(true)
            event.preventDefault()
            event.stopPropagation()
          }}
        >
          {/* <SSOHandler setSSOLoading={setSSOLoading}>
            <Button
              variant="outline"
              className="w-full"
              disabled={loading || ssoLoading}
            >
              {ssoLoading && <TbLoader className="animate-spin text-lg mr-2" />}
              BOSCH SSO
            </Button>
          </SSOHandler> */}
        </div>
      )}
    </form>
  )
}

export default FormSignIn
