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
import { registerService } from '@/services/auth.service'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { usePolicy } from '@/hooks/useInstanceCfg'
import { addLog } from '@/services/log.service'

interface FormRegisterProps {
  setAuthType: (type: 'sign-in' | 'register' | 'forgot') => void
}

const FormRegister = ({ setAuthType }: FormRegisterProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const policy_url = usePolicy()

  const validate = (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) => {
    const errors: string[] = []
    if (!name) errors.push('"name" is required')
    if (!email) errors.push('"email" is required')
    if (!password) errors.push('"password" is required')
    if (!confirmPassword) errors.push('"confirm password" is required')
    if (password !== confirmPassword)
      errors.push('"password" and "confirm password" must be the same')
    return errors
  }

  const register = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      const [name, email, password, confirmPassword] = [
        e.currentTarget.fullName.value,
        e.currentTarget.email.value,
        e.currentTarget.password.value,
        e.currentTarget.confirmPassword.value,
      ]

      // Validate register data
      const results = validate(name, email, password, confirmPassword)
      if (results.length > 0) {
        setError(results.join(', '))
        return
      }

      // Register
      await registerService(name, email, password)
      setError('')
      // eslint-disable-next-line no-self-assign
      window.location.href = window.location.href
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
      onSubmit={register}
      className="w-[30vw] lg:w-[25vw] min-w-[400px] max-w-[500px] h-fit max-h-[80vh] p-4 bg-background"
    >
      {/* Title */}
      <h2 className="text-lg font-semibold text-primary">Register</h2>

      <div className="mt-6"></div>
      {/* Content */}
      <div className="mt-4 flex flex-col gap-1">
        <Label>Name</Label>
        <Input name="fullName" placeholder="Name" />
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <Label>Email</Label>
        <Input name="email" placeholder="Email" />
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <Label>Password</Label>
        <Input name="password" placeholder="Password" type="password" />
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <Label>Confirm Password</Label>
        <Input
          name="confirmPassword"
          placeholder="Confirm Password"
          type="password"
        />
      </div>

      {policy_url && (
        <div className="my-2 text-sm">
          By click on Register button below, I agree to
          <a
            href={policy_url}
            target="_blank"
            className="ml-2 cursor-pointer hover:text-primary"
          >
            <u>Privacy Policy</u>
          </a>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm mt-3 text-destructive">{error}</p>}

      {/* Action */}
      <Button
        disabled={loading}
        type="submit"
        variant="default"
        className="w-full mt-6"
      >
        {loading && <Spinner className="mr-2" size={16} />}
        Register
      </Button>
      {/* More */}
      <div className="mt-4 flex items-center">
        <p className="text-base text-muted-foreground">
          Already have an account?
        </p>
        <Button
          type="button"
          onClick={() => setAuthType('sign-in')}
          variant="link"
          className="text-primary"
        >
          Sign in
        </Button>
      </div>
    </form>
  )
}

export default FormRegister
