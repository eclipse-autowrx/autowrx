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
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { TbCircleCheckFilled, TbLock } from 'react-icons/tb'
import { partialUpdateUserService } from '@/services/user.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

const FormUpdatePassword = ({}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [changed, setChanged] = useState(false)
  const { data: profile } = useSelfProfileQuery()

  const validate = (password: string, confirmPassword: string) => {
    const errors = []
    if (password !== confirmPassword)
      errors.push('"password" and "confirm password" must be the same')
    return errors
  }

  const resetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!profile) return
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

      await partialUpdateUserService({ password })
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
      className="w-[30vw] lg:w-[25vw] max-h-[80vh] bg-background"
    >
      {/* Title */}
      <h2 className="text-lg font-semibold text-primary">Change Password</h2>

      {changed ? (
        <>
          <p className="text-base mt-4">
            Reset password success! Please login with your new password.
          </p>
          <TbCircleCheckFilled className="text-6xl text-green-500 mx-auto my-4" />
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
          {error && <p className="text-sm mt-2 text-red-500">{error}</p>}
          {/* Action */}
          <Button
            disabled={loading}
            type="submit"
            variant="default"
            className="w-full mt-6"
          >
            {loading && <Spinner className="mr-2" size={16} />}
            Change Password
          </Button>
        </>
      )}
    </form>
  )
}

export default FormUpdatePassword
