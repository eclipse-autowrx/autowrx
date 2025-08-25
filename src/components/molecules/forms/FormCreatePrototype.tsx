// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaText } from '@/components/atoms/DaText'
import { FormEvent, useEffect, useState } from 'react'
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
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { Model, ModelLite, ModelCreate } from '@/types/model.type'
import DaLoader from '@/components/atoms/DaLoader'
import { CVI } from '@/data/CVI'
import { createModelService } from '@/services/model.service'
import clsx from 'clsx'
import default_journey from '@/data/default_journey'
import { SAMPLE_PROJECTS } from '@/data/sampleProjects'

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
  language: SAMPLE_PROJECTS[0].language || '',
  code: SAMPLE_PROJECTS[0].data || '',
  cvi: JSON.stringify(CVI),
  mainApi: 'Vehicle',
}

const DEFAULT_DASHBOARD_CFG = `{
  "autorun": false,
  "widgets": [
    {
      "plugin": "Builtin",
      "widget": "Embedded-Widget",
      "options": {
        "api": "Vehicle.Body.Lights.Beam.Low.IsOn",
        "defaultImgUrl": "https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_off.png",
        "displayExactMatch": true,
        "valueMaps": [
          {
            "value": true,
            "imgUrl": "https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_on.png"
          },
          {
            "value": false,
            "imgUrl": "https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_off.png"
          }
        ],
        "url": "https://store-be.digitalauto.tech/data/store-be/Image%20by%20Signal%20value/latest/index/index.html",
        "iconURL": "https://upload.digitalauto.tech/data/store-be/3c3685b3-0b58-4f75-820e-9af0180cf3f0.png"
      },
      "boxes": [
        2,
        3,
        7,
        8
      ],
      "path": ""
    },
    {
      "plugin": "Builtin",
      "widget": "Embedded-Widget",
      "options": {
        "url": "https://store-be.digitalauto.tech/data/store-be/Terminal/latest/terminal/index.html",
        "iconURL": "https://upload.digitalauto.tech/data/store-be/e991ea29-5fbf-42e9-9d3d-cceae23600f0.png"
      },
      "boxes": [
        1,
        6
      ],
      "path": ""
    },
    {
      "plugin": "Builtin",
      "widget": "Embedded-Widget",
      "options": {
        "api": "Vehicle.Body.Lights.Beam.Low.IsOn",
        "lineColor": "#005072",
        "dataUpdateInterval": "1000",
        "maxDataPoints": "30",
        "url": "https://store-be.digitalauto.tech/data/store-be/Chart%20Signal%20Widget/latest/index/index.html",
        "iconURL": "https://upload.digitalauto.tech/data/store-be/f25ceb29-b9e8-470e-897a-4d843e16a0cf.png"
      },
      "boxes": [
        4,
        5
      ],
      "path": ""
    },
    {
      "plugin": "Builtin",
      "widget": "Embedded-Widget",
      "options": {
        "apis": [
          "Vehicle.Body.Lights.Beam.Low.IsOn"
        ],
        "vss_json": "https://bewebstudio.digitalauto.tech/data/projects/sHQtNwric0H7/vss_rel_4.0.json",
        "url": "https://store-be.digitalauto.tech/data/store-be/Signal%20List%20Settable/latest/table-settable/index.html",
        "iconURL": "https://upload.digitalauto.tech/data/store-be/dccabc84-2128-4e5d-9e68-bc20333441c4.png"
      },
      "boxes": [
        9,
        10
      ],
      "path": ""
    }
  ]
}`

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

  const { data: currentModel } = useCurrentModel()
  const { data: contributionModels, isLoading: isFetchingModelContribution } =
    useListModelContribution()
  const [localModel, setLocalModel] = useState<ModelLite>()
  const { refetch } = useListModelPrototypes(
    currentModel ? currentModel.id : '',
  )
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: currentUser } = useSelfProfileQuery()

  const [projectTemplate, setProjectTemplate] = useState<string>("")

  const handleChange = (name: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const onTemplateChange = (v: string) => {
    const template = SAMPLE_PROJECTS.find((project) => project.label === v)
    let code = ""
    let language = ""
    if (template) {
      if (typeof template.data === 'string') {
        code = template.data
        language = template.language
      } else {
        code = JSON.stringify(template.data)
        language = template.language
      }
      setData((prev) => ({ ...prev, code: code, language: language }))
    }
  }

  const getDefaultDashboardCfg = (lang: string) => {
    if (lang == 'rust') return `{"autorun": false, "widgets": [] }`
    return DEFAULT_DASHBOARD_CFG
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

      const body = {
        model_id: modelId,
        name: data.prototypeName,
        language: data.language,
        state: 'development',
        apis: { VSC: [], VSS: [] },
        code: data.code,
        complexity_level: 3,
        customer_journey: default_journey,
        description: {
          problem: '',
          says_who: '',
          solution: '',
          status: '',
        },
        image_file: '/imgs/default_prototype_cover.jpg',
        skeleton: '{}',
        tags: [],
        widget_config:
          widget_config || getDefaultDashboardCfg(data.language) || '[]',
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
          <DaText variant="small" className="flex items-center">
            <TbCircleCheckFilled className="mr-2 h-4 w-4 text-green-500" />
            Prototype "{data.prototypeName}" created successfully
          </DaText>
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
    if (loading || (!localModel && !data.modelName) || !data.prototypeName) {
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
  }, [loading, localModel, data.modelName, data.prototypeName])

  return (
    <form
      onSubmit={createNewPrototype}
      className="flex max-h-[80vh] w-[40vw] min-w-[400px] flex-col bg-da-white p-4 lg:w-[25vw]"
    >
      <DaText variant="title" className="text-da-primary-500">
        {title ?? 'New Prototype'}
      </DaText>

      {!currentModel &&
        (contributionModels && !isFetchingModelContribution && localModel ? (
          <DaSelect
            defaultValue={localModel.id}
            label="Model Name *"
            wrapperClassName="mt-4"
            onValueChange={(e) => {
              const selectedModel = contributionModels.results.find(
                (model) => model.id === e,
              )
              selectedModel && setLocalModel(selectedModel)
            }}
          >
            {contributionModels.results.map((model, index) => (
              <DaSelectItem key={index} value={model.id}>
                {model.name}
              </DaSelectItem>
            ))}
          </DaSelect>
        ) : isFetchingModelContribution ? (
          <DaText variant="regular" className="mt-4 flex items-center">
            <DaLoader className="mr-1 h-4 w-4" />
            Loading vehicle model...
          </DaText>
        ) : (
          <DaInput
            name="name"
            value={data.modelName}
            onChange={(e) => handleChange('modelName', e.target.value)}
            placeholder="Model name"
            label="Model Name *"
            className="mt-4"
            inputClassName="bg-white"
          />
        ))}

      <DaInput
        name="name"
        value={data.prototypeName}
        onChange={(e) => handleChange('prototypeName', e.target.value)}
        placeholder="Name"
        label="Prototype Name *"
        className="mt-4"
        dataId='prototype-name-input'
      />

      <DaSelect
        defaultValue={SAMPLE_PROJECTS[0].label}
        label="Project Template *"
        wrapperClassName="mt-4"
        dataId="prototype-language-select"
        onValueChange={(v) => {
          onTemplateChange(v)
        }}
      >
        {SAMPLE_PROJECTS.map((project) => (
          <DaSelectItem key={project.label} value={project.label}>
            {project.label}
          </DaSelectItem>
        ))}
      </DaSelect>

      {error && (
        <DaText variant="small" className="mt-4 text-da-accent-500">
          {error}
        </DaText>
      )}

      <DaButton
        disabled={disabled}
        type="submit"
        variant="gradient"
        dataId='btn-create-prototype'
        className={clsx('mt-8 w-full', hideCreateButton && '!hidden')}
      >
        {loading && <TbLoader className="mr-2 animate-spin text-lg" />}
        {buttonText ?? 'Create Prototype'}
      </DaButton>
    </form>
  )
}

export default FormCreatePrototype
