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
import { sendResetPasswordEmailService } from '@/services/auth.service'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { TbCircleCheckFilled, TbLoader } from 'react-icons/tb'

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
      className="w-[30vw] lg:w-[25vw] min-w-[400px] max-w-[500px] h-fit max-h-[80vh] p-4 bg-white"
    >
      {/* Title */}
      <h2 className="text-xl font-semibold text-primary">
        Forgot Password
      </h2>

      {sent ? (
        <>
          <span className="block mt-4">
            Reset password email sent! Please check your email and follow the
            instructions.
          </span>
          <TbCircleCheckFilled className="text-8xl text-green-500 mx-auto mt-10" />
        </>
      ) : (
        <>
          <span className="block mt-4">
            Enter the email associated with your account. We will send you an
            email to reset your password.
          </span>

          {/* Content */}
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

          {/* Error */}
          {error && (
            <span className="text-sm mt-2 block text-destructive">
              {error}
            </span>
          )}
          {/* Action */}
          <Button
            disabled={loading}
            type="submit"
            className="w-full mt-6"
          >
            {loading && <TbLoader className="animate-spin text-lg mr-2" />}
            Send Reset Email
          </Button>

          {/* More */}
          <div className="mt-4 flex items-center">
            <span className="text-foreground">Remember password?</span>
            <Button
              type="button"
              onClick={() => setAuthType('sign-in')}
              variant="ghost"
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
