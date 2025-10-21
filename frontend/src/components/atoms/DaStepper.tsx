// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { Fragment, useState } from 'react'
import DaStep from './DaStep'
import clsx from 'clsx'
import { TbChevronRight } from 'react-icons/tb'

type DaStepperProps = {
  children?: React.ReactNode
  className?: string
  currentStep?: number
  setCurrentStep?: React.Dispatch<React.SetStateAction<number>>
}

const DaStepper = ({
  children,
  className,
  currentStep: outerCurrentStep,
  setCurrentStep: outerSetCurrentStep,
}: DaStepperProps) => {
  const totalSteps = React.Children.count(children)
  const elementsArray = React.Children.toArray(children)
  const [innerCurrentStep, innerSetCurrentStep] = useState(0)
  const currentStep = outerCurrentStep ?? innerCurrentStep
  const setCurrentStep = outerSetCurrentStep ?? innerSetCurrentStep

  return (
    <div className={clsx('flex items-center overflow-hidden', className)}>
      {elementsArray.map((step, index) => (
        <Fragment key={index}>
          {React.isValidElement(step) ? (
            React.cloneElement(step, {
              ...step.props,
              index,
              currentStep,
              setCurrentStep,
              totalSteps,
            })
          ) : (
            <DaStep
              {...(typeof step === 'object' ? step : {})}
              index={index}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              totalSteps={totalSteps}
            />
          )}

          {index < totalSteps - 1 && (
            <TbChevronRight className="da-label-sub-title" />
          )}
        </Fragment>
      ))}
    </div>
  )
}

export default DaStepper
