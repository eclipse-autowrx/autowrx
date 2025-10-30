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
import config from '@/configs/config'
import { useListUsers } from '@/hooks/useListUsers'
import { createUserService, updateUserService } from '@/services/user.service'
import { User, UserCreate, UserUpdate } from '@/types/user.type'
import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'

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
      className="flex max-h-[80vh] w-[30vw] flex-col bg-background p-4 lg:w-[25vw]"
    >
      {/* Title */}
      <h2 className="text-lg font-semibold text-primary">
        {isCreate ? 'Create New User' : 'Update User'}
      </h2>

      {/* Content */}
      <div className="mt-4 flex flex-col gap-1">
        <Label>Name *</Label>
        <Input
          value={data.name}
          onChange={handleChange('name')}
          name="name"
          placeholder="Name"
        />
      </div>

      {isCreate && (
        <div className="mt-4 flex flex-col gap-1">
          <Label>Email *</Label>
          <Input
            value={data.email}
            onChange={handleChange('email')}
            name="email"
            placeholder="Email"
          />
        </div>
      )}
      {!config.strictAuth && (
        <div className="mt-4 flex flex-col gap-1">
          <Label>{isCreate ? 'Password *' : 'Password'}</Label>
          <Input
            value={data.password}
            onChange={handleChange('password')}
            name="password"
            type="password"
            placeholder="Password"
          />
        </div>
      )}
      <div className="grow"></div>

      {/* Error */}
      {error && <p className="text-sm mt-2 text-destructive">{error}</p>}

      {/* Action */}
      <div className="ml-auto space-x-2">
        <Button
          onClick={onClose}
          disabled={loading}
          type="button"
          className="mt-8 w-fit"
          variant="ghost"
        >
          Cancel
        </Button>
        <Button
          disabled={loading}
          type="submit"
          className="mt-8 w-fit"
          variant="default"
        >
          {loading && <Spinner className="mr-2" size={16} />}
          {isCreate ? 'Create User' : 'Update User'}
        </Button>
      </div>
    </form>
  )
}

export default FormCreateUser
