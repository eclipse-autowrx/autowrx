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
import { useQuery } from '@tanstack/react-query'
import { listModelTemplates } from '@/services/modelTemplate.service'

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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const { refetch: refetchModelLite } = useListModelLite()
  const { data: versions } = useListVSSVersions()
  const { toast } = useToast()

  const { data: currentUser } = useSelfProfileQuery()
  
  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ['model-templates'],
    queryFn: () => listModelTemplates({ limit: 100, page: 1 }),
  })

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
        model_template_id: selectedTemplateId || null,
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
      setSelectedTemplateId(null)
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
      className="flex min-h-[300px] w-full min-w-[400px] overflow-y-auto flex-col bg-background p-0"
    >
      {/* Title */}
      <h2 className="text-lg font-semibold text-primary">Create New Model</h2>

      {/* Content */}
      <div className="mt-4 flex flex-col gap-1.5">
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

      {/* Template Selection - Moved to bottom */}
      <div className="mt-6 flex flex-col gap-1.5">
        <Label>Start from Template (Optional)</Label>
        <div className="mt-1 space-y-2 max-h-48 overflow-y-auto">
          {/* Start from scratch option */}
          <div
            onClick={() => setSelectedTemplateId(null)}
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedTemplateId === null
                ? 'border-primary bg-primary/5'
                : 'border-input hover:border-primary/50'
            }`}
          >
            <div className="w-16 h-16 rounded border border-input bg-background flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-muted-foreground text-center px-2">
                Start from scratch
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Start from scratch</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create a new model without a template
              </p>
            </div>
            <input
              type="radio"
              name="template"
              value="scratch"
              checked={selectedTemplateId === null}
              onChange={() => setSelectedTemplateId(null)}
              className="w-4 h-4 text-primary"
            />
          </div>

          {/* Template options */}
          {templatesData?.results?.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplateId(template.id)}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedTemplateId === template.id
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:border-primary/50'
              }`}
            >
              <div className="w-16 h-16 rounded border border-input bg-background flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img
                  src={template.image || '/imgs/plugin.png'}
                  alt={template.name}
                  className="w-full h-full object-contain p-2"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{template.name}</p>
                {template.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {template.description}
                  </p>
                )}
              </div>
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={selectedTemplateId === template.id}
                onChange={() => setSelectedTemplateId(template.id)}
                className="w-4 h-4 text-primary flex-shrink-0"
              />
            </div>
          ))}
          {templatesData?.results?.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No templates available
            </p>
          )}
        </div>
      </div>

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
