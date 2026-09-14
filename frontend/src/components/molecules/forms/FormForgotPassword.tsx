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
import { sendResetPasswordEmailService, resetPasswordWithCodeService } from '@/services/auth.service'
import { isAxiosError } from 'axios'
import { useState, useRef } from 'react'
import { TbCircleCheckFilled, TbAt, TbLock, TbShieldCheck } from 'react-icons/tb'

interface FormForgotPasswordProps {
  setAuthType: (type: 'sign-in' | 'register' | 'forgot') => void
}

type Step = 'email' | 'code' | 'done'

const FormForgotPassword = ({ setAuthType }: FormForgotPasswordProps) => {
  const [step, setStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formEmail = e.currentTarget.email.value
    if (!formEmail) return

    try {
      setLoading(true)
      setError('')
      await sendResetPasswordEmailService(formEmail)
      setEmail(formEmail)
      setStep('code')
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Something went wrong')
      } else {
        setError('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)
    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)

    // Auto-focus next input
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const newCode = [...code]
      for (let i = 0; i < pasted.length && i < 6; i++) {
        newCode[i] = pasted[i]
      }
      setCode(newCode)
      const focusIndex = Math.min(pasted.length, 5)
      codeInputRefs.current[focusIndex]?.focus()
    }
  }

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const codeStr = code.join('')
    if (codeStr.length !== 6) {
      setError('Please enter the full 6-digit code')
      return
    }
    if (!password) {
      setError('Please enter a new password')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      setError('')
      await resetPasswordWithCodeService(email, codeStr, password)
      setStep('done')
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Something went wrong')
      } else {
        setError('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    try {
      setLoading(true)
      setError('')
      await sendResetPasswordEmailService(email)
      setError('')
      setCode(['', '', '', '', '', ''])
      codeInputRefs.current[0]?.focus()
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to resend code')
      } else {
        setError('Failed to resend code')
      }
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Enter email
  if (step === 'email') {
    return (
      <form onSubmit={handleSendCode} className="flex flex-col bg-background">
        <h2 className="text-lg font-semibold text-primary">Forgot Password</h2>
        <p className="text-base mt-4">
          Enter the email associated with your account. We'll send you a 6-digit code to reset your password.
        </p>

        <div className="mt-4 flex flex-col gap-1.5">
          <Label>Email</Label>
          <div className="relative">
            <TbAt className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground" />
            <Input name="email" type="email" placeholder="Email" className="pl-10" required />
          </div>
        </div>

        {error && <p className="text-sm mt-2 text-destructive">{error}</p>}

        <Button disabled={loading} type="submit" variant="default" className="w-full mt-6">
          {loading && <Spinner className="mr-2" size={16} />}
          Send Reset Code
        </Button>

        <div className="mt-4 flex items-center">
          <p className="text-sm text-foreground">Remember password?</p>
          <Button type="button" onClick={() => setAuthType('sign-in')} variant="link" className="text-primary">
            Sign In
          </Button>
        </div>
      </form>
    )
  }

  // Step 2: Enter code + new password
  if (step === 'code') {
    return (
      <form onSubmit={handleResetPassword} className="flex flex-col bg-background">
        <h2 className="text-lg font-semibold text-primary">Enter Reset Code</h2>
        <p className="text-sm mt-2 text-muted-foreground">
          We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
        </p>

        {/* Code input */}
        <div className="mt-4 flex flex-col gap-1.5">
          <Label className="flex items-center gap-1.5">
            <TbShieldCheck className="size-4" />
            Reset Code
          </Label>
          <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { codeInputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                className="w-10 h-12 text-center text-lg font-mono font-bold border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                autoFocus={i === 0}
              />
            ))}
          </div>
          <div className="flex justify-center mt-1">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Didn't receive the code? Resend
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="mt-4 flex flex-col gap-1.5">
          <Label className="flex items-center gap-1.5">
            <TbLock className="size-4" />
            New Password
          </Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />
        </div>

        {/* Confirm password */}
        <div className="mt-3 flex flex-col gap-1.5">
          <Label className="flex items-center gap-1.5">
            <TbLock className="size-4" />
            Confirm Password
          </Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            required
          />
        </div>

        {error && <p className="text-sm mt-2 text-destructive">{error}</p>}

        <Button disabled={loading} type="submit" variant="default" className="w-full mt-6">
          {loading && <Spinner className="mr-2" size={16} />}
          Reset Password
        </Button>

        <div className="mt-4 flex items-center">
          <button
            type="button"
            onClick={() => {
              setStep('email')
              setError('')
              setCode(['', '', '', '', '', ''])
              setPassword('')
              setConfirmPassword('')
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            &larr; Use a different email
          </button>
        </div>
      </form>
    )
  }

  // Step 3: Success
  return (
    <div className="flex flex-col bg-background items-center">
      <h2 className="text-lg font-semibold text-primary">Password Reset</h2>
      <TbCircleCheckFilled className="text-7xl text-green-500 mt-6" />
      <p className="text-base mt-4 text-center">
        Your password has been reset successfully.
      </p>
      <Button
        type="button"
        onClick={() => setAuthType('sign-in')}
        variant="default"
        className="w-full mt-6"
      >
        Sign In
      </Button>
    </div>
  )
}

export default FormForgotPassword
