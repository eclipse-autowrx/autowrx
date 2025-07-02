// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useRef, useState, useEffect } from 'react'
import { DaButton } from '../../atoms/DaButton'
import {
  TbEdit,
  TbX,
  TbCheck,
  TbSelector,
  TbCopy,
  TbCopyPlus,
} from 'react-icons/tb'
import CodeEditor from '../CodeEditor'
import DaPopup from '../../atoms/DaPopup'
import { DaText } from '@/components/atoms/DaText'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import { DaCopy } from '@/components/atoms/DaCopy'
import useWizardGenAIStore from '@/pages/wizard/useGenAIWizardStore'
import { DaInput } from '@/components/atoms/DaInput'
import ModelApiList from '@/components/organisms/ModelApiList'
interface DaDashboardWidgetEditorprototype {
  widgetEditorPopupState: [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>,
  ]
  selectedWidget: any
  handleUpdateWidget: (widgetConfig: string) => void
  isWizard?: boolean
}

// Component for individual signal copy items
const SignalCopyItem = ({ api }: { api: { name: string } }) => {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${api.name}"`)
    setIsCopied(true)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsCopied(false)
      timeoutRef.current = null
    }, 2000)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      className="flex h-50% rounded items-center text-da-gray-medium group px-2 py-1 m-1 hover:bg-da-gray-light w-full"
      onClick={handleCopy}
    >
      {isCopied ? (
        <TbCheck className="size-4 mr-2 text-green-500" />
      ) : (
        <TbCopy className="size-4 mr-2" />
      )}
      <DaText variant="small" className="cursor-pointer">
        {api.name}
      </DaText>
    </div>
  )
}

