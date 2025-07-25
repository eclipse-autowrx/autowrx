// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaText } from '@/components/atoms/DaText'
import config from '@/configs/config'
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
}

const FormCreateUser = ({ onClose, updateData }: FormCreateUserProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { refetch } = useListUsers({
    includeFullDetails: true,
  })

  const isCreate = !updateData

  const [data, setData] = useState(initialData)

  useEffect(() => {
    if (updateData?.email && updateData?.name) {
      setData({
        email: updateData.email,
        name: updateData.name,
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
      await createUser(
        (config.strictAuth
          ? {
              email: data.email,
              name: data.name,
            }
          : data) as UserCreate,
      )
    } else {
      await updateUser(
        updateData.id,
        config.strictAuth
          ? {
              name: data.name,
            }
          : data,
      )
    }
    await refetch()
    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-h-[80vh] w-[30vw] flex-col bg-da-white p-4 lg:w-[25vw]"
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
      {!config.strictAuth && (
        <DaInput
          value={data.password}
          onChange={handleChange('password')}
          name="password"
          type="password"
          placeholder="Password"
          label={isCreate ? 'Password *' : 'Password'}
          className="mt-4"
        />
      )}
      <div className="grow"></div>

      {/* Error */}
      {error && (
        <DaText variant="small" className="mt-2 text-da-accent-500">
          {error}
        </DaText>
      )}

      {/* Action */}
      <div className="ml-auto space-x-2">
        <DaButton
          onClick={onClose}
          disabled={loading}
          type="button"
          className="mt-8 w-fit"
          variant="plain"
        >
          Cancel
        </DaButton>
        <DaButton disabled={loading} type="submit" className="mt-8 w-fit">
          {loading && (
            <TbLoader className="da-label-regular mr-2 animate-spin" />
          )}
          {isCreate ? 'Create User' : 'Update User'}
        </DaButton>
      </div>
    </form>
  )
}

export default FormCreateUser
