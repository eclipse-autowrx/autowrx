import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaText } from '@/components/atoms/DaText'
import { sendResetPasswordEmailService } from '@/services/auth.service'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { TbCircleCheckFilled, TbLoader } from 'react-icons/tb'
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
      className="w-[30vw] lg:w-[25vw] min-w-[400px] max-w-[500px] h-fit max-h-[80vh] p-4 bg-da-white"
    >
      {/* Title */}
      <DaText variant="title" className="text-da-primary-500">
        Forgot Password
      </DaText>

      {sent ? (
        <>
          <DaText className="block mt-4">
            Reset password email sent! Please check your email and follow the
            instructions.
          </DaText>
          <TbCircleCheckFilled className="text-8xl text-green-500 mx-auto mt-10" />
        </>
      ) : (
        <>
          <DaText className="block mt-4">
            Enter the email associated with your account. We will send you an
            email to reset your password.
          </DaText>

          {/* Content */}
          <DaInput
            name="email"
            placeholder="Email"
            label="Email"
            className="mt-4"
            Icon={TbAt}
            iconBefore
            iconSize={18}
          />

          {/* Error */}
          {error && (
            <DaText variant="small" className="mt-2 block text-da-accent-500">
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
            Send Reset Email
          </DaButton>

          {/* More */}
          <div className="mt-4 flex items-center">
            <DaText className="text-da-gray-dark">Remember password?</DaText>
            <DaButton
              type="button"
              onClick={() => setAuthType('sign-in')}
              variant="text"
              className="text-da-primary-500"
            >
              Sign In
            </DaButton>
          </div>
        </>
      )}
    </form>
  )
}

export default FormForgotPassword
