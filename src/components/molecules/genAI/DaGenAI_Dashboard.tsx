// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { TbCode } from 'react-icons/tb'
import LoadingLineAnimation from './DaGenAI_LoadingLineAnimation.tsx'
import DaGenAI_ResponseDisplay from './DaGenAI_ResponseDisplay.tsx'
import DaGenAI_Base from './DaGenAI_Base.tsx'

type DaGenAI_DashboardProps = {
  onCodeChanged?: (code: string) => void
  pythonCode?: string
}

const DaGenAI_Dashboard = ({
  onCodeChanged,
  pythonCode,
}: DaGenAI_DashboardProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [genCode, setGenCode] = useState<string>('')
  const [isFinished, setIsFinished] = useState<boolean>(false)

  return (
    <div className="flex h-full w-full rounded pt-2">
      <DaGenAI_Base
        type="GenAI_Dashboard"
        buttonText="Generate Dashboard"
        placeholderText="Enter your prompt to generate a dashboard"
        onCodeGenerated={(code) => {
          setGenCode(code)
          if (onCodeChanged) {
            onCodeChanged(code)
          }
        }}
        onFinishChange={setIsFinished}
        onLoadingChange={setLoading}
        className="w-1/2"
      />
      <div className="flex h-full w-1/2 flex-col pl-2">
        <div className="mb-2 flex select-none">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-da-gray-light p-2 text-xs font-bold">
            3
          </div>
          <div className="ml-1 flex font-medium text-gray-600">
            Preview Code
          </div>
        </div>
        <div className="scroll-gray flex h-full max-h-[380px] w-full overflow-y-auto overflow-x-hidden">
          {genCode ? (
            <DaGenAI_ResponseDisplay code={genCode} language={'python'} />
          ) : (
            <LoadingLineAnimation
              loading={loading}
              content={"There's no code here"}
            />
          )}
        </div>
        <div className="mt-auto flex w-full select-none flex-col">
          <DaButton
            variant="outline-nocolor"
            className="!h-8 w-full"
            onClick={() => {
              onCodeChanged ? onCodeChanged(genCode) : null
            }}
            disabled={!(genCode && genCode.length > 0) || !isFinished}
          >
            <TbCode className="mr-1.5 h-4 w-4" /> Add new generated code
          </DaButton>
        </div>
      </div>
    </div>
  )
}

export default DaGenAI_Dashboard
