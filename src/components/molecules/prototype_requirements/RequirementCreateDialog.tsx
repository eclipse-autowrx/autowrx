// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// src/molecules/prototype_requirements/RequirementCreateDialog.tsx
import React, { useState, useEffect } from 'react'
import CustomDialog from '../flow/CustomDialog'
import { useRequirementStore } from './hook/useRequirementStore'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { Requirement } from '@/types/model.type'
import useAuthStore from '@/stores/authStore'
import { DaTextarea } from '@/components/atoms/DaTextarea'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (req: Requirement) => void
}

const RequirementCreateDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  onCreate,
}) => {
  const addRequirement = useRequirementStore((s) => s.addRequirement)

  // form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<Requirement['type']>(
    'Functional Requirement',
  )
  const [sourceType, setSourceType] =
    useState<Requirement['source']['type']>('external')
  const [sourceLink, setSourceLink] = useState('')
  const [priority, setPriority] = useState(1)
  const [relevance, setRelevance] = useState(1)
  const [impact, setImpact] = useState(1)
  const user = useAuthStore((s) => s.user)

  const setLimitedPriority = (value: number) =>
    setPriority(Math.min(5, Math.max(1, value)))
  const setLimitedRelevance = (value: number) =>
    setRelevance(Math.min(5, Math.max(1, value)))
  const setLimitedImpact = (value: number) =>
    setImpact(Math.min(5, Math.max(1, value)))

  // reset every time we open
  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setType('Functional Requirement')
      setSourceType('external')
      setSourceLink('')
      setPriority(1)
      setRelevance(1)
      setImpact(1)
    }
  }, [open])

  const handleCreate = () => {
    const newReq: Requirement = {
      id: `req-${Date.now()}`,
      title,
      description,
      type,
      source: { type: sourceType, link: sourceLink },
      rating: { priority, relevance, impact },
      creatorUserId: user?.id || 'unknown',
    }
    onCreate(newReq)
    onOpenChange(false)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      dialogTitle="Create New Requirement"
      className="h-fit w-[90vw] max-w-md"
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        {/* Title */}
        <DaInput
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          labelClassName="!text-sm font-medium"
          inputClassName="!text-sm"
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium">Description</label>
          <DaTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-0.5 mt-1"
            textareaClassName="!text-sm"
          />
        </div>

        {/* Type & Creator */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Requirement['type'])}
              className="mt-1 block w-full border p-2 rounded-md focus:outline-none text-sm"
            >
              <option>Functional Requirement</option>
              <option>System Integration Requirement</option>
              <option>Safety & Security Requirement</option>
              <option>User Experience Requirement</option>
              <option>Regulatory & Homologation Requirement</option>
              <option>Operational Requirement</option>
              <option>Deployment & Ecosystem Requirement</option>
            </select>
          </div>
        </div>

        {/* Source */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Source Type</label>
            <select
              value={sourceType}
              onChange={(e) =>
                setSourceType(e.target.value as Requirement['source']['type'])
              }
              className="mt-1 block w-full border p-2 rounded-md focus:outline-none text-sm"
            >
              <option value="external">External</option>
              <option value="internal">Internal</option>
            </select>
          </div>
          <DaInput
            label="Source Link"
            type="text"
            value={sourceLink}
            onChange={(e) => setSourceLink(e.target.value)}
            labelClassName="!text-sm font-medium"
            inputClassName="!text-sm"
          />
        </div>

        {/* Ratings */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Priority', value: priority, setter: setLimitedPriority },
            {
              label: 'Relevance',
              value: relevance,
              setter: setLimitedRelevance,
            },
            { label: 'Impact', value: impact, setter: setLimitedImpact },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <DaInput
                label={label}
                type="number"
                min={1}
                max={5}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                labelClassName="!text-sm font-medium"
              />
              <span className="text-xs text-gray-500">Range: 1-5</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex h-full items-end justify-end space-x-2 ">
          <DaButton
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </DaButton>
          <DaButton variant="solid" size="sm" onClick={handleCreate}>
            Create
          </DaButton>
        </div>
      </div>
    </CustomDialog>
  )
}

export default RequirementCreateDialog
