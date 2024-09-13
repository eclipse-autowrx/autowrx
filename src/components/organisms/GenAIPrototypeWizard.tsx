import React, { useEffect, useState } from 'react'
import DaText from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import DaStepper from '../atoms/DaStepper'
import DaStep from '../atoms/DaStep'
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
import DaGenAI_Wizard from '../molecules/genAI/DaGenAI_Wizard'
import useWizardGenAIStore from '@/stores/genAIWizardStore'
import DaGenAI_Simulate from '../molecules/genAI/DaGenAI_Simulate'
import DaStaging from '../molecules/staging/DaStaging'
import { DaImage } from '../atoms/DaImage'
import { cn } from '@/lib/utils'

const GenAIPrototypeWizard = () => {
  const { data: currentUser } = useSelfProfileQuery()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [currentStep, setCurrentStep] = useState(0)
  const [soFarSteps, setSoFarSteps] = useState(0)
  const [disabledStep, setDisabledStep] = useState([true, true, true])

  const updateDisabledStep = (step: number) => (disabled: boolean) => {
    setDisabledStep((prev) => {
      prev[step] = disabled
      return [...prev]
    })
  }

  const [isGeneratedFlag, setIsGeneratedFlag] = useState(false)
  const {
    executeWizardGenerateCodeAction,
    wizardSimulating,
    executeWizardSimulationRun,
    executeWizardSimulationStop,
    wizardPrompt,
    setWizardGeneratedCode,
    prototypeData,
    setPrototypeData,
    resetWizardStore: resetWizard,
  } = useWizardGenAIStore()

  // Updating code generation and steps logic
  useEffect(() => {
    // console.log('wizardGeneratedCode:', wizardGeneratedCode)
    if (prototypeData.code && prototypeData.code.length > 0) {
      updateDisabledStep(2)(false)
      updateDisabledStep(1)(false)
      setLoading(false)
    } else {
      updateDisabledStep(2)(true)
      updateDisabledStep(1)(true)
    }
  }, [prototypeData.code])

  useEffect(() => {
    resetWizard() // Reset prototype state on mount
    updateDisabledStep(0)(false)
  }, [])

  useEffect(() => {
    if (currentStep === 0) {
      console.log('resetWizard')
      resetWizard()
    }
  }, [currentStep])

  const finish = async () => {
    try {
      setLoading(true)

      let modelId = prototypeData.modelId
      if (!modelId) {
        const modelBody: ModelCreate = {
          cvi: CVI,
          main_api: 'Vehicle',
          name: prototypeData.modelName as string,
        }

        const newModelId = await createModelService(modelBody)
        modelId = newModelId
        setPrototypeData({ modelId: newModelId })
      }

      const body = {
        model_id: modelId,
        name: prototypeData.prototypeName,
        state: 'development',
        apis: { VSC: [], VSS: [] },
        wizardGeneratedCode: prototypeData.code,
        complexity_level: 3,
        customer_journey: default_journey,
        description: { problem: '', says_who: '', solution: '', status: '' },
        image_file: '/imgs/default_prototype_cover.jpg',
        skeleton: '{}',
        tags: [],
        widget_config: prototypeData.widget_config,
        autorun: true,
      }

      const response = await createPrototypeService(body)

      resetWizard()
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

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNext = async () => {
    if (currentStep === 3) {
      finish()
    }

    if (soFarSteps <= currentStep) {
      setSoFarSteps(currentStep + 1)
    }
    if (currentStep < 3) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  return (
    <div className="flex flex-col h-full w-full ">
      <div className="-mx-5 -mt-2 flex items-center justify-center border-b px-5 pb-3">
        <DaText
          variant="sub-title"
          className="flex flex-1 text-da-primary-500 "
        >
          Build Prototype with AI
        </DaText>
        <div className="flex min-w-0 flex-[4] justify-center">
          <DaStepper currentStep={currentStep} setCurrentStep={setCurrentStep}>
            <DaStep>Introduction</DaStep>
            <DaStep disabled={soFarSteps < 1 || disabledStep[0]}>
              Generate Vehicle Application
            </DaStep>
            <DaStep disabled={soFarSteps < 2 || disabledStep[1]}>
              Simulate
            </DaStep>
            <DaStep disabled={soFarSteps < 3 || disabledStep[2]}>Deploy</DaStep>
          </DaStepper>
        </div>
        <div className="flex flex-1"></div>
      </div>

      <div className="flex min-h-0 flex-1 py-2">
        <div
          className={cn('flex h-full w-full', currentStep !== 0 && 'hidden')}
        >
          <div className="flex flex-1 flex-col">
            <DaText variant="regular" className="mb-4 max-w-xl text-justify">
              Create your prototype entirely with Generative AI. Describe the
              vehicle app idea then let AI handle the vehicle app logic and
              interactive widget creation, allowing you to build, visualize, and
              refine your concepts effortlessly.
            </DaText>
          </div>
          <div className="flex w-1/2 h-full">
            <DaImage
              src="/imgs/default_prototype_cover.jpg"
              alt="Prototype Wizard"
              className="h-fit w-full object-contain !overflow-hidden !rounded-lg"
            />
          </div>
        </div>

        <div
          className={cn(currentStep !== 1 ? 'hidden' : 'flex h-full w-full')}
        >
          <DaGenAI_Wizard
            onCodeGenerated={(code) => {
              setWizardGeneratedCode(code)
              setIsGeneratedFlag(true)
            }}
          />
        </div>

        <div className={cn(currentStep !== 2 ? 'hidden' : 'h-full w-full')}>
          <DaGenAI_Simulate />
        </div>

        <div
          className={cn(
            currentStep !== 3
              ? 'hidden'
              : 'flex h-full w-full justify-center overflow-y-auto',
          )}
        >
          <DaStaging isWizard={true} />
        </div>
      </div>

      <div className="-mx-5 -mb-1 flex flex-shrink-0 justify-between border-t px-5 pt-4">
        <DaButton
          onClick={handleBack}
          disabled={currentStep === 0}
          className="w-20"
          variant="outline"
        >
          Back
        </DaButton>
        {currentStep === 1 && (
          <DaButton
            onClick={() => {
              executeWizardGenerateCodeAction()
            }}
            className="w-[300px] min-w-fit"
            variant="solid"
            disabled={wizardPrompt.length === 0 || loading}
          >
            {(prototypeData.code && prototypeData.code.length > 0) ||
            isGeneratedFlag
              ? 'Regenerate'
              : 'Generate My Vehicle Application'}
          </DaButton>
        )}
        {currentStep === 2 && (
          <DaButton
            onClick={() => {
              wizardSimulating
                ? executeWizardSimulationStop()
                : executeWizardSimulationRun()
            }}
            className="w-[300px]"
            variant="solid"
          >
            {wizardSimulating ? 'Stop Simulate' : 'Run Simulate'}
          </DaButton>
        )}
        {currentStep < 3 && (
          <DaButton
            onClick={handleNext}
            className="min-w-20"
            variant="outline"
            disabled={disabledStep[currentStep] || loading}
          >
            {currentStep < 3 && 'Next'}
          </DaButton>
        )}
      </div>
    </div>
  )
}

export default GenAIPrototypeWizard
