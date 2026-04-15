// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'
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
import DaDuplicateNameHint from '@/components/atoms/DaDuplicateNameHint'
import useDuplicateNameCheck from '@/hooks/useDuplicateNameCheck'
import { createModelService } from '@/services/model.service'
import { ModelCreate } from '@/types/model.type'
import { isAxiosError } from 'axios'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { TbCircleCheckFilled, TbLoader } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../toaster/use-toast'
import useListModelLite from '@/hooks/useListModelLite'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useListVSSVersions from '@/hooks/useListVSSVersions'
import DaFileUploadButton from '@/components/atoms/DaFileUploadButton'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listModelTemplates } from '@/services/modelTemplate.service'
import { getConfig, useSiteConfig } from '@/utils/siteConfig'

const getCreatedById = (createdBy: any): string =>
  typeof createdBy === 'object' ? createdBy?.id ?? '' : createdBy ?? ''

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
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const { refetch: refetchModelLite, data: modelList } = useListModelLite()
  const { data: versions } = useListVSSVersions()
  const { toast } = useToast()

  const { data: currentUser } = useSelfProfileQuery()
  const gradientHeader = useSiteConfig('GRADIENT_HEADER', false)

  const ownedModelNames = useMemo(
    () =>
      modelList?.results
        ?.filter((m) => getCreatedById(m.created_by) === currentUser?.id)
        .map((m) => m.name) ?? [],
    [modelList, currentUser],
  )

  const [debouncedName, setDebouncedName] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(data.name), 300)
    return () => clearTimeout(timer)
  }, [data.name])

  const { isDuplicate: isDuplicateName, suggestedName } = useDuplicateNameCheck(debouncedName, ownedModelNames)

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ['model-templates'],
    queryFn: () => listModelTemplates({ limit: 100, page: 1 }),
  })

  const defaultTemplate = useMemo(
    () => templatesData?.results?.find((t) => t.visibility === 'default'),
    [templatesData],
  )

  // Auto-select default template when templates load
  useEffect(() => {
    if (defaultTemplate && selectedTemplateId === null) {
      setSelectedTemplateId(defaultTemplate.id)
    }
  }, [defaultTemplate]) // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = useNavigate()

  const handleChange = (name: keyof typeof data, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }))
    setError('')
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
      const defaultModelImage = await getConfig(
        'DEFAULT_MODEL_IMAGE',
        'site',
        undefined,
        '/imgs/default-model-image.png',
      )
      const body: ModelCreate = {
        main_api: data.mainApi,
        name: data.name,
        api_version: data.api_version,
        model_template_id: selectedTemplateId || null,
      }
      if (data.api_data_url) {
        body.api_data_url = data.api_data_url
      }
      if (defaultModelImage) {
        body.model_home_image_file = defaultModelImage
      }
      const modelId = await createModelService(body)
      const createdName = data.name
      setData(initialState)
      setDebouncedName('')
      setSelectedTemplateId(null)

      toast({
        title: ``,
        description: (
          <p className="flex items-center text-base font-medium">
            <TbCircleCheckFilled className="mr-2 h-5 w-5 text-green-500" />
            Model "{createdName}" created successfully
          </p>
        ),
        duration: 3000,
      })
      navigate(`/model/${modelId}`)

      refetchModelLite()
      queryClient.invalidateQueries({
        queryKey: ['modelsList', currentUser.id],
      })
      addLog({
        name: `New model '${body.name}' with visibility: ${body.visibility}`,
        description: `New model '${body.name}' was created by ${currentUser.email || currentUser.name || currentUser.id} version ${'a'}`,
        type: 'new-model',
        create_by: currentUser.id,
        ref_id: modelId,
        ref_type: 'model',
      })
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
        {isDuplicateName && (
          <DaDuplicateNameHint
            message="A model with this name already exists"
            suggestedName={suggestedName}
            onApplySuggestion={(name) => handleChange('name', name)}
            className="text-sm text-secondary mt-2"
          />
        )}
      </div>

      <div className="mt-4" />

      <p className="text-base font-medium text-primary">Signal *</p>
      <div className="border mt-1 rounded-lg p-2">
        <div className="flex items-stretch gap-2">
          {!data.api_data_url && (
            <>
              <div className="flex flex-col gap-1 flex-1 w-full">
                <p className="text-xs text-muted-foreground">VSS version</p>
                <Select onValueChange={handleVSSChange} defaultValue="v4.1">
                  <SelectTrigger
                    className="w-full"
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
              </div>
              <span className="text-xs text-muted-foreground self-center shrink-0">or</span>
            </>
          )}
          <div className="flex flex-col gap-1 flex-1 w-full">
            <p className="text-xs text-muted-foreground">Upload file</p>
            <DaFileUploadButton
              onStartUpload={() => {
                setUploading(true)
              }}
              onFileUpload={(url) => {
                setData((prev) => ({ ...prev, api_data_url: url }))
                setUploading(false)
              }}
              label="Browse"
              className="w-full"
              accept=".json"
              validate={signalFileValidator}
            />
          </div>
        </div>
      </div>

      <div className="grow"></div>

      {/* Template Selection */}
      <div className="mt-6 flex flex-col gap-1.5">
        <Label>{defaultTemplate ? 'Template' : 'Start from Template (Optional)'}</Label>
        <Select
          value={selectedTemplateId ?? '__scratch__'}
          onValueChange={(v) => setSelectedTemplateId(v === '__scratch__' ? null : v)}
        >
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {!defaultTemplate && (
              <SelectItem value="__scratch__">Start from scratch</SelectItem>
            )}
            {templatesData?.results?.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && <p className="text-sm mt-2 text-destructive">{error}</p>}
      {/* Action */}
      <Button
        disabled={loading || uploading || !data.name.trim() || isDuplicateName}
        type="submit"
        className={cn('mt-8 w-full', gradientHeader && 'bg-gradient-to-r from-primary to-secondary border-0')}
        data-id="form-create-model-btn-submit"
      >
        {loading && <TbLoader className="mr-2 animate-spin text-lg" />}
        Create Model
      </Button>
    </form>
  )
}

export default FormCreateModel