const DaDashboardWidgetEditor = ({
  widgetEditorPopupState: codeEditorPopup,
  selectedWidget,
  handleUpdateWidget,
  isWizard = false,
}: DaDashboardWidgetEditorprototype) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [usedAPIs, setUsedAPIs] = useState<any[]>([])
  const [localPrototype, setLocalPrototype] = useState<Partial<Prototype>>({
    code: '',
  })

  const [prototype, setActivePrototype, activeModelApis] = useModelStore(
    (state) => [
      state.prototype as Prototype,
      state.setActivePrototype,
      state.activeModelApis,
    ],
    shallow,
  )

  const { wizardPrototype: prototypeData } = useWizardGenAIStore()

  const [optionStr, setOptionStr] = useState('')
  const [widgetUrl, setWidgetUrl] = useState('')
  const [widgetIcon, setWidgetIcon] = useState('')
  const [boxes, setBoxes] = useState('')

  // State and ref for "Copy all signals"
  const [isAllCopied, setIsAllCopied] = useState(false)
  const allCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (codeEditorPopup[0]) {
      setIsExpanded(false)
    }
  }, [codeEditorPopup[0]])

  useEffect(() => {
    if (selectedWidget) {
      let options = {} as any
      try {
        let widget = JSON.parse(selectedWidget)
        setBoxes(JSON.stringify(widget.boxes, null, 4))
        options = widget.options
        setWidgetIcon(options.iconURL)
        setWidgetUrl(options.url)
        delete options.iconURL
        delete options.url
      } catch (e) {}
      setOptionStr(JSON.stringify(options, null, 4))
    }
  }, [selectedWidget])

  useEffect(() => {
    if (isWizard) {
      setLocalPrototype(prototypeData)
    } else {
      setLocalPrototype(prototype)
    }
  }, [prototype, prototypeData, isWizard])

  useEffect(() => {
    if (
      !localPrototype.code ||
      !activeModelApis ||
      activeModelApis.length === 0
    ) {
      return
    }
    let newUsedAPIsList = [] as string[]
    activeModelApis.forEach((item) => {
      if (localPrototype.code && localPrototype.code.includes(item.shortName)) {
        newUsedAPIsList.push(item)
      }
    })
    setUsedAPIs(newUsedAPIsList)
  }, [localPrototype.code, activeModelApis])

  const copyAllSignals = () => {
    if (!usedAPIs || usedAPIs.length === 0) return
    const allSignalsText = usedAPIs.map((api) => `"${api.name}"`).join(',')
    navigator.clipboard.writeText(allSignalsText)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (allCopyTimeoutRef.current) {
        clearTimeout(allCopyTimeoutRef.current)
      }
    }
  }, [])

  return (
    <DaPopup
      state={codeEditorPopup}
      className="flex w-[90%] max-w-[1400px] h-fit overflow-auto bg-da-white rounded"
      trigger={<span></span>}
    >
      <div className="flex flex-col w-full h-full">
        <div className="flex relative w-full justify-between items-center mb-2">
          <DaText
            variant="title"
            className="text-da-primary-500 flex items-center"
          >
            <TbEdit className="w-5 h-5 mr-2" />
            Edit widget
          </DaText>
          {usedAPIs && usedAPIs.length > 0 && (
            <div ref={dropdownRef} className="flex flex-col relative">
              <div className="flex w-full justify-end">
                <DaButton
                  size="sm"
                  variant="outline-nocolor"
                  onClick={() => {
                    setIsExpanded(!isExpanded)
                  }}
                >
                  <TbSelector className="mr-2 flex justify-end w-fit" /> Used
                  signals
                </DaButton>
              </div>
              {isExpanded && (
                <div className="absolute flex flex-col top-9 right-0 bg-da-white z-10 rounded border border-gray-200 shadow-sm cursor-pointer">
                  {/* "Copy all signals" option */}
                  <div
                    className="flex h-50% rounded items-center text-da-gray-medium group px-2 py-1 m-1 hover:bg-da-gray-light w-full border-gray-100"
                    onClick={() => {
                      copyAllSignals()
                      setIsAllCopied(true)
                      if (allCopyTimeoutRef.current) {
                        clearTimeout(allCopyTimeoutRef.current)
                      }
                      allCopyTimeoutRef.current = setTimeout(() => {
                        setIsAllCopied(false)
                        allCopyTimeoutRef.current = null
                      }, 2000)
                    }}
                  >
                    {isAllCopied ? (
                      <TbCheck className="size-4 mr-2 text-green-500" />
                    ) : (
                      <TbCopyPlus className="size-4 mr-2 text-da-primary-500" />
                    )}
                    <DaText
                      variant="small"
                      className="cursor-pointer font-medium"
                    >
                      Copy all signals
                    </DaText>
                  </div>

                  {/* Individual signal items */}
                  {usedAPIs.map((api) => (
                    <SignalCopyItem key={api.name} api={api} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex grow overflow-auto">
          <div className="grow">
            <div className="overflow-auto h-[220px] max-h-[262px]">
              <div className="font-semibold text-slate-800">Options</div>
              <CodeEditor
                language="json"
                editable={true}
                code={optionStr}
                setCode={(e) => {
                  setOptionStr(e)
                }}
                onBlur={() => {}}
              />
            </div>

            <div className="py-2 flex items-center">
              <div className="font-semibold text-slate-800">Boxes:</div>
              <div className="w-full pl-2">
                <DaInput
                  value={boxes}
                  onChange={(e) => setBoxes(e.target.value)}
                  placeholder="Boxes"
                  wrapperClassName="!bg-white"
                  inputClassName="!bg-white text-sm"
                  className="w-full"
                />
              </div>
            </div>
            <div className="py-2 flex items-center">
              <div className="font-semibold text-slate-800">URL:</div>
              <div className="w-full pl-2">
                <DaInput
                  value={widgetUrl}
                  onChange={(e) => setWidgetUrl(e.target.value)}
                  placeholder="URL"
                  wrapperClassName="!bg-white"
                  inputClassName="!bg-white text-sm"
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <div className="min-w-[500px] max-h-[400px] overflow-auto">
            <ModelApiList />
          </div>
        </div>

        <div className="flex w-full space-x-2 justify-end pt-4">
          <DaButton
            size="sm"
            variant="outline-nocolor"
            className="!min-w-16"
            onClick={() => codeEditorPopup[1](false)}
          >
            Cancel
          </DaButton>
          <DaButton
            size="sm"
            variant="solid"
            className="!min-w-16"
            onClick={() => {
              let newOption = {} as any
              try {
                newOption = JSON.parse(optionStr)
              } catch (err) {}
              newOption.url = `${widgetUrl}`
              newOption.iconURL = `${widgetIcon}`
              let widget = {} as any
              try {
                widget = JSON.parse(selectedWidget)
              } catch (err) {}
              widget.options = newOption
              try {
                widget.boxes = JSON.parse(boxes)
              } catch (err) {}
              handleUpdateWidget(JSON.stringify(widget, null, 4))
              codeEditorPopup[1](false)
            }}
          >
            Save
          </DaButton>
        </div>
      </div>
    </DaPopup>
  )
}

export default DaDashboardWidgetEditor
