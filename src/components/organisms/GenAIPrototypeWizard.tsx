import React, { useEffect, useState } from 'react'
import DaText from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import DaStepper from '../atoms/DaStepper'
import DaStep from '../atoms/DaStep'
import { useNavigate } from 'react-router-dom'
import DaGenAI_Wizard from '../molecules/genAI/DaGenAI_Wizard'
import useWizardGenAIStore from '@/stores/genAIWizardStore'
import DaGenAI_Simulate from '../molecules/genAI/DaGenAI_Simulate'
import DaGenAI_WizardStaging from '../molecules/genAI/DaGenAI_WizardStaging'
import { cn } from '@/lib/utils'
import {
  TbArrowRight,
  TbArrowLeft,
  TbSettings,
  TbDeviceFloppy,
} from 'react-icons/tb'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { toast } from 'react-toastify'
import DaGenAI_IntroductionStep from '../molecules/genAI/DaGenAI_Introduction'
import DaGenAI_RuntimeSelectorPopup from '../molecules/genAI/DaGenAI_RuntimeSelectorPopup'
import DaHomologation from '../molecules/homologation'
import DaPopup from '../atoms/DaPopup'
import FormCreatePrototype from '../molecules/forms/FormCreatePrototype'
import { MdOutlineDesignServices } from 'react-icons/md'

