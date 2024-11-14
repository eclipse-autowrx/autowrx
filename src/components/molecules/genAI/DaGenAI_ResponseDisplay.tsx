import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { useState, useEffect, lazy, Suspense } from 'react'
import { retry } from '@/lib/retry'

const SyntaxHighlighter = lazy(() =>
  retry(() => import('react-syntax-highlighter/dist/esm/prism-light')),
) as any

export const customStyle = {
  ...githubGist,
  hljs: {
    ...githubGist.hljs,
    background: '#f9fafb', // Change the background color as needed
  },
}

export interface GenCodeProps {
  language: string
  code: string
}

const DaGenAI_ResponseDisplay = ({ language = 'text', code = '' }) => {
  const [genCode, setGenCode] = useState<string>('')

  useEffect(() => {
    setGenCode(code)
  }, [code])

  return (
    <div className="scroll-gray flex h-full w-full overflow-y-auto rounded-md border border-gray-200 bg-gray-50 shadow">
      <Suspense>
        <SyntaxHighlighter
          language={language}
          style={customStyle}
          className="scroll-gray flex w-full text-xs"
        >
          {genCode}
        </SyntaxHighlighter>
      </Suspense>
    </div>
  )
}

export default DaGenAI_ResponseDisplay
