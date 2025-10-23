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
import { registerService } from '@/services/auth.service'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { TbLoader } from 'react-icons/tb'
// import { usePolicy } from '@/hooks/useInstanceCfg'
import { addLog } from '@/services/log.service'

interface FormRegisterProps {
  setAuthType: (type: 'sign-in' | 'register' | 'forgot') => void
}

const FormRegister = ({ setAuthType }: FormRegisterProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // const policy_url = usePolicy()
  const policy_url = 'policy-url'

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
      // await addLog({
      //   name: `User registered`,
      //   description: `User registered with email: ${email}`,
      //   type: 'user-register@email',
      //   create_by: email,
      // })
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
      className="w-[30vw] lg:w-[25vw] min-w-[400px] max-w-[500px] h-fit max-h-[80vh] p-4 bg-white"
    >
      {/* Title */}
      <h2 className="text-xl font-semibold text-primary">
        Register
      </h2>

      <div className="mt-6"></div>
      {/* Content */}
      <div className="mt-4">
        <Label htmlFor="fullName">Name</Label>
        <Input
          id="fullName"
          name="fullName"
          placeholder="Name"
          className="mt-1"
        />
      </div>
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
      <div className="mt-4">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          className="mt-1"
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
      {error && (
        <span className="text-sm mt-3 block text-destructive">
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
        Register
      </Button>
      {/* More */}
      <div className="mt-4 flex items-center">
        <span className="text-muted-foreground">
          Already have an account?
        </span>
        <Button
          type="button"
          onClick={() => setAuthType('sign-in')}
          variant="ghost"
          className="text-primary"
        >
          Sign in
        </Button>
      </div>
    </form>
  )
}

export default FormRegister
