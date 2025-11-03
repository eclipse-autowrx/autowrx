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
import config from '@/configs/config'
import { useListUsers } from '@/hooks/useListUsers'
import { createUserService, updateUserService } from '@/services/user.service'
import { User, UserCreate, UserUpdate } from '@/types/user.type'
import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { TbLoader } from 'react-icons/tb'
import { useToast } from '../toaster/use-toast'

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
  const { toast } = useToast()

  const isCreate = !updateData

  const [data, setData] = useState(initialData)

  useEffect(() => {
    if (updateData?.name) {
      setData({
        email: updateData.email || '',
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
      toast({
        title: 'Success',
        description: 'User created successfully.',
      })
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ?? 'Something went wrong'
        setError(errorMessage)
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
        return
      }
      setError('Something went wrong')
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  const updateUser = async (id: string, data: UserUpdate) => {
    try {
      await updateUserService(id, data)
      setError('')
      setData(initialData)
      onClose()
      toast({
        title: 'Success',
        description: 'User updated successfully.',
      })
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ?? 'Something went wrong'
        setError(errorMessage)
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
        return
      }
      setError('Something went wrong')
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      })
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
      className="flex max-h-[80vh] w-full flex-col bg-background p-4"
    >
      {/* Title */}
      <h2 className="text-xl font-semibold text-primary">
        {isCreate ? 'Create New User' : 'Update User'}
      </h2>

      {/* Content */}
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={handleChange('name')}
            name="name"
            placeholder="Name"
            required
          />
        </div>

        {isCreate && (
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              value={data.email}
              onChange={handleChange('email')}
              name="email"
              type="email"
              placeholder="Email"
              required
            />
          </div>
        )}
        {!config.strictAuth && (
          <div className="space-y-2">
            <Label htmlFor="password">
              {isCreate ? 'Password *' : 'Password'}
            </Label>
            <Input
              id="password"
              value={data.password}
              onChange={handleChange('password')}
              name="password"
              type="password"
              placeholder="Password"
              required={isCreate}
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}

      {/* Action */}
      <div className="ml-auto space-x-2 mt-8 flex justify-end">
        <Button
          onClick={onClose}
          disabled={loading}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button disabled={loading} type="submit">
          {loading && <TbLoader className="mr-2 animate-spin" />}
          {isCreate ? 'Create User' : 'Update User'}
        </Button>
      </div>
    </form>
  )
}

export default FormCreateUser
