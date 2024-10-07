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
import { DaImage } from '../atoms/DaImage'
import { cn } from '@/lib/utils'
import config from '@/configs/config'
import {
  TbArrowRight,
  TbArrowLeft,
  TbSettings,
  TbCircleFilled,
  TbCheck,
} from 'react-icons/tb'
import DaPopup from '../atoms/DaPopup'
import DaHomologation from '../molecules/homologation'

const GenAIPrototypeWizard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [currentStep, setCurrentStep] = useState(0)
  const [soFarSteps, setSoFarSteps] = useState(0)
  const [disabledStep, setDisabledStep] = useState([true, true, true, true])
  const [openSelectorPopup, setOpenSelectorPopup] = useState(false)

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
    wizardPrototype,
    setPrototypeData,
    resetWizardStore,
    allWizardRuntimes,
    wizardActiveRtId,
    codeGenerating,
    setWizardActiveRtId,
  } = useWizardGenAIStore()

  // Updating code generation and steps logic
  useEffect(() => {
    // console.log('wizardGeneratedCode:', wizardGeneratedCode)
    if (wizardPrototype.code && wizardPrototype.code.length > 0) {
      // console.log('wizardPrototype.code: ', wizardPrototype.code)
      updateDisabledStep(3)(false)
      updateDisabledStep(2)(false)
      updateDisabledStep(1)(false)
      setLoading(false)
    } else {
      updateDisabledStep(2)(true)
      updateDisabledStep(1)(true)
      updateDisabledStep(3)(true)
    }
  }, [wizardPrototype])

  useEffect(() => {
    // resetWizardStore() // Reset prototype state on mount
    updateDisabledStep(0)(false)
  }, [])

  useEffect(() => {
    if (currentStep === 0) {
      // Clear the wizard store on step 0 (introduction)
      setIsGeneratedFlag(false)
      resetWizardStore()
    }
    if (currentStep === 1) {
      // Stop simulate if user back to generate code step
      executeWizardSimulationStop()
    }
  }, [currentStep])

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNext = async () => {
    if (currentStep === 4) {
      // finish()
    }

    if (soFarSteps <= currentStep) {
      setSoFarSteps(currentStep + 1)
    }
    if (currentStep < 4) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  useEffect(() => {
    const lastRuntimeId = localStorage.getItem('last-wizard-rt')
    if (lastRuntimeId) {
      setWizardActiveRtId(lastRuntimeId)
    }
  }, [setWizardActiveRtId])

  return (
    <div className="flex flex-col w-full h-full">
      <div className="px-4 py-3 flex items-center justify-center border-b">
        <DaText
          variant="sub-title"
          className="flex flex-1 text-da-primary-500 "
        >
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

      <div className="flex min-h-0 flex-1 py-2 w-full ">
        <div
          className={cn(
            'flex h-full w-full px-4 pt-12',
            currentStep !== 0 && 'hidden',
          )}
        >
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="w-full bg-white">
              <div className="text-3xl font-semibold text-da-primary-500 mb-10">
                Let’s generate vehicle apps with AI
              </div>
              <ul className="list-disc pl-6 space-y-2">
                <li className="pl-6">
                  <span className="font-semibold text-da-primary-500">
                    Generate
                  </span>{' '}
                  the envisioned functionality based on its description using
                  Generative AI.
                </li>
                <li className="pl-6">
                  <span className="font-semibold text-da-primary-500">
                    Simulate
                  </span>{' '}
                  the generated vehicle app in a virtual vehicle or other such
                  useful widgets.
                </li>
                <li className="pl-6">
                  <span className="font-semibold text-da-primary-500">
                    Deploy
                  </span>{' '}
                  the functionality of the generated vehicle app via various
                  testing platforms.
                </li>
                <li className="pl-6">
                  <span className="font-semibold text-da-primary-500">
                    Verify
                  </span>{' '}
                  compliance and regulatory requirements to ensure vehicle
                  homologation.
                </li>
              </ul>
            </div>
          </div>

          <div className="flex w-1/2 h-full overflow-y-auto">
            {config.genAI.wizardCover?.endsWith('.mp4') ? (
              <div className="relative w-full h-fit overflow-hidden">
                <video
                  src={config.genAI.wizardCover}
                  className="flex h-fit w-full object-contain rounded-xl"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <div className="absolute inset-0 border-4 border-white rounded-lg pointer-events-none scale-100"></div>
              </div>
            ) : (
              <DaImage
                src={
                  config.genAI.wizardCover ??
                  '/imgs/default_prototype_cover.jpg'
                }
                alt="Prototype Wizard"
                className="h-fit w-full object-contain !overflow-hidden !rounded-lg"
              />
            )}
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
            currentStep !== 4
              ? 'hidden'
              : 'flex h-full w-full justify-center overflow-y-auto',
          )}
        >
          <DaHomologation isWizard={true} />
        </div>

        <div
          className={cn(
            currentStep !== 3
              ? 'hidden'
              : 'flex h-full w-full justify-center overflow-y-auto',
          )}
        >
          <DaGenAI_WizardStaging />
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
            onClick={() => {
              executeWizardGenerateCodeAction()
            }}
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
          <div className="flex items-center justify-center ml-8">
            <DaButton
              onClick={() => {
                wizardSimulating
                  ? executeWizardSimulationStop()
                  : executeWizardSimulationRun()
              }}
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
          </div>
        )}
        {currentStep < 4 && (
          <DaButton
            onClick={handleNext}
            className="min-w-20"
            variant="outline"
            disabled={disabledStep[currentStep] || loading}
          >
            {currentStep < 4 && 'Next'}
            <TbArrowRight className="size-4 ml-1" />
          </DaButton>
        )}
      </div>

      <DaPopup
        state={[openSelectorPopup, setOpenSelectorPopup]}
        onClose={() => setOpenSelectorPopup(false)}
        trigger={<span></span>}
        className="flex flex-col w-[40vw] lg:w-[30vw] min-w-[600px] max-w-[500px] h-full !max-h-[300px] p-4 bg-da-white "
      >
        <DaText variant="sub-title">Select Runtime Environment</DaText>
        <div className="flex flex-col h-full space-y-1 mt-2 overflow-y-auto">
          {allWizardRuntimes &&
            Array.isArray(allWizardRuntimes) &&
            allWizardRuntimes.map((runtime) => (
              <div
                key={runtime.kit_id}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded hover:bg-da-gray-light',
                  wizardActiveRtId === runtime.kit_id && 'bg-gray-100',
                )}
                onClick={() => {
                  executeWizardSimulationStop()
                  setWizardActiveRtId(runtime.kit_id)
                  setOpenSelectorPopup(false)
                }}
              >
                <div className="text-[20px] flex items-center disabled:text-white text-sm px-2 py-1">
                  {runtime.is_online ? (
                    <TbCircleFilled className="size-3 text-green-500 mr-2" />
                  ) : (
                    <TbCircleFilled className="size-3 text-yellow-500 mr-2" />
                  )}{' '}
                  {runtime.name}
                </div>
                {wizardActiveRtId === runtime.kit_id && (
                  <TbCheck className="size-5 text-da-primary-500 mr-2" />
                )}
              </div>
            ))}
        </div>
      </DaPopup>
    </div>
  )
}

export default GenAIPrototypeWizard
