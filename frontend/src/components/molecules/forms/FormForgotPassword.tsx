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
import { sendResetPasswordEmailService } from '@/services/auth.service'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { TbCircleCheckFilled } from 'react-icons/tb'
import { TbAt } from 'react-icons/tb'

interface FormForgotPasswordProps {
  setAuthType: (type: 'sign-in' | 'register' | 'forgot') => void
}

const FormForgotPassword = ({ setAuthType }: FormForgotPasswordProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [sent, setSent] = useState<boolean>(false)

  const sendResetEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      const email = e.currentTarget.email.value
      await sendResetPasswordEmailService(email)
      setError('')
      setSent(true)
      await new Promise(() =>
        setTimeout(() => {
          // eslint-disable-next-line no-self-assign
          window.location.href = window.location.href
        }, 3000),
      )
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data.message || 'Something went wrong')
        return
      }
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={sendResetEmail}
      className="w-[30vw] lg:w-[25vw] min-w-[400px] max-w-[500px] h-fit max-h-[80vh] p-4 bg-background"
    >
      {/* Title */}
      <h2 className="text-lg font-semibold text-primary">Forgot Password</h2>

      {sent ? (
        <>
          <p className="text-base mt-4">
            Reset password email sent! Please check your email and follow the
            instructions.
          </p>
          <TbCircleCheckFilled className="text-8xl text-green-500 mx-auto mt-10" />
        </>
      ) : (
        <>
          <p className="text-base mt-4">
            Enter the email associated with your account. We will send you an
            email to reset your password.
          </p>

          {/* Content */}
          <div className="mt-4 flex flex-col gap-1">
            <Label>Email</Label>
            <div className="relative">
              <TbAt className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground" />
              <Input name="email" placeholder="Email" className="pl-10" />
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-sm mt-2 text-destructive">{error}</p>}
          {/* Action */}
          <Button
            disabled={loading}
            type="submit"
            variant="default"
            className="w-full mt-6"
          >
            {loading && <Spinner className="mr-2" size={16} />}
            Send Reset Email
          </Button>

          {/* More */}
          <div className="mt-4 flex items-center">
            <p className="text-base text-foreground">Remember password?</p>
            <Button
              type="button"
              onClick={() => setAuthType('sign-in')}
              variant="link"
              className="text-primary"
            >
              Sign In
            </Button>
          </div>
        </>
      )}
    </form>
  )
}

export default FormForgotPassword
