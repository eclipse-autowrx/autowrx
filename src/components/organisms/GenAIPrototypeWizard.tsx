import React, { useState } from 'react'
import DaPopup from '../atoms/DaPopup'
import DaText from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import DaStepper from '../atoms/DaStepper'
import DaStep from '../atoms/DaStep'
import { TbX } from 'react-icons/tb'
import FormCreatePrototype from '../molecules/forms/FormCreatePrototype'
import clsx from 'clsx'
import DaGenAI_Python from '../molecules/genAI/DaGenAI_Python'
import GenAIDashboardConfigTemplates from './GenAIDashboardConfigTemplates'
import { isAxiosError } from 'axios'
import default_journey from '@/data/default_journey'
import { ModelCreate } from '@/types/model.type'
import { CVI } from '@/data/CVI'
import { createModelService } from '@/services/model.service'
import { createPrototypeService } from '@/services/prototype.service'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import DaLoader from '../atoms/DaLoader'

type PrototypeGenAIWizardProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const GenAIPrototypeWizard = ({ open, setOpen }: PrototypeGenAIWizardProps) => {
  const { data: currentUser } = useSelfProfileQuery()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(0)
  const [soFarSteps, setSoFarSteps] = useState(0)

  const [disabledStep, setDisabledStep] = useState([true, true, true])
  const updateDisabledStep = (step: number) => (disabled: boolean) => {
    setDisabledStep((prev) => {
      prev[step] = disabled
      return [...prev]
    })
  }

  const handleNext = () => {
    if (currentStep === 2) {
      finish()
    }
    if (soFarSteps <= currentStep) {
      setSoFarSteps(currentStep + 1)
    }
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Start: First step (create prototype step) related stuffs
  const [prototypeData, setPrototypeData] = useState<{
    prototypeName: string
    modelName?: string
    modelId?: string
  }>({
    prototypeName: '',
    modelName: '',
  })
  const handlePrototypeDataChange = (data: typeof prototypeData) => {
    setPrototypeData(data)
  }
  // End: First step (create prototype step) related stuffs

  // Start: Second step (generate code step) related stuffs
  const [code, setCode] = useState<string | undefined>(undefined)
  const handleGenerateCode = (code: string) => {
    setCode(code)
    if (code) {
      updateDisabledStep(1)(false)
    } else {
      updateDisabledStep(1)(true)
    }
  }
  // End: Second step (generate code step) related stuffs

  // Start: Third step (choose dashboard template step) related
  const [dashboardConfig, setDashboardConfig] = useState<string | undefined>(
    undefined,
  )
  const handleTemplateSelected = (config: string) => {
    setDashboardConfig(config)
    if (config) {
      updateDisabledStep(2)(false)
    } else {
      updateDisabledStep(2)(true)
    }
  }
  // End: Third step (choose dashboard template step) related

  // Start: Finish the wizard
  const [loading, setLoading] = useState(false)
  const resetStates = () => {
    // Reset all states
    setPrototypeData({ prototypeName: '', modelName: '' })
    setCode(undefined)
    setDashboardConfig(undefined)
    setCurrentStep(0)
    setSoFarSteps(0)
    setDisabledStep([true, true, true])
    setOpen(false)
  }

  const finish = async () => {
    try {
      setLoading(true)

      let modelId = prototypeData.modelId
      if (!modelId) {
        // Scenario 2: `localModel` does not exist, create a new model
        const modelBody: ModelCreate = {
          cvi: CVI,
          main_api: 'Vehicle',
          name: prototypeData.modelName as string,
        }

        const newModelId = await createModelService(modelBody)
        modelId = newModelId
      }

      const body = {
        model_id: modelId,
        name: prototypeData.prototypeName,
        state: 'development',
        apis: { VSC: [], VSS: [] },
        code,
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
        widget_config: dashboardConfig,
        autorun: true,
      }

      const response = await createPrototypeService(body)

      toast.success(
        `Prototype "${prototypeData.prototypeName}" created successfully`,
      )

      // Log the prototype creation
      addLog({
        name: `New prototype '${prototypeData.prototypeName}' under model '${response.model_id || prototypeData.modelId || prototypeData.modelName}'`,
        description: `Prototype '${prototypeData.prototypeName}' was created by ${currentUser?.email || currentUser?.name || currentUser?.id}`,
        type: 'new-prototype-with-ai',
        create_by: currentUser?.id!,
        ref_id: response.id,
        ref_type: 'prototype',
        parent_id: modelId,
      })

      resetStates()

      // Navigate to the new prototype's page
      navigate(`/model/${modelId}/library/prototype/${response.id}/dashboard`)
    } catch (error) {
      if (isAxiosError(error)) {
        return toast.error(
          error.response?.data?.message || 'Error creating the prototype',
        )
      }
      toast.error('Error creating the prototype')
    } finally {
      setLoading(false)
    }
  }
  // End: Finish the wizard

  return (
    <DaPopup disableBackdropClick state={[open, setOpen]} trigger={<></>}>
      <div className="flex h-[580px] max-h-[calc(100vh-80px)] w-[1120px] max-w-[calc(100vw-80px)] flex-col">
        <div className="-mx-5 -mt-2 flex items-center justify-center border-b px-5 pb-3">
          {/* Title */}
          <DaText
            variant="sub-title"
            className="flex-1 flex-shrink-0 text-da-primary-500"
          >
            Build with AI
          </DaText>

          {/* Stepper */}
          <div className="flex min-w-0 flex-[4] justify-center">
            <DaStepper
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
            >
              <DaStep>New Prototype</DaStep>
              <DaStep disabled={soFarSteps < 1 || disabledStep[0]}>
                Generate Code
              </DaStep>
              <DaStep
                disabled={soFarSteps < 2 || disabledStep[0] || disabledStep[1]}
              >
                Choose Dashboard
              </DaStep>
            </DaStepper>
          </div>

          {/* Close button */}
          <div className="flex flex-1 flex-shrink-0 justify-end gap-2">
            <DaButton onClick={() => setOpen(false)} size="sm" variant="plain">
              <TbX className="da-label-huge" />
            </DaButton>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 py-2">
          {/* Step 1: Create prototype */}
          <div
            className={clsx(
              '-mx-4 -my-2',
              currentStep !== 0 && 'pointer-events-none hidden',
            )}
          >
            <FormCreatePrototype
              onPrototypeChange={handlePrototypeDataChange}
              disabledState={[disabledStep[0], updateDisabledStep(0)]}
              hideCreateButton
            />
          </div>

          {/* Step 2: Generate code */}
          <div
            className={clsx(
              currentStep !== 1
                ? 'pointer-events-none hidden'
                : 'flex max-h-[480px] w-full',
            )}
          >
            <DaGenAI_Python
              onCodeGenerated={handleGenerateCode}
              hideAddGeneratedCodeButton
              codeDisplayClassName="max-h-full"
            />
          </div>

          {/* Step 3: Choose dashboard template */}
          <div
            className={clsx(
              currentStep !== 2
                ? 'pointer-events-none hidden'
                : 'h-full w-full py-2',
            )}
          >
            <GenAIDashboardConfigTemplates
              onTemplateSelected={handleTemplateSelected}
            />
          </div>
        </div>

        <div className="-mx-5 -mb-1 flex flex-shrink-0 justify-between border-t px-5 pt-4">
          <DaButton
            onClick={handleBack}
            disabled={currentStep === 0}
            className="w-20"
            variant="outline-nocolor"
          >
            Back
          </DaButton>
          <DaButton
            onClick={handleNext}
            className="min-w-20"
            disabled={disabledStep.at(currentStep) || loading}
          >
            {loading && <DaLoader className="mr-2 text-white" />}
            {currentStep === 2 ? 'Finish' : 'Next'}
          </DaButton>
        </div>
      </div>
    </DaPopup>
  )
}

export default GenAIPrototypeWizard
