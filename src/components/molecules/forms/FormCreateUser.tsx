import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaText } from '@/components/atoms/DaText'
import { useListUsers } from '@/hooks/useListUsers'
import { createUserService, updateUserService } from '@/services/user.service'
import { User, UserCreate, UserUpdate } from '@/types/user.type'
import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { TbLoader } from 'react-icons/tb'

interface FormCreateUserProps {
  onClose: () => void
  updateData?: User
}

const initialData = {
  email: '',
  name: '',
  password: '',
  role: 'user',
}

const FormCreateUser = ({ onClose, updateData }: FormCreateUserProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { refetch } = useListUsers()

  const isCreate = !updateData

  const [data, setData] = useState(initialData)

  useEffect(() => {
    if (updateData) {
      setData({
        email: updateData.email,
        name: updateData.name,
        role: updateData.role,
        password: '',
      })
    }
  }, [updateData])

  const createUser = async (data: UserCreate) => {
    try {
      await createUserService(data)
      setError('')
      setData(initialData)
      onClose()
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message ?? 'Something went wrong')
        return
      }
      setError('Something went wrong')
    }
  }

  const updateUser = async (id: string, data: UserUpdate) => {
    try {
      await updateUserService(id, data)
      setError('')
      setData(initialData)
      onClose()
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message ?? 'Something went wrong')
        return
      }
      setError('Something went wrong')
    }
  }

  const handleChange =
    (key: keyof typeof data) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setData((prev) => ({ ...prev, [key]: e.target.value }))
    }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    if (isCreate) {
      await createUser(data as UserCreate)
    } else {
      await updateUser(updateData.id, data as UserUpdate)
    }
    await refetch()
    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-[400px] min-w-[400px] min-h-[300px] px-2 md:px-6 py-4 bg-da-white"
    >
      {/* Title */}
      <DaText variant="title" className="text-da-primary-500">
        {isCreate ? 'Create New User' : 'Update User'}
      </DaText>

      {/* Content */}
      <DaInput
        value={data.name}
        onChange={handleChange('name')}
        name="name"
        placeholder="Name"
        label="Name *"
        className="mt-4"
      />

      {isCreate && (
        <>
          <DaInput
            value={data.email}
            onChange={handleChange('email')}
            name="email"
            placeholder="Email"
            label="Email *"
            className="mt-4"
          />
        </>
      )}
      <DaInput
        value={data.password}
        onChange={handleChange('password')}
        name="password"
        type="password"
        placeholder="Password"
        label={isCreate ? 'Password *' : 'Password'}
        className="mt-4"
      />
      <DaSelect
        label="Role"
        value={data.role}
        onValueChange={(value) =>
          setData((prev) => ({
            ...prev,
            role: value,
          }))
        }
        wrapperClassName="mt-4"
      >
        <DaSelectItem value="user">User</DaSelectItem>
        <DaSelectItem value="admin">Admin</DaSelectItem>
      </DaSelect>

      <div className="grow"></div>

      {/* Error */}
      {error && (
        <DaText variant="small" className="mt-2 text-da-accent-500">
          {error}
        </DaText>
      )}

      {/* Action */}
      <div className="space-x-2 ml-auto">
        <DaButton
          onClick={onClose}
          disabled={loading}
          type="button"
          className="w-fit mt-8"
          variant="plain"
        >
          Cancel
        </DaButton>
        <DaButton disabled={loading} type="submit" className="w-fit mt-8">
          {loading && <TbLoader className="animate-spin text-lg mr-2" />}
          {isCreate ? 'Create User' : 'Update User'}
        </DaButton>
      </div>
    </form>
  )
}

export default FormCreateUser
