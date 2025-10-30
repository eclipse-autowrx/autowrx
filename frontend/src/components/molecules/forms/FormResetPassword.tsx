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
import { resetPasswordService } from '@/services/auth.service'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { TbCircleCheckFilled, TbLock } from 'react-icons/tb'
import { Link } from 'react-router-dom'

const FormResetPassword = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [changed, setChanged] = useState(false)

  const validate = (password: string, confirmPassword: string) => {
    const errors = []
    if (password !== confirmPassword)
      errors.push('"password" and "confirm password" must be the same')
    return errors
  }

  const resetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      const [password, confirmPassword] = [
        e.currentTarget.password.value,
        e.currentTarget.confirmPassword.value,
      ]
      const results = validate(password, confirmPassword)
      if (results.length > 0) {
        setError(results.join(', '))
        return
      }

      const token = new URLSearchParams(window.location.search).get('token')
      if (!token) {
        setError('Token not found')
        return
      }

      await resetPasswordService(password, token)
      setChanged(true)
      setError('')
      await new Promise(() =>
        setTimeout(() => {
          // eslint-disable-next-line no-self-assign
          window.location.href = '/'
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
      onSubmit={resetPassword}
      className="w-[30vw] lg:w-[25vw] min-w-[400px] max-w-[500px] h-fit max-h-[80vh] p-4 bg-background"
    >
      {/* Title */}
      <h2 className="text-lg font-semibold text-primary">Reset Password</h2>

      {changed ? (
        <>
          <p className="text-base mt-4">
            Reset password success! Please login with your new password.
          </p>
          <TbCircleCheckFilled className="text-8xl text-green-500 mx-auto mt-10" />
        </>
      ) : (
        <>
          {/* Content */}
          <div className="mt-4 flex flex-col gap-1">
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

          <div className="mt-4 flex flex-col gap-1">
            <Label>Confirm password</Label>
            <div className="relative">
              <TbLock className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground" />
              <Input
                name="confirmPassword"
                placeholder="Confirm password"
                type="password"
                className="pl-10"
              />
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
            Reset Password
          </Button>

          {/* More */}
          <div className="mt-4 flex items-center">
            <Link to="/" className="cursor-pointer">
              <p className="text-base text-primary cursor-pointer">Go Home</p>
            </Link>
          </div>
        </>
      )}
    </form>
  )
}

export default FormResetPassword
