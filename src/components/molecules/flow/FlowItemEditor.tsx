import React, { useState } from 'react'
import { ASILLevel, ASILBadge } from './ASILBadge'
import CustomDialog from './CustomDialog'
import { DialogClose } from '@/components/atoms/dialog'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import {
  DaSelect,
  DaSelectItem,
  SelectContent,
} from '@/components/atoms/DaSelect'
import { cn } from '@/lib/utils'
import { TbTextScan2 } from 'react-icons/tb'

interface FlowItemEditorProps {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}

interface FormData {
  type: string
  component: string
  description: string
  asilLevel: ASILLevel
  [key: string]: string
}

interface ASILSelectProps {
  value: ASILLevel
  onChange: (value: ASILLevel) => void
}

const ASILSelect = ({ value, onChange }: ASILSelectProps) => {
  const asilOptions = [
    { value: 'QM', description: 'Quality management, no safety impact' },
    { value: 'A', description: 'Lowest safety risk, minor injuries possible' },
    { value: 'B', description: 'Moderate risk, severe injuries unlikely' },
    {
      value: 'C',
      description: 'High risk, life-threatening injuries possible',
    },
    { value: 'D', description: 'Highest risk, potentially fatal accidents' },
  ] as const

  const handleValueChange = (newValue: string) => {
    onChange(newValue as ASILLevel)
  }

  return (
    <DaSelect
      className="h-9 rounded-md"
      value={value}
      onValueChange={handleValueChange}
      placeholderClassName="flex items-center"
    >
      {asilOptions.map((asil) => (
        <DaSelectItem
          className="flex w-full items-center px-4 "
          value={asil.value}
          key={asil.value}
        >
          <div className="flex items-center">
            <div
              className={cn(
                asil.value === 'QM' ? 'flex w-12 justify-center' : 'w-fit',
              )}
            >
              <ASILBadge
                level={asil.value}
                showBadge={true}
                showFullText={true}
                className="w-fit text-xs"
              />
            </div>
            <span className="text-xs text-gray-600 ml-4">
              {asil.description}
            </span>
          </div>
        </DaSelectItem>
      ))}
    </DaSelect>
  )
}

const FlowItemEditor = ({ value, onChange, children }: FlowItemEditorProps) => {
  const [formData, setFormData] = useState<FormData>(() => {
    try {
      return JSON.parse(value)
    } catch {
      return {
        type: '',
        component: '',
        description: '',
        asilLevel: 'QM',
      }
    }
  })

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

  return (
    <CustomDialog
      trigger={children}
      dialogTitle="Edit Flow Implementation"
      className="max-w-[500px] h-auto max-h-fit xl:h-fit"
    >
      <div className="flex flex-col gap-4 text-xs">
        <div className="flex flex-col gap-2">
          <label className="font-medium">Type:</label>
          <DaInput
            name="type"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="h-8 flex"
            inputClassName="h-6 text-xs"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Component:</label>
          <DaInput
            name="component"
            value={formData.component}
            onChange={(e) => handleInputChange('component', e.target.value)}
            className="h-8 flex"
            inputClassName="h-6 text-xs"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Description:</label>
          <DaInput
            name="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="h-8 flex"
            inputClassName="h-6 text-xs"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex w-full items-center justify-between">
            <label className="font-medium">ASIL Rating:</label>
            <DaButton
              variant="outline-nocolor"
              size="sm"
              className="!text-xs !h-6"
            >
              <TbTextScan2 className="size-3.5 mr-1 text-da-primary-500" />
              Evaluate with AI
            </DaButton>
          </div>
          <ASILSelect
            value={formData.asilLevel}
            onChange={(value) => handleInputChange('asilLevel', value)}
          />

          <div className="border border-dashed rounded-lg p-2 border-da-primary-500">
            <div className="text-da-primary-500">Risk Analysis Summary:</div>
            <div className="mt-1">
              A door malfunction in autonomous operation could lead to severe
              consequences (S3: life-threatening injuries), with moderate
              exposure (E3: regular operation) and limited controllability (C3:
              difficult to prevent). Following ISO 26262 parameters, this
              warrants ASIL-D classification due to the potential for
              uncontrolled vehicle access or egress during critical situations.
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
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
