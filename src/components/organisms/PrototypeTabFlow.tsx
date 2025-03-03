// PrototypeTabFlow.tsx
import React, { useEffect, useState } from 'react'
import {
  TbArrowsMaximize,
  TbArrowsMinimize,
  TbEdit,
  TbLoader,
  TbChevronCompactRight,
} from 'react-icons/tb'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { updatePrototypeService } from '@/services/prototype.service'
import DaTooltip from '../atoms/DaTooltip'
import { FlowStep } from '@/types/flow.type'
import { DaButton } from '../atoms/DaButton'
import { cn } from '@/lib/utils'
import { useSystemUI } from '@/hooks/useSystemUI'
import DaCheckbox from '../atoms/DaCheckbox'
import FlowItem from '../molecules/flow/FlowItem'
import DaText from '../atoms/DaText'
import DaFlowEditor from '../molecules/flow/DaFlowEditor'
import FlowItemEditor from '../molecules/flow/FlowItemEditor'
import FlowInterface from '../molecules/flow/FlowInterface'
import {
  FLOW_CELLS,
  setNestedValue,
  getNestedValue,
  headerGroups,
} from '../molecules/flow/flow.utils'
import { Interface } from '@/types/flow.type'
import { createEmptyFlow } from '../molecules/flow/flow.utils'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'

