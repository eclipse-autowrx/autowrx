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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select'
import { CVI } from '@/data/CVI'
import { createModelService } from '@/services/model.service'
import { ModelCreate } from '@/types/model.type'
import { isAxiosError } from 'axios'
import { FormEvent, useState } from 'react'
import { TbCircleCheckFilled, TbLoader } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../toaster/use-toast'
import useListModelLite from '@/hooks/useListModelLite'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useListVSSVersions from '@/hooks/useListVSSVersions'
import DaFileUpload from '@/components/atoms/DaFileUpload'

type ModelData = {
  cvi: string
  name: string
  mainApi: string
  api_version: string
  api_data_url?: string
}

const initialState: ModelData = {
  cvi: JSON.stringify(CVI),
  name: '',
  mainApi: 'Vehicle',
  api_version: 'v4.1',
}

const FormCreateModel = () => {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)
  const { refetch: refetchModelLite } = useListModelLite()
  const { data: versions } = useListVSSVersions()
  const { toast } = useToast()

  const { data: currentUser } = useSelfProfileQuery()

  const navigate = useNavigate()

  const handleChange = (name: keyof typeof data, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const handleVSSChange = (version: string) => {
    setData((prev) => ({ ...prev, api_version: version }))
  }

  const createNewModel = async (e: FormEvent<HTMLFormElement>) => {
    if (!currentUser) {
      console.error('User not found')
      return
    }
    e.preventDefault()
    try {
      setLoading(true)
      const body: ModelCreate = {
        main_api: data.mainApi,
        name: data.name,
        api_version: data.api_version,
      }
      if (data.api_data_url) {
        body.api_data_url = data.api_data_url
      }
      const modelId = await createModelService(body)
      await refetchModelLite()
      addLog({
        name: `New model '${body.name}' with visibility: ${body.visibility}`,
        description: `New model '${body.name}' was created by ${currentUser.email || currentUser.name || currentUser.id} version ${'a'}`,
        type: 'new-model',
        create_by: currentUser.id,
        ref_id: modelId,
        ref_type: 'model',
      })

      toast({
        title: ``,
        description: (
          <p className="flex items-center text-base font-medium">
            <TbCircleCheckFilled className="mr-2 h-5 w-5 text-green-500" />
            Model "{data.name}" created successfully
          </p>
        ),
        duration: 3000,
      })
      navigate(`/model/${modelId}`)
      setData(initialState)
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || 'Something went wrong')
        return
      }
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const signalFileValidator = async (file: File) => {
    if (file.type !== 'application/json') {
      return 'File must be a JSON file'
    }

    // Read file as text
    try {
      // Read file content
      const fileText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject('Error reading file')
        reader.readAsText(file)
      })

      // Validate JSON format
      JSON.parse(fileText)

      return null // Validation successful
    } catch (error) {
      console.error(error)
      return typeof error === 'string' ? error : 'Invalid JSON file'
    }
  }

  return (
    <form
      onSubmit={createNewModel}
      data-id="form-create-model"
      className="flex min-h-[300px] w-[400px] min-w-[400px] overflow-y-auto flex-col bg-background p-4"
    >
      {/* Title */}
      <h2 className="text-lg font-semibold text-primary">Create New Model</h2>

      {/* Content */}
      <div className="mt-4 flex flex-col gap-1">
        <Label>Model Name *</Label>
        <Input
          name="name"
          value={data.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Model name"
          data-id="form-create-model-input-name"
        />
      </div>

      <div className="mt-4" />

      <p className="text-base font-medium">Signal *</p>
      <div className="border mt-1 rounded-lg px-2 pb-2 pt-1">
        {!data.api_data_url && (
          <>
            <p className="text-sm">select VSS version</p>
            <Select onValueChange={handleVSSChange} defaultValue="v4.1">
              <SelectTrigger
                className="mt-1 w-full"
                data-id="form-create-model-select-api"
              >
                <SelectValue placeholder="Select VSS version" />
              </SelectTrigger>
              <SelectContent>
                {versions && Array.isArray(versions) ? (
                  versions.map((version: any) => (
                    <SelectItem key={version.name} value={version.name}>
                      COVESA VSS {version.name}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="v5.0">COVESA VSS v5.0</SelectItem>
                    <SelectItem value="v4.1">COVESA VSS v4.1</SelectItem>
                    <SelectItem value="v4.0">COVESA VSS v4.0</SelectItem>
                    <SelectItem value="v3.1">COVESA VSS v3.1</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </>
        )}

        <p className="text-sm mt-2">or upload a file</p>

        <DaFileUpload
          onStartUpload={() => {
            setUploading(true)
          }}
          onFileUpload={(url) => {
            setData((prev) => ({ ...prev, api_data_url: url }))
            setUploading(false)
          }}
          className="mt-1"
          accept=".json"
          validate={signalFileValidator}
        />
      </div>

      <div className="grow"></div>

      {/* Error */}
      {error && <p className="text-sm mt-2 text-destructive">{error}</p>}
      {/* Action */}
      <Button
        disabled={loading || uploading}
        type="submit"
        className="mt-8 w-full"
        data-id="form-create-model-btn-submit"
      >
        {loading && <TbLoader className="mr-2 animate-spin text-lg" />}
        Create Model
      </Button>
    </form>
  )
}

export default FormCreateModel
