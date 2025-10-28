// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import Editor from '@monaco-editor/react'
import clsx from 'clsx'
import { Spinner } from '../atoms/spinner'
import { useEffect } from 'react'
import { useMonaco } from '@monaco-editor/react'
import { useState } from 'react'

export interface CodeEditorProps {
  code: string
  setCode: (code: string) => void
  editable?: boolean
  language: string
  // onFocus: () => void,
  onBlur: () => void
  fontSize?: number
}

const CodeEditor = ({
  code,
  setCode,
  editable = false,
  language,
  onBlur,
  fontSize,
}: CodeEditorProps) => {
  const monaco = useMonaco()
  const [show, setShow] = useState(false)

  function handleEditorMount(editor: any) {
    // editor.onDidFocusEditorText(() => {
    //     if(onFocus) onFocus()
    // //
    // });

    editor.onDidBlurEditorText(() => {
      if (onBlur) onBlur()
      //
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
            fontSize,
            // lineNumbers: (num) => (num + 5).toString(),
          }}
          loading={
            <div
              className={clsx(
                'flex h-full w-full text-foreground items-center justify-center select-none',
              )}
            >
              <Spinner />
            </div>
          }
        />
      )}
    </div>
  )
}

export default CodeEditor
