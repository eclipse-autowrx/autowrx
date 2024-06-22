import React, { useRef, useState, useEffect } from 'react'
import { DaButton } from '../../atoms/DaButton'
import { TbEdit, TbX, TbCheck, TbSelector, TbCopy } from 'react-icons/tb'
import CodeEditor from '../CodeEditor'
import DaPopup from '../../atoms/DaPopup'
import { DaText } from '@/components/atoms/DaText'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import { DaCopy } from '@/components/atoms/DaCopy'

interface DaDashboardWidgetEditorprototype {
  widgetEditorPopupState: [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>,
  ]
  selectedWidget: any
  setSelectedWidget: React.Dispatch<React.SetStateAction<any>>
  handleUpdateWidget: () => void
}

const DaDashboardWidgetEditor = ({
  widgetEditorPopupState: codeEditorPopup,
  selectedWidget,
  setSelectedWidget,
  handleUpdateWidget,
}: DaDashboardWidgetEditorprototype) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [usedAPIs, setUsedAPIs] = useState<any[]>([])
  const [prototype, setActivePrototype, activeModelApis] = useModelStore(
    (state) => [
      state.prototype as Prototype,
      state.setActivePrototype,
      state.activeModelApis,
    ],
    shallow,
  )

  useEffect(() => {
    if (!prototype.code || !activeModelApis || activeModelApis.length === 0) {
      return
    }

    let newUsedAPIsList = [] as string[]
    activeModelApis.forEach((item) => {
      if (prototype.code.includes(item.shortName)) {
        newUsedAPIsList.push(item) // Assuming item is the object you showed
      }
    })
    // console.log('newUsedAPIsList', newUsedAPIsList)
    setUsedAPIs(newUsedAPIsList)
  }, [prototype.code, activeModelApis])

  return (
    <DaPopup
      state={codeEditorPopup}
      className="flex w-[90%] max-w-[880px] h-[500px] bg-da-white rounded"
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
                  <TbSelector className="mr-2 flex justify-end w-fit" />{' '}
                  Recently used APIs
                </DaButton>
              </div>
              {isExpanded && (
                <div className="absolute flex flex-col top-9 right-0 bg-da-white z-10 rounded border border-gray-200 shadow-sm cursor-pointer">
                  {usedAPIs.map((api) => (
                    <DaCopy textToCopy={api.name} showIcon={false}>
                      <div
                        className="flex h-50% rounded items-center text-da-gray-medium group px-2 py-1 m-1 hover:bg-da-gray-light w-full"
                        key={api.name}
                      >
                        <TbCopy className="w-3 h-3 mr-2" />
                        <DaText variant="small" className="cursor-pointer">
                          {api.name}
                        </DaText>
                      </div>
                    </DaCopy>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <CodeEditor
          language="json"
          editable={true}
          code={selectedWidget}
          setCode={(e) => {
            setSelectedWidget(e)
          }}
          onBlur={() => {}}
        />
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
              handleUpdateWidget()
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
