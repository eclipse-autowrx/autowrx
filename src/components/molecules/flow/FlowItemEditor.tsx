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
  TbPlus,
  TbTrash,
  TbChevronRight,
  TbTextScan2,
  TbX,
} from 'react-icons/tb'
import { BsStars } from 'react-icons/bs'

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
  [key: string]: string
}

const FlowItemEditor = ({ value, onChange, children }: FlowItemEditorProps) => {
  const [formData, setFormData] = useState<FormData>(() => {
    try {
      const parsed = JSON.parse(value)
      // Destructure the fields to remove 'asilLevel' from the rest
      const { asilLevel, preAsilLevel, postAsilLevel, ...rest } = parsed

      // Use 'asilLevel' as a fallback for preAsilLevel
      const newPreAsilLevel = preAsilLevel || 'QM'
      const newPostAsilLevel = postAsilLevel || asilLevel || 'QM'

      return {
        type: parsed.type || '',
        component: parsed.component || '',
        description: parsed.description || '',
        preAsilLevel: newPreAsilLevel,
        postAsilLevel: newPostAsilLevel,
        ...rest, // Spread the rest of the properties except asilLevel
      }
    } catch {
      return {
        type: '',
        component: '',
        description: '',
        preAsilLevel: 'QM',
        postAsilLevel: 'QM',
      }
    }
  })

  // Mandatory keys that are always rendered separately
  const mandatoryKeys = [
    'type',
    'component',
    'description',
    'preAsilLevel',
    'postAsilLevel',
  ]

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

  // Function to add a new custom attribute.
  const handleAddCustomAttribute = () => {
    const attributeName = prompt('Enter custom attribute name:')
    if (attributeName && !formData.hasOwnProperty(attributeName)) {
      setFormData((prev) => ({ ...prev, [attributeName]: '' }))
    }
  }

  // Function to remove a custom attribute.
  const handleRemoveCustomAttribute = (attributeName: string) => {
    setFormData((prev) => {
      const newData = { ...prev }
      delete newData[attributeName]
      return newData
    })
  }

  // Markdown content (could later be replaced with a variable)
  const markdownContent = `
# Hazards

- The driver door opens unintentionally while the vehicle is in motion.
- The door creates an obstacle for approaching vehicles, cyclists, or pedestrians.
- The door fails to remain securely closed during dynamic driving or emergency maneuvers.
- Passenger ejection becomes a risk if the door opens during high-speed motion.

# Mitigations

- **Speed-Based Interlocks:** Prevent the door from opening when the vehicle is moving above a safe threshold (e.g., 5 km/h).
- **Environmental Sensing:** Use radar, ultrasonic, or cameras to detect approaching vehicles, cyclists, or pedestrians and restrict door opening if hazards are detected.
- **Redundant Locking Mechanisms:** Ensure the door remains securely latched even in the event of a primary lock failure.
- **Fail-Safe Design:** Default the door to a locked state during hardware or software malfunctions.
- **Audible and Visual Warnings:** Provide clear alerts if the door is not properly latched or is attempting to open unsafely.
- **User Override Restrictions:** Allow manual override only under safe conditions (e.g., vehicle is stationary, and no nearby hazards are detected).
- **Robust Testing:** Perform rigorous validation of software and hardware for reliability and robustness under all operational scenarios.

# Risk Classification (Post-Mitigation)

The severity, exposure, and controllability are re-evaluated based on the implemented mitigations:

## Severity (S)
- **Pre-Mitigation:** S2-S3 (risk of severe injury or fatality due to collisions or passenger ejection).
- **Post-Mitigation:** S1-S2 (risk is reduced due to mitigations like interlocks and environmental awareness).

## Exposure (E)
- **Pre-Mitigation:** E2-E3 (likely to occur in urban or congested environments with frequent door usage).
- **Post-Mitigation:** E1-E2 (exposure is reduced as mitigations prevent hazardous conditions from arising).

## Controllability (C)
- **Pre-Mitigation:** C2-C3 (limited ability for the driver or others to react quickly to an open door hazard).
- **Post-Mitigation:** C1-C2 (improved controllability due to driver alerts, restricted functionality, and redundant locks).

# ASIL Rating (enum)

Based on the revised risk classification, the ASIL rating is lower post-mitigation:
- **Pre-Mitigation:** ASIL B-C, due to higher risks from unintended door opening.
- **Post-Mitigation:** QM or ASIL A, depending on residual risks:
  - **QM:** If mitigations reduce risks to negligible levels, such as limiting functionality to stationary conditions.
  - **ASIL A:** If minor residual risks remain, such as rare edge cases in low-speed scenarios.

# Safety Goals

- **Prevent Door Opening at Unsafe Speeds:** Ensure the door cannot open when the vehicle is moving above a safe speed threshold (e.g., 5 km/h).
- **Restrict Operation in Hazardous Scenarios:** Prevent the door from opening when environmental sensors detect approaching vehicles, cyclists, or pedestrians.
- **Ensure Door Securement:** Implement redundant locking mechanisms to ensure the door remains securely closed at all times.
- **Alert the Driver:** Provide clear visual and audible feedback if the door is improperly latched or an unsafe opening attempt is detected.
- **Fail-Safe Mechanisms:** Design the system to default to a locked state during any software or hardware malfunction.
- **Validate Safety Measures:** Conduct rigorous validation of all mitigations to ensure effectiveness under all operational conditions.
  `

  // Custom attributes: any key that is not one of the mandatory ones.
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

            {/* Custom Attributes Section */}
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
                    value={formData[key]}
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
              <DaButton
                size="sm"
                variant="plain"
                className="!text-xs !h-6 -mb-1"
              >
                <TbTextScan2 className="size-3.5 mr-1.5 text-da-primary-500" />{' '}
                Evaluate with AI
              </DaButton>
              {/* <div className="flex">
                <DaButton
                  size="sm"
                  variant="plain"
                  className="!text-xs !h-6 -mb-1 hover:bg-gray-100"
                >
                  <TbX className="size-3.5 mr-1.5 text-red-500" /> Reject
                </DaButton>
                <DaButton
                  size="sm"
                  variant="plain"
                  className="!text-xs !h-6 -mb-1 hover:bg-gray-100"
                >
                  <TbCheck className="size-3.5 mr-1.5 text-green-500" /> Approve
                </DaButton>
              </div> */}
            </div>
            {/* Markdown Risk Assessment */}
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

            {/* ASIL Ratings Row */}
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

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-1 mt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center mt-2">
              <div className="p-0.5 w-fit items-center justify-center flex rounded bg-da-primary-100 mr-1">
                <TbCheck className="size-3.5 text-da-primary-500" />
              </div>
              Approved by <span className="ml-1 font-medium">John Doe</span>
            </div>
            <div className="flex items-center mt-2">
              <div className="p-0.5 w-fit items-center justify-center flex rounded bg-da-primary-100 mr-1">
                <TbCalendarEvent className="size-3.5 text-da-primary-500" />
              </div>
              Date <span className="ml-1 font-medium">February 11, 2025</span>
            </div>
          </div>
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
