import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaText } from '@/components/atoms/DaText'
import { loginService } from '@/services/auth.service'
import { addLog } from '@/services/log.service'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { TbLoader } from 'react-icons/tb'
import { TbAt, TbLock } from 'react-icons/tb'
import SSOHandler from '../SSOHandler'
import config from '@/configs/config'

interface FormSignInProps {
  setAuthType: (type: 'sign-in' | 'register' | 'forgot') => void
}

const FormSignIn = ({ setAuthType }: FormSignInProps) => {
  const [loading, setLoading] = useState(false)
  const [ssoLoading, setSSOLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      const [email, password] = [
        e.currentTarget.email.value,
        e.currentTarget.password.value,
      ]
      await loginService(email, password)
      await addLog({
        name: `User log in`,
        description: `User ${email} logged in`,
        type: 'user-login@email',
        create_by: email,
      })
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
      onSubmit={signIn}
      className="w-[30vw] lg:w-[25vw] min-w-[400px] max-w-[500px] max-h-[90vh] p-4 bg-da-white"
    >
      {/* Title */}
      <DaText variant="title" className="text-da-primary-500">
        Sign In
      </DaText>
      <div className="mt-6"></div>
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
      <DaInput
        name="password"
        placeholder="Password"
        label="Password"
        type="password"
        className="mt-4"
        Icon={TbLock}
        iconBefore
        iconSize={18}
      />
      <div className="flex items-center justify-end mt-1">
        <DaButton
          type="button"
          variant="link"
          onClick={() => setAuthType('forgot')}
        >
          Forget Password
        </DaButton>
      </div>
      {/* Error */}
      {error && (
        <DaText variant="small" className="mt-2 text-da-accent-500">
          {error}
        </DaText>
      )}
      {/* Action */}
      <DaButton
        disabled={loading || ssoLoading}
        type="submit"
        variant="gradient"
        className="w-full mt-2"
      >
        {loading && <TbLoader className="animate-spin text-lg mr-2" />}
        Sign in
      </DaButton>
      <div className="mt-4 flex w-full justify-center items-center">
        <DaText className="text-da-gray-medium">Don't have an account?</DaText>
        <DaButton
          type="button"
          onClick={() => setAuthType('register')}
          variant="text"
          className="text-da-primary-500 !da-label-small !px-1.5"
        >
          Register
        </DaButton>
      </div>
      {(config.instance === 'xhub' || config.instance === 'etas') && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase py-6">
              <DaText
                variant="small"
                className="bg-white px-2 text-da-gray-medium"
              >
                {' '}
                Or continue with{' '}
              </DaText>
            </div>
          </div>

          <div
            onClick={(event) => {
              setSSOLoading(true)
              event.preventDefault()
              event.stopPropagation()
            }}
          >
            <SSOHandler>
              <DaButton
                variant="outline-nocolor"
                className="w-full mt-2"
                disabled={loading || ssoLoading}
              >
                {ssoLoading && (
                  <TbLoader className="animate-spin text-lg mr-2" />
                )}
                {config.instance === 'xhub' && 'BOSCH SSO'}
                {config.instance === 'etas' && 'ETAS SSO'}
              </DaButton>
            </SSOHandler>
          </div>
        </>
      )}
    </form>
  )
}

export default FormSignIn
