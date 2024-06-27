import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaText } from '@/components/atoms/DaText'
import { registerService } from '@/services/auth.service'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { TbLoader } from 'react-icons/tb'
import { usePolicy } from '@/hooks/useInstanceCfg'

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
      className="w-[30vw] lg:w-[25vw] max-h-[80vh] p-4 bg-da-white"
    >
      {/* Title */}
      <DaText variant="title" className="text-da-primary-500">
        Register
      </DaText>

      <div className="mt-6"></div>
      {/* Content */}
      <DaInput
        name="fullName"
        placeholder="Name"
        label="Name"
        className="mt-4"
      />
      <DaInput
        name="email"
        placeholder="Email"
        label="Email"
        className="mt-4"
      />
      <DaInput
        name="password"
        placeholder="Password"
        label="Password"
        type="password"
        className="mt-4"
      />
      <DaInput
        name="confirmPassword"
        placeholder="Confirm Password"
        label="Confirm Password"
        type="password"
        className="mt-4"
      />

      {policy_url && (
        <div className="my-2 da-label-small">
          By click on Register button below, I agree to
          <a
            href={policy_url}
            target="_blank"
            className="ml-2 da-clickable hover:text-da-primary-500"
          >
            <u>Privacy Policy</u>
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <DaText variant="small" className="mt-3 block text-da-accent-500">
          {error}
        </DaText>
      )}

      {/* Action */}
      <DaButton
        disabled={loading}
        type="submit"
        variant="gradient"
        className="w-full mt-6"
      >
        {loading && <TbLoader className="animate-spin text-lg mr-2" />}
        Register
      </DaButton>
      {/* More */}
      <div className="mt-4 flex items-center">
        <DaText className="text-da-gray-medium">
          Already have an account?
        </DaText>
        <DaButton
          type="button"
          onClick={() => setAuthType('sign-in')}
          variant="text"
          className="text-da-primary-500"
        >
          Sign in
        </DaButton>
      </div>
    </form>
  )
}

export default FormRegister
