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
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { TbCircleCheckFilled, TbLoader } from 'react-icons/tb'
import { createPrototypeService } from '@/services/prototype.service'
import { useToast } from '../toaster/use-toast'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import useCurrentModel from '@/hooks/useCurrentModel'
import { isAxiosError } from 'axios'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { useNavigate, useLocation } from 'react-router-dom'
import useListModelContribution from '@/hooks/useListModelContribution'
import DaDuplicateNameHint from '@/components/atoms/DaDuplicateNameHint'
import useDuplicateNameCheck from '@/hooks/useDuplicateNameCheck'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select'
import { Model, ModelLite, ModelCreate } from '@/types/model.type'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/atoms/spinner'
import { CVI } from '@/data/CVI'
import { createModelService, listModelsLite } from '@/services/model.service'
import { cn } from '@/lib/utils'
import default_journey from '@/data/default_journey'
import { getConfig, useSiteConfig } from '@/utils/siteConfig'
import { listProjectTemplates } from '@/services/projectTemplate.service'
import {
  getDefaultDashboardCfg,
  parseProjectTemplates,
} from '@/utils/projectTemplate'

interface FormCreatePrototypeProps {
  onClose?: () => void
  onPrototypeChange?: (data: {
    prototypeName: string
    modelName?: string
    modelId?: string
  }) => void
  disabledState?: [boolean, (disabled: boolean) => void]
  hideCreateButton?: boolean
  code?: string
  widget_config?: string
  title?: string
  buttonText?: string
}

const initialState = {
  prototypeName: '',
  modelName: '',
  language: '',
  code: '',
  cvi: JSON.stringify(CVI),
  mainApi: 'Vehicle',
}

