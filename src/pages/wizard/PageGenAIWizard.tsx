import { useEffect, useState } from 'react'
import { DaButton } from '../../components/atoms/DaButton'
import DaStepper from '../../components/atoms/DaStepper'
import DaStep from '../../components/atoms/DaStep'
import { useNavigate } from 'react-router-dom'
import DaGenAI_Wizard from './DaGenAI_Wizard'
import useWizardGenAIStore from '@/pages/wizard/useGenAIWizardStore'
import DaGenAI_WizardSimulate from './DaGenAI_WizardSimulate'
import DaGenAI_WizardStaging from './DaGenAI_WizardStaging'
import { cn } from '@/lib/utils'
import { TbArrowRight, TbArrowLeft, TbSettings } from 'react-icons/tb'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { toast } from 'react-toastify'
import DaGenAI_WizardRuntimeSelectorPopup from './DaGenAI_WizardRuntimeSelectorPopup'
import DaPopup from '../../components/atoms/DaPopup'
import WizardFormCreatePrototype from './WizardFormCreatePrototype'
import { PiGear } from 'react-icons/pi'

const PageGenAIWizard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [soFarSteps, setSoFarSteps] = useState(0)
  const [disabledStep, setDisabledStep] = useState([true, true, true])
  const [openSelectorPopup, setOpenSelectorPopup] = useState(false)
  const [hasGenAIPermission] = usePermissionHook([PERMISSIONS.USE_GEN_AI])
  const [openCreatePrototypeModal, setOpenCreatePrototypeModal] = useState(true)

  const {
    wizardSimulating,
    executeWizardSimulationRun,
    executeWizardSimulationStop,
    savePrototype,
    setWizardGeneratedCode,
    wizardPrototype,
    wizardActiveRtId,
    resetWizardStore,
  } = useWizardGenAIStore()

  const updateDisabledStep = (step: number, disabled: boolean) => {
    setDisabledStep((prev) => {
      const newDisabledStep = [...prev]
      newDisabledStep[step] = disabled
      return newDisabledStep
    })
  }

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
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
      if (soFarSteps <= currentStep) {
        setSoFarSteps(currentStep + 1)
      }
    }
  }

  // Update disabled status for Simulate (step 1) and Deploy (step 2)
  useEffect(() => {
    const hasCode = wizardPrototype.code && wizardPrototype.code.length > 0
    updateDisabledStep(0, !hasCode)
    updateDisabledStep(1, !hasCode)
    if (hasCode) {
      setLoading(false)
    }
  }, [wizardPrototype])

  // Ensure the Simulate step is always enabled
  useEffect(() => {
    updateDisabledStep(1, false)
  }, [])

  // Reset some wizard state when going back to Generate and stop simulation when switching to Simulate
  useEffect(() => {
    if (currentStep === 0 || currentStep === 2) {
      console.log(
        `Stop simulation when switching to ${currentStep === 0 ? 'Generate' : 'Deploy'} `,
      )
      executeWizardSimulationStop()
    }
  }, [currentStep])

  useEffect(() => {
    resetWizardStore(true) // Complete reset on mount
  }, [])

  return (
    <div className="flex flex-col w-full h-full bg-white">
      <div className="px-4 py-3 flex items-center justify-center border-b">
        <div className="flex min-w-0 justify-center">
          <DaStepper currentStep={currentStep} setCurrentStep={setCurrentStep}>
            <DaStep>Generate with AI</DaStep>
            <DaStep disabled={soFarSteps < 1 || disabledStep[0]}>
              Simulate
            </DaStep>
            <DaStep disabled={soFarSteps < 2 || disabledStep[1]}>Deploy</DaStep>
          </DaStepper>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 w-full">
        <div
          className={cn('flex flex-1', currentStep === 0 ? 'block' : 'hidden')}
        >
          <DaGenAI_Wizard
            onCodeGenerated={(code) => {
              setWizardGeneratedCode(code)
            }}
          />
        </div>
        <div
          className={cn('flex flex-1', currentStep === 1 ? 'block' : 'hidden')}
        >
          <DaGenAI_WizardSimulate />
        </div>
        <div
          className={cn(
            'flex flex-1',
            currentStep === 2
              ? 'flex flex-col w-full h-full items-center'
              : 'hidden',
          )}
        >
          <DaGenAI_WizardStaging />
        </div>
      </div>

      <div className="flex px-4 py-4 flex-shrink-0 justify-between border-t">
        <DaButton
          onClick={handleBack}
          disabled={currentStep === 0}
          className="min-w-20 !rounded-full"
          variant="outline"
        >
          <TbArrowLeft className="size-4 mr-1" />
          Back
        </DaButton>
        {currentStep === 1 && (
          <div className="flex items-center justify-center ml-8">
            <DaButton
              onClick={() =>
                wizardSimulating
                  ? executeWizardSimulationStop()
                  : executeWizardSimulationRun()
              }
              className="w-[300px] !rounded-full"
              variant="solid"
              disabled={
                !wizardActiveRtId || wizardPrototype?.code?.length === 0
              }
            >
              {wizardSimulating ? 'Stop Simulation' : 'Start Simulation'}
            </DaButton>
            <DaButton
              variant="plain"
              onClick={() => setOpenSelectorPopup(true)}
              className="ml-2 !p-2 !rounded-full"
            >
              <PiGear className="size-6" />
            </DaButton>
          </div>
        )}
        {currentStep < 2 && (
          <DaButton
            onClick={handleNext}
            className="min-w-20 !rounded-full"
            variant="outline"
            disabled={disabledStep[currentStep] || loading}
          >
            Next
            <TbArrowRight className="size-4 ml-1" />
          </DaButton>
        )}
        {currentStep === 2 && (
          <DaButton
            onClick={async () => {
              setLoading(true)
              try {
                await savePrototype({
                  toast: (msg: string) => toast.success(msg),
                  navigate,
                })
              } catch (error: any) {
                toast.error(error.message || 'Something went wrong')
              } finally {
                setLoading(false)
              }
            }}
            className="w-[90px] !rounded-full"
            variant="solid"
            disabled={
              !wizardPrototype?.code || wizardPrototype.code.length === 0
            }
          >
            {loading ? 'Saving...' : 'Save'}
          </DaButton>
        )}
      </div>

      <DaGenAI_WizardRuntimeSelectorPopup
        open={openSelectorPopup}
        setOpen={setOpenSelectorPopup}
      />

      {/* The popup for creating a prototype is always visible (open by default) */}
      <DaPopup
        state={[openCreatePrototypeModal, setOpenCreatePrototypeModal]}
        trigger={<span></span>}
        className="flex flex-col h-fit"
        disableBackdropClick={true}
      >
        <WizardFormCreatePrototype
          onClose={() => setOpenCreatePrototypeModal(false)}
          code={wizardPrototype.code}
          widget_config={wizardPrototype.widget_config}
          title="New Prototype"
          buttonText="Confirm"
        />
      </DaPopup>
    </div>
  )
}

export default PageGenAIWizard