const GenAIPrototypeWizard = () => {
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [soFarSteps, setSoFarSteps] = useState(0)
  const [disabledStep, setDisabledStep] = useState([true, true, true, true])
  const [openSelectorPopup, setOpenSelectorPopup] = useState(false)
  const [hasGenAIPermission] = usePermissionHook([PERMISSIONS.USE_GEN_AI])
  const [isGeneratedFlag, setIsGeneratedFlag] = useState(false)
  const [openCreatePrototypeModal, setOpenCreatePrototypeModal] =
    useState(false)

  const {
    executeWizardGenerateCodeAction,
    wizardSimulating,
    executeWizardSimulationRun,
    executeWizardSimulationStop,
    wizardPrompt,
    setWizardGeneratedCode,
    wizardPrototype,
    resetWizardStore,
    allWizardRuntimes,
    wizardActiveRtId,
    codeGenerating,
    setWizardActiveRtId,
    isEditDashboard,
    setIsEditDashboard,
  } = useWizardGenAIStore()

  const updateDisabledStep = (step: number, disabled: boolean) => {
    setDisabledStep((prev) => {
      const newDisabledStep = [...prev]
      newDisabledStep[step] = disabled
      return newDisabledStep
    })
  }

  useEffect(() => {
    const hasCode = wizardPrototype.code && wizardPrototype.code.length > 0
    updateDisabledStep(1, !hasCode)
    updateDisabledStep(2, !hasCode)
    updateDisabledStep(3, !hasCode)
    if (hasCode) {
      setLoading(false)
    }
  }, [wizardPrototype])

  useEffect(() => {
    updateDisabledStep(0, false)
  }, [])

  useEffect(() => {
    if (currentStep === 0) {
      setIsGeneratedFlag(false)
      resetWizardStore()
    }
    if (currentStep === 1) {
      executeWizardSimulationStop()
    }
  }, [currentStep])

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNext = () => {
    if (!hasGenAIPermission) {
      return toast.error(
        'You do not have permission to use Gen AI. Please contact administrator.',
      )
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      if (soFarSteps <= currentStep) {
        setSoFarSteps(currentStep + 1)
      }
    }
  }

  useEffect(() => {
    const matchingRuntime = allWizardRuntimes.find((runtime) =>
      runtime.kit_id.startsWith('RunTime-ETAS-E2E'),
    )
    if (matchingRuntime) {
      setWizardActiveRtId(matchingRuntime.kit_id)
    }
  }, [allWizardRuntimes, setWizardActiveRtId])

  return (
    <div className="flex flex-col w-full h-full">
      <div className="px-4 py-3 flex items-center justify-center border-b">
        <DaText variant="sub-title" className="flex flex-1 text-da-primary-500">
          Vehicle App Generator
        </DaText>
        <div className="flex min-w-0 flex-[4] justify-center">
          <DaStepper currentStep={currentStep} setCurrentStep={setCurrentStep}>
            <DaStep>Introduction</DaStep>
            <DaStep disabled={soFarSteps < 1 || disabledStep[0]}>
              Generate
            </DaStep>
            <DaStep disabled={soFarSteps < 2 || disabledStep[1]}>
              Simulate
            </DaStep>
            <DaStep disabled={soFarSteps < 3 || disabledStep[2]}>Deploy</DaStep>
            <DaStep disabled={soFarSteps < 4 || disabledStep[3]}>Verify</DaStep>
          </DaStepper>
        </div>
        <div className="flex flex-1"></div>
      </div>

      <div className="flex min-h-0 flex-1 py-2 w-full">
        <div
          className={cn('flex flex-1', currentStep === 0 ? 'block' : 'hidden')}
        >
          <DaGenAI_IntroductionStep />
        </div>
        <div
          className={cn('flex flex-1', currentStep === 1 ? 'block' : 'hidden')}
        >
          <DaGenAI_Wizard
            onCodeGenerated={(code) => {
              setWizardGeneratedCode(code)
              setIsGeneratedFlag(true)
            }}
          />
        </div>
        <div
          className={cn('flex flex-1', currentStep === 2 ? 'block' : 'hidden')}
        >
          <DaGenAI_Simulate />
        </div>
        <div
          className={cn(
            'flex flex-1',
            currentStep === 3
              ? 'flex flex-col w-full h-full items-center'
              : 'hidden',
          )}
        >
          <DaGenAI_WizardStaging />
        </div>
        <div
          className={cn('flex flex-1', currentStep === 4 ? 'block' : 'hidden')}
        >
          <DaHomologation isWizard={true} />
        </div>
      </div>

      <div className="flex px-4 py-4 flex-shrink-0 justify-between border-t">
        <DaButton
          onClick={handleBack}
          disabled={currentStep === 0}
          className="min-w-20"
          variant="outline"
        >
          <TbArrowLeft className="size-4 mr-1" />
          Back
        </DaButton>
        {currentStep === 1 && (
          <DaButton
            onClick={executeWizardGenerateCodeAction}
            className="w-[300px] min-w-fit"
            variant="solid"
            disabled={wizardPrompt.length === 0 || loading || codeGenerating}
          >
            {(wizardPrototype.code && wizardPrototype.code.length > 0) ||
            isGeneratedFlag
              ? 'Regenerate'
              : 'Generate My Vehicle Application'}
          </DaButton>
        )}
        {currentStep === 2 && (
          <div className="flex items-center justify-center ml-16">
            <DaButton
              onClick={() =>
                wizardSimulating
                  ? executeWizardSimulationStop()
                  : executeWizardSimulationRun()
              }
              className="w-[300px]"
              variant="solid"
              disabled={!wizardActiveRtId}
            >
              {wizardSimulating ? 'Stop Simulation' : 'Start Simulation'}
            </DaButton>
            <DaButton
              variant="plain"
              onClick={() => setOpenSelectorPopup(true)}
              className="ml-2 !p-2"
            >
              <TbSettings className="size-6" />
            </DaButton>
            <DaButton
              variant="plain"
              onClick={() => setIsEditDashboard(!isEditDashboard)}
              className="ml-2 !p-2"
            >
              {!isEditDashboard ? (
                <MdOutlineDesignServices className="size-6" />
              ) : (
                <TbDeviceFloppy className="size-6" />
              )}
            </DaButton>
          </div>
        )}
        {currentStep < 4 && (
          <DaButton
            onClick={handleNext}
            className="min-w-20"
            variant="outline"
            disabled={disabledStep[currentStep] || loading}
          >
            Next
            <TbArrowRight className="size-4 ml-1" />
          </DaButton>
        )}
        {currentStep === 4 && (
          <DaButton
            onClick={() => setOpenCreatePrototypeModal(true)}
            className="w-[90px]"
            variant="solid"
          >
            Save
          </DaButton>
        )}
      </div>

      <DaGenAI_RuntimeSelectorPopup
        open={openSelectorPopup}
        setOpen={setOpenSelectorPopup}
      />

      {openCreatePrototypeModal && (
        <DaPopup
          state={[openCreatePrototypeModal, setOpenCreatePrototypeModal]}
          onClose={() => setOpenCreatePrototypeModal(false)}
          trigger={<span></span>}
          className="flex flex-col h-fit"
        >
          <FormCreatePrototype
            onClose={() => setOpenCreatePrototypeModal(false)}
            code={wizardPrototype.code}
            widget_config={wizardPrototype.widget_config}
            title="Save as prototype"
            buttonText="Save"
          />
        </DaPopup>
      )}
    </div>
  )
}

export default GenAIPrototypeWizard