const FormCreatePrototype = ({
  onClose,
  onPrototypeChange,
  disabledState,
  hideCreateButton,
  code,
  widget_config,
  title,
  buttonText,
}: FormCreatePrototypeProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)
  const [disabled, setDisabled] = disabledState ?? useState(false)
  const gradientHeader = useSiteConfig('GRADIENT_HEADER', false)

  const { data: currentModel } = useCurrentModel()
  const { data: contributionModels, isLoading: isFetchingModelContribution } =
    useListModelContribution()
  const [localModel, setLocalModel] = useState<ModelLite>()
  const { refetch, data: existingPrototypes } = useListModelPrototypes(
    localModel?.id || '',
  )
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: currentUser } = useSelfProfileQuery()

  const { data: remoteTemplatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['project-templates-list'],
    queryFn: () => listProjectTemplates({ limit: 100, page: 1, visibility: 'public' }),
  })

  const templateOptions = useMemo(
    () => parseProjectTemplates(remoteTemplatesData?.results ?? []),
    [remoteTemplatesData],
  )

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  useEffect(() => {
    if (templateOptions.length && !selectedTemplateId) {
      const first = templateOptions[0]
      setSelectedTemplateId(first.id)
      setData((prev) => ({ ...prev, code: first.code, language: first.language }))
    }
  }, [templateOptions, selectedTemplateId])

  const [debouncedPrototypeName, setDebouncedPrototypeName] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPrototypeName(data.prototypeName), 300)
    return () => clearTimeout(timer)
  }, [data.prototypeName])

  const existingPrototypeNames = useMemo(
    () => (localModel ? existingPrototypes?.map((p: any) => p.name) ?? [] : []),
    [existingPrototypes, localModel],
  )

  const { isDuplicate: isDuplicatePrototypeName, suggestedName: suggestedPrototypeName } =
    useDuplicateNameCheck(debouncedPrototypeName, existingPrototypeNames)

  const { data: ownedModelsData } = useQuery({
    queryKey: ['listModelLiteOwned', currentUser?.id],
    queryFn: () => listModelsLite({ created_by: currentUser!.id }),
    enabled: !!currentUser?.id && !localModel,
  })

  const ownedModelNames = useMemo(
    () => ownedModelsData?.results?.map((m) => m.name) ?? [],
    [ownedModelsData],
  )

  const [debouncedModelName, setDebouncedModelName] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedModelName(data.modelName), 300)
    return () => clearTimeout(timer)
  }, [data.modelName])

  const { isDuplicate: isDuplicateModelName, suggestedName: suggestedModelName } =
    useDuplicateNameCheck(debouncedModelName, ownedModelNames)

  const handleChange = (name: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const onTemplateChange = (templateId: string) => {
    const template = templateOptions.find((t) => t.id === templateId)
    if (template) {
      setData((prev) => ({ ...prev, code: template.code, language: template.language }))
      setSelectedTemplateId(templateId)
    }
  }

  const createNewPrototype = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault() // Prevent the form from submitting

    try {
      setLoading(true)

      // Initialize variables to hold the model ID and response from prototype creation
      let modelId: string
      let response

      if (localModel) {
        // Scenario 1: `localModel` exists, use its ID
        modelId = localModel.id
      } else if (data.modelName) {
        // Scenario 2: `localModel` does not exist, create a new model
        const modelBody: ModelCreate = {
          main_api: data.mainApi,
          name: data.modelName,
          api_version: 'v4.1',
        }

        const newModelId = await createModelService(modelBody)
        modelId = newModelId
      } else {
        throw new Error('Model data is missing')
      }

      const defaultPrototypeImage = await getConfig(
        'DEFAULT_PROTOTYPE_IMAGE',
        'site',
        undefined,
        '/imgs/default_prototype_cover.jpg',
      )

      const selectedTemplate = templateOptions.find((t) => t.id === selectedTemplateId)
      const language = data.language || selectedTemplate?.language || 'python'

      const body = {
        model_id: modelId,
        name: data.prototypeName,
        language,
        state: 'development',
        apis: { VSC: [], VSS: [] },
        code: data.code,
        complexity_level: 3,
        customer_journey: selectedTemplate?.customer_journey?.trim()
          ? selectedTemplate.customer_journey
          : default_journey,
        description: {
          problem: '',
          says_who: '',
          solution: '',
          status: '',
        },
        image_file: defaultPrototypeImage || '/imgs/default_prototype_cover.jpg',
        skeleton: '{}',
        tags: [],
        widget_config:
          widget_config || selectedTemplate?.widget_config || getDefaultDashboardCfg(language) || '[]',
        autorun: true,
      }

      // Create the prototype using the model ID

      response = await createPrototypeService(body)

      // Log the prototype creation
      await addLog({
        name: `New prototype '${data.prototypeName}' under model '${localModel?.name || data.modelName}'`,
        description: `Prototype '${data.prototypeName}' was created by ${currentUser?.email || currentUser?.name || currentUser?.id}`,
        type: 'new-prototype',
        create_by: currentUser?.id!,
        ref_id: response.id,
        ref_type: 'prototype',
        parent_id: modelId,
      })

      toast({
        title: ``,
        description: (
          <p className="flex items-center text-sm">
            <TbCircleCheckFilled className="mr-2 h-4 w-4 text-green-500" />
            Prototype "{data.prototypeName}" created successfully
          </p>
        ),
        duration: 3000,
      })

      // Navigate to the new prototype's page
      await navigate(`/model/${modelId}/library/prototype/${response.id}`)

      // Optionally close the form/modal
      if (onClose) onClose()

      // Reset form data
      setData(initialState)

      // Refetch data
      await refetch()
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentModel) {
      const modelLite = {
        id: currentModel.id,
        name: currentModel.name,
        visibility: currentModel.visibility,
        model_home_image_file: currentModel.model_home_image_file || '',
        created_at: currentModel.created_at,
        created_by: currentModel.created_by,
        tags: currentModel.tags,
      }
      setLocalModel({
        ...modelLite,
        created_by: modelLite.created_by?.id || '',
      })
    } else if (
      contributionModels &&
      !isFetchingModelContribution &&
      contributionModels.results.length > 0
    ) {
      setLocalModel(contributionModels.results[0])
    }
  }, [contributionModels, isFetchingModelContribution, currentModel])

  useEffect(() => {
    if (
      loading ||
      isLoadingTemplates ||
      (templateOptions.length > 0 && !selectedTemplateId) ||
      (!localModel && !data.modelName) ||
      !data.prototypeName ||
      isDuplicatePrototypeName ||
      (!localModel && isDuplicateModelName)
    ) {
      setDisabled(true)
    } else setDisabled(false)
    if (onPrototypeChange) {
      if (localModel) {
        onPrototypeChange({
          prototypeName: data.prototypeName,
          modelId: localModel.id,
          modelName: undefined,
        })
      } else {
        onPrototypeChange({
          prototypeName: data.prototypeName,
          modelName: data.modelName,
          modelId: undefined,
        })
      }
    }
  }, [
    loading,
    isLoadingTemplates,
    selectedTemplateId,
    localModel,
    data.modelName,
    data.prototypeName,
    isDuplicatePrototypeName,
    isDuplicateModelName,
  ])

  return (
    <form
      onSubmit={createNewPrototype}
      className="flex flex-col bg-background"
    >
      {!currentModel &&
        (contributionModels && !isFetchingModelContribution && localModel ? (
          <div className="flex flex-col mt-4">
            <Label className="mb-2">Model Name *</Label>
            <Select
              defaultValue={localModel.id}
              onValueChange={(e: string) => {
                setError('')
                const selectedModel = contributionModels.results.find(
                  (model: ModelLite) => model.id === e,
                )
                selectedModel && setLocalModel(selectedModel)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contributionModels.results.map(
                  (model: ModelLite, index: number) => (
                    <SelectItem key={index} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        ) : isFetchingModelContribution ? (
          <p className="mt-4 flex items-center text-base text-muted-foreground">
            <Spinner className="mr-1 h-4 w-4" />
            Loading vehicle model...
          </p>
        ) : (
          <div className="flex flex-col mt-4">
            <Label className="mb-2">Model Name *</Label>
            <Input
              name="name"
              value={data.modelName}
              onChange={(e) => handleChange('modelName', e.target.value)}
              placeholder="Model name"
              className="bg-background"
            />
            {isDuplicateModelName && (
              <DaDuplicateNameHint
                message="A model with this name already exists"
                suggestedName={suggestedModelName}
                onApplySuggestion={(name) => handleChange('modelName', name)}
              />
            )}
          </div>
        ))}

      <div className="flex flex-col mt-4">
        <Label className="mb-2">Prototype Name *</Label>
        <Input
          name="name"
          value={data.prototypeName}
          onChange={(e) => handleChange('prototypeName', e.target.value)}
          placeholder="Name"
          data-id="prototype-name-input"
        />
        {isDuplicatePrototypeName && (
          <DaDuplicateNameHint
            message={`The prototype name '${data.prototypeName}' is already in use for model '${localModel?.name ?? data.modelName}'`}
            suggestedName={suggestedPrototypeName}
            onApplySuggestion={(name) => handleChange('prototypeName', name)}
            className="mt-2"
          />
        )}
        {error && !isDuplicatePrototypeName && (
          <p className="mt-2 text-sm text-secondary">{error}</p>
        )}
      </div>

      {(isLoadingTemplates || templateOptions.length > 0) && (
        <div className="flex flex-col mt-4">
          <Label className="mb-2">Project Template *</Label>
          {isLoadingTemplates ? (
            <p className="flex items-center text-sm text-muted-foreground h-9">
              <Spinner className="mr-1 h-4 w-4" />
              Loading templates...
            </p>
          ) : (
            <Select
              value={selectedTemplateId}
              onValueChange={(v: string) => {
                onTemplateChange(v)
              }}
            >
              <SelectTrigger data-id="project-template-select" className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templateOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <Button
        disabled={disabled}
        type="submit"
        data-id="btn-create-prototype"
        className={cn('mt-8 w-full', hideCreateButton && 'hidden', gradientHeader && 'bg-gradient-to-r from-primary to-secondary border-0')}
      >
        {loading && <TbLoader className="mr-2 animate-spin text-lg" />}
        {buttonText ?? 'Create Prototype'}
      </Button>
    </form>
  )
}

export default FormCreatePrototype
