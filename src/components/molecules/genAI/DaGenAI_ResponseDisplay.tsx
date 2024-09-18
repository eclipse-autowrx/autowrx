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
    <div className="scroll-gray flex h-full w-full overflow-y-auto rounded-md border border-gray-200 bg-gray-50 shadow">
      <SyntaxHighlighter
        language={language}
        style={customStyle}
        className="scroll-gray flex w-full text-xs"
      >
        {genCode}
      </SyntaxHighlighter>
    </div>
  )
}

export default DaGenAI_ResponseDisplay
