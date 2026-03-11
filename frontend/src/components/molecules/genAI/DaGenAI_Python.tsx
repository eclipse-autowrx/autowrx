// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, lazy, Suspense } from 'react'
import { Button } from '@/components/atoms/button'
import { TbCode } from 'react-icons/tb'
import LoadingLineAnimation from './DaGenAI_LoadingLineAnimation'
import DaGenAI_Base from './DaGenAI_Base'
import DaSectionTitle from '@/components/atoms/DaSectionTitle'
import CodeEditor from '@/components/molecules/CodeEditor'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/atoms/spinner'
import { retry } from '@/lib/retry'

// Helper function to determine editor type
const getEditorType = (content: string): 'project' | 'code' => {
  if (!content || content.trim() === '') return 'code'

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      return 'project'
    }
  } catch {
    // Not valid JSON, treat as code
  }

  return 'code'
}

// Lazy load ProjectEditor
const ProjectEditor = lazy(() =>
  retry(() => import('../project_editor/ProjectEditor')),
)

type DaGenAI_PythonProps = {
  onCodeChanged?: (code: string) => void
  onCodeGenerated?: (code: string) => void
  pythonCode?: string
}

const DaGenAI_Python = ({
  onCodeChanged,
  onCodeGenerated,
}: DaGenAI_PythonProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [genCode, setGenCode] = useState<string>('')
  const [isFinished, setIsFinished] = useState<boolean>(false)
  const [editorType, setEditorType] = useState<'project' | 'code'>('code')

  // Update editor type when genCode changes
  useEffect(() => {
    const newEditorType = getEditorType(genCode)
    setEditorType(newEditorType)
  }, [genCode])

  return (
    <div className="flex h-full max-h-[calc(100%-10px)] w-full mt-2 rounded">
      <DaGenAI_Base
        type="GenAI_Python"
        buttonText="Generate SDV App"
        placeholderText="Enter your prompt to generate SDV App"
        onCodeGenerated={(code) => {
          setGenCode(code)
          if (onCodeGenerated) {
            onCodeGenerated(code)
          }
        }}
        onFinishChange={setIsFinished}
        onLoadingChange={setLoading}
        className="w-1/2"
      />
      <div className="flex h-full w-1/2 flex-1 flex-col pl-2 pt-1 min-w-0">
        <DaSectionTitle number={3} title="Preview Code" />
        <div
          className={cn(
            'relative mt-2 mb-2 flex-1 border rounded-lg w-full overflow-hidden min-h-0',
          )}
        >
          {genCode && !loading ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <Spinner />
                </div>
              }
            >
              {editorType === 'project' ? (
                <ProjectEditor
                  data={genCode || ''}
                  prototypeName="Generated Project"
                  onChange={(data: string) => {
                    setGenCode(data)
                  }}
                />
              ) : (
                <CodeEditor
                  code={genCode || ''}
                  setCode={(code) => {
                    setGenCode(code)
                  }}
                  language="python"
                  onBlur={() => {}}
                  editable={true}
                />
              )}
            </Suspense>
          ) : (
            <LoadingLineAnimation
              loading={loading}
              content={loading ? "Generating code..." : "There's no code here"}
            />
          )}
        </div>

        <div className="mt-auto flex w-full select-none flex-col">
          <Button
            variant="outline"
            className="h-8 w-full"
            onClick={() => {
              onCodeChanged ? onCodeChanged(genCode) : null
            }}
            disabled={!(genCode && genCode.length > 0) || !isFinished}
          >
            <TbCode className="mr-1.5 h-4 w-4" /> Add new generated code
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DaGenAI_Python