const PrototypeTabFlow = () => {
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const { data: prototype } = useCurrentPrototype()
  const [isEditing, setIsEditing] = useState(false)
  const [customerJourneySteps, setCustomerJourneySteps] = useState<string[]>([])
  const [originalFlowData, setOriginalFlowData] = useState<FlowStep[]>([])
  const [flowData, setFlowData] = useState<FlowStep[]>([])
  const [flowString, setFlowString] = useState('')
  const {
    showPrototypeFlowASIL,
    setShowPrototypeFlowASIL,
    showPrototypeFlowFullScreen,
    setShowPrototypeFlowFullScreen,
  } = useSystemUI()
  const [isSaving, setIsSaving] = useState(false)
  const [flowEditorOpen, setFlowEditorOpen] = useState(false)
  const [currentEditingCell, setCurrentEditingCell] = useState<{
    stepIndex: number
    flowIndex: number
    fieldPath: string[]
    value: string
  } | null>(null)

  // Parse customer journey steps (each step starts with "#")
  const parseCustomerJourneySteps = (journeyText: string | undefined) => {
    if (!journeyText) return []
    return journeyText
      .split('#')
      .filter((step) => step.trim())
      .map((step) => step.split('\n')[0].trim())
  }

  // Initialize or update flow and journey steps when prototype changes
  useEffect(() => {
    if (prototype) {
      const steps = parseCustomerJourneySteps(prototype.customer_journey)
      setCustomerJourneySteps(steps)
      try {
        if (prototype.flow) {
          const parsedFlow = JSON.parse(prototype.flow)
          setFlowData(parsedFlow)
          setOriginalFlowData(parsedFlow)
        } else {
          // Create initial empty flows for each step
          const initialFlows = steps.map((step) => ({
            title: step,
            flows: [createEmptyFlow()],
          }))
          setFlowData(initialFlows)
          setOriginalFlowData(initialFlows)
        }
      } catch (error) {
        console.error('Error parsing flow data:', error)
      }
    }
  }, [prototype])

  // Synchronize flow data with customer journey steps (by index)
  useEffect(() => {
    if (flowData.length > 0 && customerJourneySteps.length > 0) {
      const synchronizedFlows = customerJourneySteps.map((stepTitle, index) => {
        const existingFlow = flowData[index]
        if (existingFlow) {
          return { ...existingFlow, title: stepTitle }
        }
        return {
          title: stepTitle,
          flows: [createEmptyFlow()],
        }
      })
      setFlowData(synchronizedFlows)
    }
  }, [customerJourneySteps])

  const handleSave = async (stringJsonData: string) => {
    if (!prototype) return
    try {
      setIsSaving(true)
      const parsedData = JSON.parse(stringJsonData)
      // console.log('Saving flow data:', parsedData)
      setFlowData(parsedData)
      await updatePrototypeService(prototype.id, { flow: stringJsonData })
    } catch (error) {
      console.error('Error saving flow data:', error)
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  // Update a nested property within a flow cell using the shared helper.
  // Update a nested property within a flow cell using the shared helper.
  const updateFlowCell = (
    stepIndex: number,
    flowIndex: number,
    path: string[],
    value: any,
  ) => {
    const newData = [...flowData]
    newData[stepIndex].flows[flowIndex] = setNestedValue(
      newData[stepIndex].flows[flowIndex],
      path,
      value,
    )
    setFlowData(newData)
    // Stringify the updated flow data and update the flowString state
    setFlowString(JSON.stringify(newData))
    handleSave(JSON.stringify(newData))
  }

  // Open the flow editor for a specific cell.
  const openFlowEditor = (
    stepIndex: number,
    flowIndex: number,
    fieldPath: string[],
    value: string,
  ) => {
    setCurrentEditingCell({ stepIndex, flowIndex, fieldPath, value })
    setFlowEditorOpen(true)
  }

  return (
    <div
      className={cn(
        'flex w-full h-full flex-col bg-white rounded-md py-4 px-10',
        showPrototypeFlowFullScreen
          ? 'fixed inset-0 z-50 overflow-auto bg-white'
          : '',
      )}
    >
      <div className="w-full">
        <div className="flex items-center border-b pb-2 mb-4">
          <DaText variant="title" className="text-da-primary-500">
            End-to-End Flow: {prototype?.name}
          </DaText>
          <div className="grow" />
          {isAuthorized && (
            <>
              {!isEditing ? (
                <DaButton
                  onClick={() => setIsEditing(true)}
                  className="!justify-start"
                  variant="editor"
                  size="sm"
                >
                  <TbEdit className="w-4 h-4 mr-1" /> Edit
                </DaButton>
              ) : isSaving ? (
                <div className="flex items-center text-da-primary-500">
                  <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                  Saving
                </div>
              ) : (
                <div className="flex space-x-2 mr-2">
                  <DaButton
                    variant="outline-nocolor"
                    onClick={() => {
                      setFlowData(originalFlowData)
                      setFlowString(JSON.stringify(originalFlowData))
                      setIsEditing(false)
                    }}
                    className="w-16 text-da-white px-4 py-2 rounded"
                    size="sm"
                  >
                    Cancel
                  </DaButton>
                  <DaButton
                    onClick={() => handleSave(flowString)}
                    className="w-16 text-white px-4 py-2 rounded"
                    size="sm"
                  >
                    Save
                  </DaButton>
                </div>
              )}
            </>
          )}
          <DaButton
            onClick={() =>
              setShowPrototypeFlowFullScreen(!showPrototypeFlowFullScreen)
            }
            size="sm"
            variant="editor"
          >
            {showPrototypeFlowFullScreen ? (
              <TbArrowsMinimize className="size-4" />
            ) : (
              <TbArrowsMaximize className="size-4" />
            )}
          </DaButton>
        </div>

        {isEditing ? (
          <DaFlowEditor
            initialData={flowData}
            onUpdate={(jsonData) => {
              setFlowString(jsonData)
            }}
          />
        ) : (
          <>
            <table className="w-full table-fixed border-separate border-spacing-0">
              <colgroup>
                <col className="w-[17.76%]" />
                <col className="w-[2.80%] min-w-[40px]" />
                <col className="w-[17.76%]" />
                <col className="w-[2.80%] min-w-[40px]" />
                <col className="w-[17.76%]" />
                <col className="w-[2.80%] min-w-[40px]" />
                <col className="w-[17.76%]" />
                <col className="w-[2.80%] min-w-[40px]" />
                <col className="w-[17.76%]" />
              </colgroup>

              <thead className="sticky top-0 z-10 bg-gradient-to-tr from-da-secondary-500 to-da-primary-500 text-white">
                {/* Header Group Row */}
                <tr className="text-sm uppercase">
                  {headerGroups.map((group, idx) => (
                    <th
                      key={idx}
                      colSpan={group.cells.length}
                      className="font-semibold p-2 border border-white text-center"
                    >
                      {group.label}
                    </th>
                  ))}
                </tr>
                {/* Individual Column Headers */}
                <tr className="text-sm uppercase">
                  {FLOW_CELLS.map((cell) => (
                    <th
                      key={cell.key}
                      className={`p-2 text-xs border border-white ${
                        cell.tooltip ? 'bg-opacity-20' : ''
                      }`}
                    >
                      {cell.tooltip ? (
                        <DaTooltip
                          content={cell.tooltip}
                          className="normal-case"
                        >
                          <div className="cursor-pointer ">{cell.title}</div>
                        </DaTooltip>
                      ) : (
                        cell.title
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Spacer row */}
                <tr>
                  {FLOW_CELLS.map((_, index) => (
                    <td
                      key={index}
                      className={`h-3 ${index % 2 === 0 ? 'bg-white' : 'bg-da-primary-100'}`}
                    ></td>
                  ))}
                </tr>
                {flowData && flowData.length > 0 ? (
                  flowData.map((step, stepIndex) => (
                    <React.Fragment key={stepIndex}>
                      <tr>
                        <td
                          colSpan={FLOW_CELLS.length}
                          className="relative text-xs border font-semibold bg-da-primary-500 text-white h-9 px-8 z-0"
                        >
                          <TbChevronCompactRight className="absolute -left-[12px] top-[5.5px] -translate-x-1/4 -translate-y-1/4 size-[47px] bg-transparent text-white fill-current" />
                          {step.title}
                          <TbChevronCompactRight className="absolute -right-[1px] top-[5.5px] translate-x-1/2 -translate-y-1/4 size-[47px] bg-transparent text-da-primary-500 fill-current" />
                        </td>
                      </tr>
                      {step.flows.map((flow, flowIndex) => (
                        <tr key={flowIndex} className="font-medium text-xs">
                          {FLOW_CELLS.map((cell) => {
                            const cellValue = getNestedValue(flow, cell.path)
                            return (
                              <td
                                key={cell.key}
                                className={`border p-2 text-center ${
                                  cell.isSignalFlow ? 'bg-da-primary-100' : ''
                                }`}
                              >
                                {cell.isSignalFlow ? (
                                  <FlowInterface
                                    flow={cellValue}
                                    interfaceType={cell.key as Interface}
                                  />
                                ) : (
                                  <FlowItem
                                    stringData={cellValue}
                                    onEdit={(val) =>
                                      openFlowEditor(
                                        stepIndex,
                                        flowIndex,
                                        cell.path,
                                        val,
                                      )
                                    }
                                  />
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={FLOW_CELLS.length}
                      className="border p-2 text-center py-4 text-sm"
                    >
                      No flow available. Please edit to add flow data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
        {!isEditing && (
          <DaCheckbox
            checked={showPrototypeFlowASIL}
            onChange={() => setShowPrototypeFlowASIL(!showPrototypeFlowASIL)}
            label={'Show ASIL/QM Levels'}
            className="text-sm mt-2 w-fit"
          />
        )}
      </div>

      {currentEditingCell && (
        <FlowItemEditor
          value={currentEditingCell.value}
          onChange={(updatedValue) => {
            updateFlowCell(
              currentEditingCell.stepIndex,
              currentEditingCell.flowIndex,
              currentEditingCell.fieldPath,
              updatedValue,
            )
            setFlowEditorOpen(false)
            setCurrentEditingCell(null)
          }}
          open={flowEditorOpen}
          onOpenChange={(open) => {
            setFlowEditorOpen(open)
            if (!open) {
              setCurrentEditingCell(null)
            }
          }}
          isSaveMode={true}
        />
      )}
    </div>
  )
}

export default PrototypeTabFlow
