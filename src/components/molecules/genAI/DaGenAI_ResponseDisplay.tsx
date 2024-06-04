import SyntaxHighlighter from 'react-syntax-highlighter'
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { useState, useEffect } from 'react'

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
    <div className="flex w-full h-full rounded border bg-gray-50 border-gray-200 overflow-y-auto scroll-gray">
      <SyntaxHighlighter
        language={language}
        style={customStyle}
        className="flex text-xs w-full scroll-gray"
      >
        {genCode}
      </SyntaxHighlighter>
    </div>
  )
}

export default DaGenAI_ResponseDisplay
