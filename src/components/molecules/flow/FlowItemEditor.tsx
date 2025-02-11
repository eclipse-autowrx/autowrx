import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ASILLevel } from './ASILBadge'
import CustomDialog from './CustomDialog'
import { DialogClose } from '@/components/atoms/dialog'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import ASILSelect from './ASILSelect'
import {
  TbCalendarEvent,
  TbCheck,
  TbLoader2,
  TbPlus,
  TbTrash,
  TbChevronRight,
  TbTextScan2,
  TbX,
} from 'react-icons/tb'
import { riskAssessmentGenerationPrompt } from './FlowPromptInventory'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

interface FlowItemEditorProps {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}

interface FormData {
  type: string
  component: string
  description: string
  preAsilLevel: ASILLevel
  postAsilLevel: ASILLevel
  riskAssessment?: string
  approvedBy?: string
  approvedAt?: string
  [key: string]: string | ASILLevel | undefined
}

const FlowItemEditor = ({ value, onChange, children }: FlowItemEditorProps) => {
  const { data: currentUser } = useSelfProfileQuery()

  const [formData, setFormData] = useState<FormData>(() => {
    try {
      const parsed = JSON.parse(value)
      const { asilLevel, preAsilLevel, postAsilLevel, ...rest } = parsed
      const newPreAsilLevel = preAsilLevel || 'QM'
      const newPostAsilLevel = postAsilLevel || asilLevel || 'QM'
      return {
        type: parsed.type || '',
        component: parsed.component || '',
        description: parsed.description || '',
        preAsilLevel: newPreAsilLevel,
        postAsilLevel: newPostAsilLevel,
        riskAssessment: parsed.riskAssessment || '',
        approvedBy: parsed.approvedBy || '',
        approvedAt: parsed.approvedAt || '',
        ...rest,
      }
    } catch {
      return {
        type: '',
        component: '',
        description: '',
        preAsilLevel: 'QM',
        postAsilLevel: 'QM',
        riskAssessment: '',
        approvedBy: '',
        approvedAt: '',
      }
    }
  })

  // Keys not to be shown as custom attributes
  const mandatoryKeys = [
    'type',
    'component',
    'description',
    'preAsilLevel',
    'postAsilLevel',
    'riskAssessment',
    'approvedBy',
    'approvedAt',
  ]

  // Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationTime, setEvaluationTime] = useState(0)
  const [evaluationIntervalId, setEvaluationIntervalId] = useState<
    number | null
  >(null)
  const [isEvaluated, setIsEvaluated] = useState(false)
  // Backup the current risk assessment before evaluation starts
  const [backupRiskAssessment, setBackupRiskAssessment] = useState<string>(
    formData.riskAssessment || '',
  )

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = () => {
    const jsonString = JSON.stringify(formData)
    onChange(jsonString)
  }

  const handleAddCustomAttribute = () => {
    const attributeName = prompt('Enter custom attribute name:')
    if (attributeName && !formData.hasOwnProperty(attributeName)) {
      setFormData((prev) => ({ ...prev, [attributeName]: '' }))
    }
  }

  const handleRemoveCustomAttribute = (attributeName: string) => {
    setFormData((prev) => {
      const newData = { ...prev }
      delete newData[attributeName]
      return newData
    })
  }

  const generateRiskAssessment = async () => {
    const action = formData.description
    const message = `Generate Risk Assessment for action "${action}" in automotive`

    // Backup the current risk assessment before evaluation starts
    setBackupRiskAssessment(formData.riskAssessment || '')

    // Start evaluation timer
    setIsEvaluating(true)
    setEvaluationTime(0)
    const intervalId = window.setInterval(() => {
      setEvaluationTime((prev) => prev + 0.1)
    }, 100)
    setEvaluationIntervalId(intervalId)

    try {
      const response = await fetch('https://digitalauto-ai.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemMessage: riskAssessmentGenerationPrompt,
          message: message,
        }),
      })
      const data = await response.json()
      console.log('Risk assessment generation response:', data)

      // Use regex to extract preAsilLevel and postAsilLevel since the XML might be malformed
      const preAsilMatch = data.content.match(
        /<preAsilLevel>(.*?)<\/preAsilLevel>/s,
      )
      const postAsilMatch = data.content.match(
        /<postAsilLevel>(.*?)<\/postAsilLevel>/s,
      )

      console.log('preAsilMatch', preAsilMatch)
      console.log('postAsilMatch', postAsilMatch)

      const newPreAsilLevel = (
        preAsilMatch ? preAsilMatch[1].trim() : formData.preAsilLevel
      ) as ASILLevel
      const newPostAsilLevel = (
        postAsilMatch ? postAsilMatch[1].trim() : formData.postAsilLevel
      ) as ASILLevel

      // Remove the pre/post ASIL tags and any risk_assessment tags to get the markdown content
      const cleanedContent = data.content
        .replace(/<preAsilLevel>.*?<\/preAsilLevel>/s, '')
        .replace(/<postAsilLevel>.*?<\/postAsilLevel>/s, '')
        .replace(/<\/?risk_assessment>/g, '')
        .trim()

      setFormData((prev) => ({
        ...prev,
        riskAssessment: cleanedContent,
        preAsilLevel: newPreAsilLevel,
        postAsilLevel: newPostAsilLevel,
      }))
      setIsEvaluated(true)
    } catch (error) {
      console.error('Error generating risk assessment:', error)
    } finally {
      if (evaluationIntervalId) {
        clearInterval(evaluationIntervalId)
      } else {
        clearInterval(intervalId)
      }
      setIsEvaluating(false)
    }
  }

  const handleApprove = () => {
    if (!currentUser) return
    setFormData((prev) => {
      const updated = {
        ...prev,
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString(),
      }
      // Update backup with the approved risk assessment
      setBackupRiskAssessment(updated.riskAssessment ?? '')
      return updated
    })
    setIsEvaluated(false)
    handleSubmit()
  }

  const handleReject = () => {
    // Revert to the backup risk assessment and remove approval info
    setFormData((prev) => ({
      ...prev,
      riskAssessment: backupRiskAssessment,
      approvedBy: '',
      approvedAt: '',
    }))
    setIsEvaluated(false)
  }

  const markdownContent = formData.riskAssessment || ''

  const customAttributes = Object.keys(formData).filter(
    (key) => !mandatoryKeys.includes(key),
  )

  return (
    <CustomDialog
      trigger={children}
      dialogTitle="Edit Flow Implementation"
      className="max-w-[90vw] w-[90vw] xl:w-[75vw] h-[90vh] xl:h-[80vh] text-xs"
    >
      <div className="flex flex-col w-full h-full">
        <div className="flex h-full overflow-y-auto space-x-4">
          {/* Left Column: Mandatory Fields and Custom Attributes */}
          <div className="flex flex-col w-1/2 h-full pt-2 pr-1.5 overflow-y-auto scroll-gray gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-medium">
                Type <span className="text-red-500">*</span>
              </label>
              <DaInput
                name="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="h-8 flex"
                inputClassName="h-6 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium">
                Component <span className="text-red-500">*</span>
              </label>
              <DaInput
                name="component"
                value={formData.component}
                onChange={(e) => handleInputChange('component', e.target.value)}
                className="h-8 flex"
                inputClassName="h-6 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium">
                Description <span className="text-red-500">*</span>
              </label>
              <DaInput
                name="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                className="h-8 flex"
                inputClassName="h-6 text-xs"
              />
            </div>
            {customAttributes.length > 0 &&
              customAttributes.map((key) => (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-xs capitalize">
                      {key}
                    </label>
                    <TbTrash
                      onClick={() => handleRemoveCustomAttribute(key)}
                      className="size-3.5 text-xs mr-1 text-gray-300 hover:text-red-500 cursor-pointer"
                    />
                  </div>
                  <DaInput
                    name={key}
                    value={formData[key] as string}
                    onChange={(e) =>
                      handleInputChange(key as keyof FormData, e.target.value)
                    }
                    className="h-8 flex"
                    inputClassName="h-6 text-xs"
                  />
                </div>
              ))}
            <div className="flex justify-between items-center">
              <DaButton
                type="button"
                size="sm"
                variant="dash"
                className="text-da-primary-500 !text-xs w-full"
                onClick={handleAddCustomAttribute}
              >
                <TbPlus className="size-4 mr-1" />
                Add Custom Attribute
              </DaButton>
            </div>
          </div>
          {/* Right Column: Risk Assessment Section */}
          <div className="flex flex-col w-1/2 h-full overflow-y-auto gap-2">
            <div className="flex items-end justify-between">
              <div className="font-medium">Risk Assessment</div>
              {isEvaluating ? (
                <DaButton
                  size="sm"
                  variant="plain"
                  className="!text-xs !h-6 -mb-1 "
                >
                  <TbLoader2 className="size-3.5 mr-1.5 animate-spin text-da-primary-500" />
                  Evaluating for
                  <span className="ml-1 w-[30px]">
                    {evaluationTime.toFixed(1)}
                  </span>
                  s
                </DaButton>
              ) : isEvaluated ? (
                <div className="flex">
                  <DaButton
                    size="sm"
                    variant="plain"
                    onClick={handleReject}
                    className="!text-xs !h-6 -mb-1"
                  >
                    <TbX className="size-3.5 mr-1.5 text-red-500" />
                    Reject
                  </DaButton>
                  <DaButton
                    size="sm"
                    variant="plain"
                    onClick={handleApprove}
                    className="!text-xs !h-6 -mb-1"
                  >
                    <TbCheck className="size-3.5 mr-1.5 text-green-500" />
                    Approve
                  </DaButton>
                </div>
              ) : (
                <DaButton
                  size="sm"
                  variant="plain"
                  className="!text-xs !h-6 -mb-1"
                  onClick={generateRiskAssessment}
                >
                  <TbTextScan2 className="size-3.5 mr-1.5 text-da-primary-500" />
                  Evaluate with AI
                </DaButton>
              )}
            </div>
            <div className="flex flex-col h-full overflow-y-auto border border-dashed rounded-lg py-2 pl-2 border-da-primary-500">
              <div className="flex h-full overflow-auto scroll-gray pr-1">
                <ReactMarkdown
                  className="markdown-content text-muted-foreground text-xs max-w-none"
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xs font-semibold tracking-tight text-da-primary-500 mb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xs font-semibold text-da-gray-dark mb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xs font-medium text-da-gray-medium mb-2">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-muted-foreground mb-4">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc mb-2 space-y-2 ml-6">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-medium">{children}</strong>
                    ),
                  }}
                >
                  {markdownContent}
                </ReactMarkdown>
              </div>
            </div>
            <div className="flex w-full items-center gap-2 my-2">
              <div className="flex w-full flex-col items-center">
                <label className="text-xs font-medium mb-1.5">
                  Pre-Mitigation ASIL Rating
                </label>
                <ASILSelect
                  value={formData.preAsilLevel}
                  onChange={(value) => handleInputChange('preAsilLevel', value)}
                />
              </div>
              <TbChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex w-full flex-col items-center">
                <label className="text-xs font-medium mb-1.5">
                  Post-Mitigation ASIL Rating
                </label>
                <ASILSelect
                  value={formData.postAsilLevel}
                  onChange={(value) =>
                    handleInputChange('postAsilLevel', value)
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <div className="grow" />
        <div className="flex justify-end items-center gap-1 mt-4">
          {formData.approvedBy && formData.approvedAt ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center mt-2">
                <div className="p-0.5 w-fit items-center justify-center flex rounded bg-da-primary-100 mr-1">
                  <TbCheck className="size-3.5 text-da-primary-500" />
                </div>
                Approved by{' '}
                <span className="ml-1 font-medium">{formData.approvedBy}</span>
              </div>
              <div className="flex items-center mt-2">
                <div className="p-0.5 w-fit items-center justify-center flex rounded bg-da-primary-100 mr-1">
                  <TbCalendarEvent className="size-3.5 text-da-primary-500" />
                </div>
                Date{' '}
                <span className="ml-1 font-medium">
                  {new Date(formData.approvedAt).toLocaleString()}
                </span>
              </div>
            </div>
          ) : null}
          <div className="grow" />
          <DialogClose asChild>
            <DaButton variant="outline-nocolor" size="sm">
              Cancel
            </DaButton>
          </DialogClose>
          <DialogClose asChild>
            <DaButton size="sm" onClick={handleSubmit}>
              Confirm Change
            </DaButton>
          </DialogClose>
        </div>
      </div>
    </CustomDialog>
  )
}

export default FlowItemEditor
