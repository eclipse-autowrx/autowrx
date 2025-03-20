import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaText } from '@/components/atoms/DaText'
import { FormEvent, useEffect, useState } from 'react'
import { TbLoader } from 'react-icons/tb'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import clsx from 'clsx'
import DaFileUpload from '@/components/atoms/DaFileUpload'
import useWizardGenAIStore from './useGenAIWizardStore'
import useCurrentModel from '@/hooks/useCurrentModel'
import useListModelContribution from '@/hooks/useListModelContribution'
import useListVSSVersions from '@/hooks/useListVSSVersions'
import { createModelService } from '@/services/model.service'
import { updateGenAIProfile } from './wizard.service'

interface WizardFormCreatePrototypeProps {
  onClose?: () => void
  hideCreateButton?: boolean
  code?: string
  widget_config?: string
  title?: string
  buttonText?: string
}

const WizardFormCreatePrototype = ({
  onClose,
  hideCreateButton,
  code,
  widget_config,
  title,
  buttonText,
}: WizardFormCreatePrototypeProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const { wizardPrototype, setPrototypeData } = useWizardGenAIStore()
  const { data: currentModel } = useCurrentModel()
  const { data: contributionModels, isLoading: isFetchingModelContribution } =
    useListModelContribution()
  const { data: versions } = useListVSSVersions()
  // controlled value for the dropdown selection
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  // flag to show/hide new model UI
  const [isCreatingNewModel, setIsCreatingNewModel] = useState(false)

  // On mount, update prototype data with passed props (code/widget_config)
  useEffect(() => {
    if (code) {
      setPrototypeData({ code })
    }
    if (widget_config) {
      setPrototypeData({ widget_config })
    }
  }, [code, widget_config])

  // Once contributionModels are loaded, if not in new model mode, select the first available model.
  // If there are no models, force the "create new model" mode.
  useEffect(() => {
    if (!isFetchingModelContribution) {
      if (!contributionModels || contributionModels.results.length === 0) {
        setSelectedModelId('new')
        setIsCreatingNewModel(true)
        setPrototypeData({ model_id: '', modelName: '' })
      } else if (!isCreatingNewModel) {
        const firstModel = contributionModels.results[0]
        setSelectedModelId(firstModel.id)
        setPrototypeData({
          model_id: firstModel.id,
          modelName: firstModel.name,
        })
      }
    }
  }, [contributionModels, isFetchingModelContribution, isCreatingNewModel])

  // Disable confirm if required fields are missing.
  const disabled =
    loading ||
    (!wizardPrototype.model_id && !wizardPrototype.modelName) ||
    !wizardPrototype.name

  const signalFileValidator = async (file: File) => {
    if (file.type !== 'application/json') {
      return 'File must be a JSON file'
    }
    try {
      const fileText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject('Error reading file')
        reader.readAsText(file)
      })
      JSON.parse(fileText)
      return null
    } catch (error) {
      return typeof error === 'string' ? error : 'Invalid JSON file'
    }
  }

  const handleVSSChange = (version: string) => {
    setPrototypeData({ api_version: version })
  }

  // When confirming, if in "create new model" mode, create the model first.
  // Then close the popup (the parent will later use the model id for saving the prototype).
  const handleConfirm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isCreatingNewModel) {
        if (!wizardPrototype.modelName) {
          throw new Error('Please enter a model name')
        }
        const modelBody = {
          main_api: wizardPrototype.mainApi || 'Vehicle',
          name: wizardPrototype.modelName,
          api_version: wizardPrototype.api_version || 'v4.1',
        }
        if (wizardPrototype.api_data_url) {
          ;(modelBody as any).api_data_url = wizardPrototype.api_data_url
        }
        const newModelId = await createModelService(modelBody)
        setPrototypeData({
          model_id: newModelId,
          modelName: wizardPrototype.modelName,
        })
        await updateGenAIProfile(newModelId)
      }
      if (onClose) {
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleConfirm}
      className="flex max-h-[80vh] w-[40vw] min-w-[400px] flex-col bg-da-white p-4 lg:w-[25vw]"
    >
      <DaText variant="title" className="text-da-primary-500">
        {title ?? 'New Prototype'}
      </DaText>

      {!currentModel && (
        <>
          <DaSelect
            value={selectedModelId || 'new'}
            label="Model"
            wrapperClassName="mt-4"
            onValueChange={(value) => {
              if (value === 'new') {
                setSelectedModelId('new')
                setIsCreatingNewModel(true)
                setPrototypeData({ model_id: '', modelName: '' })
              } else {
                setSelectedModelId(value)
                setIsCreatingNewModel(false)
                const selected =
                  contributionModels &&
                  contributionModels.results.find(
                    (model: any) => model.id === value,
                  )
                if (selected) {
                  setPrototypeData({
                    model_id: selected.id,
                    modelName: selected.name,
                  })
                }
              }
            }}
          >
            <DaSelectItem key="new" value="new">
              Create New Model
            </DaSelectItem>
            {contributionModels &&
              contributionModels.results.map((model: any) => (
                <DaSelectItem key={model.id} value={model.id}>
                  {model.name}
                </DaSelectItem>
              ))}
          </DaSelect>

          {isCreatingNewModel && (
            <div className="flex flex-col">
              <DaInput
                name="modelName"
                value={wizardPrototype.modelName || ''}
                onChange={(e) =>
                  setPrototypeData({ modelName: e.target.value })
                }
                placeholder="Model Name"
                label="Model Name"
                className="mt-4"
                inputClassName="bg-white"
              />
              <DaText variant="regular-medium" className="pt-4">
                Signal
              </DaText>
              <div className=" mt-1 rounded-lg">
                {!wizardPrototype.api_data_url && (
                  <>
                    <DaText variant="small">Select VSS version</DaText>
                    <DaSelect
                      wrapperClassName="mt-1"
                      onValueChange={handleVSSChange}
                      defaultValue={wizardPrototype.api_version || 'v4.1'}
                    >
                      {versions ? (
                        versions.map((version: any) => (
                          <DaSelectItem key={version.name} value={version.name}>
                            COVESA VSS {version.name}
                          </DaSelectItem>
                        ))
                      ) : (
                        <>
                          <DaSelectItem value="v5.0">
                            COVESA VSS v5.0
                          </DaSelectItem>
                          <DaSelectItem value="v4.1">
                            COVESA VSS v4.1
                          </DaSelectItem>
                          <DaSelectItem value="v4.0">
                            COVESA VSS v4.0
                          </DaSelectItem>
                          <DaSelectItem value="v3.1">
                            COVESA VSS v3.1
                          </DaSelectItem>
                        </>
                      )}
                    </DaSelect>
                  </>
                )}
                <DaText variant="small" className="mt-2">
                  or upload a file
                </DaText>
                <DaFileUpload
                  onStartUpload={() => {}}
                  onFileUpload={(url) =>
                    setPrototypeData({ api_data_url: url })
                  }
                  className="mt-1"
                  accept=".json"
                  validate={signalFileValidator}
                />
              </div>
            </div>
          )}
        </>
      )}

      <DaInput
        name="name"
        value={wizardPrototype.name}
        onChange={(e) => setPrototypeData({ name: e.target.value })}
        placeholder="Prototype Name"
        label="Prototype Name"
        className="mt-4"
      />

      <DaSelect
        value="python"
        label="Programming Language"
        wrapperClassName="mt-4"
        onValueChange={() => {
          /* language is fixed to python */
        }}
      >
        <DaSelectItem value="python">Python</DaSelectItem>
      </DaSelect>

      {error && (
        <DaText variant="small" className="mt-4 text-da-accent-500">
          {error}
        </DaText>
      )}

      <DaButton
        disabled={disabled || loading}
        type="submit"
        variant="gradient"
        className={clsx('mt-8 w-full', hideCreateButton && '!hidden')}
      >
        {loading && <TbLoader className="mr-2 animate-spin text-lg" />}
        {buttonText ?? 'Confirm'}
      </DaButton>
    </form>
  )
}

export default WizardFormCreatePrototype
