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
import { useAuthConfigs } from '@/hooks/useAuthConfigs'
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
  const { authConfigs } = useAuthConfigs()
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
        (authConfigs.PASSWORD_MANAGEMENT
          ? data
          : {
              email: data.email,
              name: data.name,
            }) as UserCreate,
      )
    } else {
      await updateUser(
        updateData.id,
        authConfigs.PASSWORD_MANAGEMENT
          ? data
          : {
              name: data.name,
            },
      )
    }
    await refetch()
    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col bg-background"
    >
      <div className="space-y-4">
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
        {authConfigs.PASSWORD_MANAGEMENT && (
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
