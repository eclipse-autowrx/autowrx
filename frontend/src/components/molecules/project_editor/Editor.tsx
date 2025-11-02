// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { File } from './types'
import Introduction from './Introduction'
import { VscSave, VscSaveAll } from 'react-icons/vsc'

interface EditorComponentProps {
  file: File | null
  openFiles: File[]
  onSelectFile: (file: File) => void
  onCloseFile: (file: File) => void
  onContentChange: (file: File, content: string) => void
  unsavedFiles: Set<string>
  onSave: (file?: File) => void
  onSaveAll: () => void
  fontFamily?: string
}

const EditorComponent: React.FC<EditorComponentProps> = ({
  file,
  openFiles,
  onSelectFile,
  onCloseFile,
  onContentChange,
  unsavedFiles,
  onSave,
  onSaveAll,
  fontFamily,
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to active tab when it changes and auto-close leftmost tabs if needed
  useEffect(() => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current
      const activeTab = activeTabRef.current

      const containerRect = container.getBoundingClientRect()
      const activeTabRect = activeTab.getBoundingClientRect()

      // Check if active tab is fully visible
      if (
        activeTabRect.left < containerRect.left ||
        activeTabRect.right > containerRect.right
      ) {
        // Scroll to make the active tab visible
        const scrollLeft =
          activeTab.offsetLeft -
          container.clientWidth / 2 +
          activeTab.clientWidth / 2
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth',
        })
      }
    }
  }, [file])

  // Auto-close leftmost tabs when there are too many open
  useEffect(() => {
    const checkTabOverflow = () => {
      if (tabsContainerRef.current && openFiles.length > 10) {
        // If we have more than 10 tabs, close the leftmost one that's not active
        const leftmostFile = openFiles.find((f) => f.name !== file?.name)
        if (leftmostFile) {
          // Add a slight delay to make the auto-close visible
          setTimeout(() => {
            onCloseFile(leftmostFile)
          }, 100)
        }
      }
    }

    checkTabOverflow()
  }, [openFiles.length, file?.name, onCloseFile])

  const handleClose = (e: React.MouseEvent, fileToClose: File) => {
    e.stopPropagation()
    onCloseFile(fileToClose)
  }

  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      // JavaScript/TypeScript
      case 'js':
      case 'jsx':
      case 'mjs':
        return 'javascript'
      case 'ts':
      case 'tsx':
        return 'typescript'

      // Web Technologies
      case 'json':
        return 'json'
      case 'html':
      case 'htm':
      case 'xhtml':
        return 'html'
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return 'css'
      case 'xml':
      case 'svg':
        return 'xml'

      // Markup & Documentation
      case 'md':
      case 'markdown':
        return 'markdown'
      case 'rst':
        return 'restructuredtext'

      // Python
      case 'py':
      case 'pyw':
      case 'pyi':
      case 'pyx':
      case 'pxd':
        return 'python'

      // Java & JVM
      case 'java':
      case 'class':
        return 'java'
      case 'kt':
        return 'kotlin'
      case 'scala':
        return 'scala'
      case 'groovy':
        return 'groovy'

      // C/C++ & Related
      case 'c':
        return 'c'
      case 'cpp':
      case 'cc':
      case 'cxx':
      case 'c++':
      case 'h':
      case 'hpp':
      case 'hh':
      case 'hxx':
        return 'cpp'
      case 'cs':
        return 'csharp'
      case 'd':
        return 'd'
      case 'swift':
        return 'swift'
      case 'objc':
      case 'm':
        return 'objective-c'

      // Scripting Languages
      case 'php':
      case 'phtml':
        return 'php'
      case 'rb':
      case 'erb':
        return 'ruby'
      case 'go':
      case 'mod':
        return 'go'
      case 'rs':
        return 'rust'
      case 'pl':
      case 'pm':
        return 'perl'
      case 'lua':
        return 'lua'
      case 'r':
        return 'r'
      case 'jl':
        return 'julia'
      case 'clj':
      case 'cljs':
        return 'clojure'
      case 'hs':
      case 'lhs':
        return 'haskell'
      case 'fs':
      case 'fsx':
        return 'fsharp'
      case 'ml':
      case 'mli':
        return 'ocaml'
      case 'elm':
        return 'elm'
      case 'ex':
      case 'exs':
        return 'elixir'
      case 'cr':
        return 'crystal'
      case 'nim':
        return 'nim'
      case 'zig':
        return 'zig'
      case 'v':
        return 'v'

      // Shell & Scripts
      case 'sh':
      case 'bash':
      case 'zsh':
      case 'fish':
        return 'shell'
      case 'bat':
      case 'cmd':
        return 'batch'
      case 'ps1':
      case 'psm1':
        return 'powershell'
      case 'vbs':
        return 'vbscript'

      // Database & Query
      case 'sql':
      case 'ddl':
      case 'dml':
        return 'sql'
      case 'mongo':
        return 'mongodb'
      case 'cypher':
        return 'cypher'

      // Configuration & Data
      case 'yaml':
      case 'yml':
        return 'yaml'
      case 'toml':
        return 'toml'
      case 'ini':
      case 'cfg':
      case 'conf':
        return 'ini'
      case 'env':
        return 'dotenv'
      case 'properties':
        return 'properties'
      case 'csv':
        return 'csv'
      case 'tsv':
        return 'tsv'

      // Build & Package Files
      case 'cmake':
      case 'cmake.in':
        return 'cmake'
      case 'makefile':
      case 'mk':
        return 'makefile'
      case 'dockerfile':
        return 'dockerfile'
      case 'lock':
        return 'json' // package-lock.json, yarn.lock, etc.

      // Assembly & Low-level
      case 'asm':
      case 's':
      case 'S':
        return 'assembly'
      case 'll':
        return 'llvm'

      // Documentation & Help
      case 'tex':
      case 'ltx':
        return 'latex'
      case 'bib':
        return 'bibtex'
      case 'adoc':
      case 'asciidoc':
        return 'asciidoc'

      // Other Common Formats
      case 'log':
        return 'log'
      case 'diff':
      case 'patch':
        return 'diff'
      case 'gitignore':
      case 'gitattributes':
      case 'gitmodules':
        return 'gitignore'
      case 'editorconfig':
        return 'editorconfig'
      case 'eslintrc':
      case 'prettierrc':
        return 'json'
      case 'babelrc':
        return 'json'
      case 'tsconfig':
        return 'json'
      case 'jsconfig':
        return 'json'
      case 'webpack.config':
        return 'javascript'
      case 'rollup.config':
        return 'javascript'
      case 'vite.config':
        return 'typescript'
      case 'tailwind.config':
        return 'javascript'
      case 'postcss.config':
        return 'javascript'
      case 'browserslist':
        return 'browserslist'
      case 'nvmrc':
        return 'plaintext'
      case 'node-version':
        return 'plaintext'

      default:
        return 'plaintext'
    }
  }

  const getMimeType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'png':
        return 'image/png'
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'gif':
        return 'image/gif'
      case 'svg':
        return 'image/svg+xml'
      case 'ico':
        return 'image/x-icon'
      case 'webp':
        return 'image/webp'
      case 'bmp':
        return 'image/bmp'
      default:
        return ''
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    if (file && value !== undefined) {
      onContentChange(file, value)
    }
  }

  if (!file) {
    return <Introduction />
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tabs */}
      <div className="flex items-center bg-gray-100 border-b border-gray-200 min-h-0">
        <div
          ref={tabsContainerRef}
          className="flex-1 flex overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {openFiles.map((openFile) => (
            <div
              key={openFile.name}
              ref={openFile.name === file.name ? activeTabRef : null}
              onClick={() => onSelectFile(openFile)}
              className={`
                flex items-center px-3 py-2 text-sm cursor-pointer border-r border-gray-200 min-w-0
                ${
                  openFile.name === file.name
                    ? 'bg-white text-gray-900 border-b-2 border-b-blue-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <span className="truncate max-w-32">{openFile.name}</span>
              {unsavedFiles.has(openFile.name) && (
                <span className="ml-2 w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></span>
              )}
              <button
                onClick={(e) => handleClose(e, openFile)}
                className="ml-2 p-0.5 hover:bg-gray-300 rounded opacity-60 hover:opacity-100 transition-opacity"
                title="Close tab"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Language indicator */}
        <div className="flex items-center px-3 border-l border-gray-200 bg-gray-50">
          <span className="text-xs text-gray-500 font-mono">
            {getLanguageFromFileName(file.name)}
          </span>
        </div>

        {/* Save buttons */}
        <div className="flex items-center px-2 border-l border-gray-200">
          <button
            onClick={() => onSave()}
            disabled={!file || !unsavedFiles.has(file.name)}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save (Ctrl+S)"
          >
            <VscSave size={16} />
          </button>
          <button
            onClick={onSaveAll}
            disabled={unsavedFiles.size === 0}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save All (Ctrl+Shift+S)"
          >
            <VscSaveAll size={16} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        {file.isBase64 ? (
          getMimeType(file.name) ? (
            <div className="flex-1 min-h-0 p-4 bg-gray-50 flex items-center justify-center">
              <img
                src={`data:${getMimeType(file.name)};base64,${file.content}`}
                alt={file.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0 p-4 bg-gray-50 flex items-center justify-center text-gray-500">
              This is a binary file.
            </div>
          )
        ) : (
          <Editor
            height="100%"
            language={getLanguageFromFileName(file.name)}
            value={file.content}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily:
                fontFamily || 'Monaco, Menlo, "Ubuntu Mono", monospace',
              wordWrap: 'on',
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              theme: 'vs-light',
              // Enhanced language support
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              parameterHints: { enabled: true },
              hover: { enabled: true },
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'always',
              // Better syntax highlighting
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
                highlightActiveIndentation: true,
              },
              // Performance optimizations
              renderWhitespace: 'selection',
              renderControlCharacters: false,
              renderLineHighlight: 'all',
            }}
          />
        )}
      </div>
    </div>
  )
}

export default EditorComponent

