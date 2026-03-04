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
import { Spinner } from '@/components/atoms/spinner'
import { loginService } from '@/services/auth.service'
import { addLog } from '@/services/log.service'
import { isAxiosError } from 'axios'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TbAt, TbLock } from 'react-icons/tb'
import SSOHandler from '../SSOHandler'
import config from '@/configs/config'
import { useAuthConfigs } from '@/hooks/useAuthConfigs'
import { useSSOProviders } from '@/hooks/useSSOProviders'

interface FormSignInProps {
  setAuthType: (type: 'sign-in' | 'register' | 'forgot') => void
}

const FormSignIn = ({ setAuthType }: FormSignInProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [ssoLoading, setSSOLoading] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const { authConfigs } = useAuthConfigs()
  const { providers: ssoProviders } = useSSOProviders()

  useEffect(() => {
    const err = searchParams.get('error')
    if (err) {
      setError(decodeURIComponent(err))
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      const [email, password] = [
        e.currentTarget.email.value,
        e.currentTarget.password.value,
      ]
      await loginService(email, password)
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
    <form onSubmit={signIn} className="flex flex-col bg-background">
      {config.disableEmailLogin ? (
        <div className="flex flex-col h-full mb-16">
          <h2 className="text-lg font-semibold text-primary">
            Sign in with SSO
          </h2>
          <p className="text-base mt-2 text-muted-foreground">
            Your organization uses single sign-on (SSO) with{' '}
            <span className="font-semibold">{window.location.hostname}</span>.
            Please sign in using your SSO credentials.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-primary">Sign In</h2>
          <div className="mt-6"></div>

          <div className="mt-4 flex flex-col gap-1.5">
            <Label>Email</Label>
            <div className="relative">
              <TbAt className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground" />
              <Input name="email" placeholder="Email" className="pl-10" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            <Label>Password</Label>
            <div className="relative">
              <TbLock className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground" />
              <Input
                name="password"
                placeholder="Password"
                type="password"
                className="pl-10"
              />
            </div>
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

          {error && <p className="text-sm mt-2 text-destructive">{error}</p>}

          <Button
            disabled={loading || ssoLoading !== null}
            type="submit"
            variant="default"
            className="w-full mt-2"
          >
            {loading && <Spinner className="text-white" />}
            Sign in
          </Button>
          {authConfigs.SELF_REGISTRATION && (
            <div className="mt-4 flex w-full justify-center items-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?
              </p>
              <Button
                type="button"
                onClick={() => setAuthType('register')}
                variant="link"
                className="text-primary text-sm px-1.5"
              >
                Register
              </Button>
            </div>
          )}
        </div>
      )}

      {ssoProviders.length > 0 && !config.disableEmailLogin && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase py-6">
            <p className="text-sm bg-background px-2 text-muted-foreground">
              Or continue with
            </p>
          </div>
        </div>
      )}

      {ssoProviders.map((provider) => (
        <div key={provider.id} className="mt-2">
          <SSOHandler 
            provider={provider}
            setSSOLoading={(isLoading) => setSSOLoading(isLoading ? provider.id : null)}
          >
            <Button
              variant="outline"
              className="w-full"
              disabled={loading || ssoLoading !== null}
            >
              {ssoLoading === provider.id && <Spinner className="mr-2" size={16} />}
              Sign in with {provider.name}
            </Button>
          </SSOHandler>
        </div>
      ))}
    </form>
  )
}

export default FormSignIn
