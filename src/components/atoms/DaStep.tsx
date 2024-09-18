import clsx from 'clsx'
import { useMemo } from 'react'
import { TbCheck } from 'react-icons/tb'

type DaStepProps = {
  disabled?: boolean
  currentStep?: number
  setCurrentStep?: React.Dispatch<React.SetStateAction<number>>
  totalSteps?: number
  index?: number
  children?: React.ReactNode
  className?: string
}

const DaStep = ({
  disabled,
  currentStep,
  setCurrentStep,
  totalSteps,
  index,
  children,
  className,
}: DaStepProps) => {
  const state = useMemo(() => {
    if (
      currentStep === undefined ||
      totalSteps === undefined ||
      index === undefined ||
      currentStep < index
    ) {
      return 'inactive'
    }

    if (currentStep === index) {
      return 'active'
    }

    if (currentStep > index) {
      return 'completed'
    }
  }, [currentStep, totalSteps, index])

  const handleClick = () => {
    if (disabled) return null
    index !== undefined && setCurrentStep && setCurrentStep(index)
  }

  return (
    <div
      onClick={handleClick}
      className={clsx(
        'da-label-regular-bold flex items-center gap-2 truncate px-2',
        disabled ? 'cursor-default opacity-30' : 'cursor-pointer',
        className,
      )}
    >
      {index !== undefined && (
        <div
          className={clsx(
            'da-label-small flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
            {
              'border border-da-gray-medium bg-transparent':
                state === 'inactive',
              'bg-da-primary-500 text-white':
                state === 'active' || state === 'completed',
            },
          )}
        >
          {state === 'completed' ? (
            <TbCheck className="text-white" />
          ) : (
            index + 1
          )}
        </div>
      )}

      <div
        className={clsx('min-w-0 truncate', {
          'text-da-gray-dark': state === 'active' || state === 'completed',
          'text-da-gray-medium': state === 'inactive',
        })}
      >
        {children}
      </div>
    </div>
  )
}

export default DaStep
