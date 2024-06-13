import Editor from '@monaco-editor/react'
import clsx from 'clsx'
import DaLoader from '../atoms/DaLoader'
import { useEffect } from 'react'
import { useMonaco } from '@monaco-editor/react'
import { useState } from 'react'

export interface CodeEditorProps {
  code: string
  setCode: (code: string) => void
  editable?: boolean
  language: 'python' | 'json'
  // onFocus: () => void,
  onBlur: () => void
}

const CodeEditor = ({
  code,
  setCode,
  editable = false,
  language,
  onBlur,
}: CodeEditorProps) => {
  const monaco = useMonaco()
  const [show, setShow] = useState(false)

  function handleEditorMount(editor: any) {
    // editor.onDidFocusEditorText(() => {
    //     if(onFocus) onFocus()
    // //   console.log("it has just got focused");
    // });

    editor.onDidBlurEditorText(() => {
      if (onBlur) onBlur()
      //   console.log("it has just got unfocused");
    })
  }

  useEffect(() => {
    if (!monaco) return
    let rules = [{ token: 'vehicle', foreground: 'ff0000' }]
    monaco.editor.defineTheme('vs-dauto', {
      base: 'vs',
      inherit: true,
      rules: [{ token: 'vehicle', foreground: 'ff0000', fontStyle: 'bold' }],
      colors: {},
    })
    monaco.editor.defineTheme('read-only', {
      base: 'vs',
      inherit: true,
      rules: [{ token: 'vehicle', foreground: 'ff0000', fontStyle: 'bold' }],
      colors: {
        'editor.background': '#D8D8D8',
      },
    })
    setShow(true)
  }, [monaco])

  return (
    <div className={clsx('flex flex-col h-full w-full overflow-hidden')}>
      {show && (
        <Editor
          theme={editable ? 'vs-dauto' : 'read-only'}
          height="100%"
          defaultLanguage={language}
          onChange={(o) => {
            setCode(o ?? '')
          }}
          onMount={handleEditorMount}
          value={code}
          options={{
            scrollBeyondLastLine: false,
            readOnly: !Boolean(editable),
            minimap: { enabled: false },
            wordWrap: 'on',
            'semanticHighlighting.enabled': true,
            // lineNumbers: (num) => (num + 5).toString(),
          }}
          loading={
            <div
              className={clsx(
                'flex h-full w-full text-da-gray-dark items-center justify-center select-none',
              )}
            >
              <DaLoader />
            </div>
          }
        />
      )}
    </div>
  )
}

export default CodeEditor
