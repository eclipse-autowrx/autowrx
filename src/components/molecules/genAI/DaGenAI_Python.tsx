import { useEffect, useRef, useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { TbCode } from 'react-icons/tb'
import LoadingLineAnimation from './DaGenAI_LoadingLineAnimation.tsx'
import DaGenAI_ResponseDisplay from './DaGenAI_ResponseDisplay.tsx'
import clsx from 'clsx'
import DaSectionTitle from '@/components/atoms/DaSectionTitle.tsx'
import DaGenAI_Base from './DaGenAI_Base.tsx'
import CodeEditor from '../CodeEditor.tsx'

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
      <div className="flex h-full w-1/2 flex-1 flex-col pl-2">
        <DaSectionTitle number={3} title="Preview Code" />
        <div
          className={clsx(
            'scroll-gray flex mt-2 mb-2 h-full border rounded-lg w-full overflow-y-auto overflow-x-hidden',
          )}
        >
          {genCode ? (
            <CodeEditor
              code={genCode || ''}
              setCode={(code) => {
                setGenCode(code)
              }}
              language="python"
              onBlur={() => {}}
              editable={true}
            />
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

export default DaGenAI_Python
