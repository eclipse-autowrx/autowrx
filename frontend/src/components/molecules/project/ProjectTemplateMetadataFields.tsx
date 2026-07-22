// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { Label } from '@/components/atoms/label'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'

export interface ProjectTemplateMetadataFieldsProps {
  name: string
  description: string
  visibility?: 'public' | 'private'
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onVisibilityChange?: (value: 'public' | 'private') => void
  nameAutoFocus?: boolean
  descriptionRows?: number
  layout?: 'stacked' | 'split'
  showVisibility?: boolean
}

export default function ProjectTemplateMetadataFields({
  name,
  description,
  visibility,
  onNameChange,
  onDescriptionChange,
  onVisibilityChange,
  nameAutoFocus = false,
  descriptionRows = 2,
  layout = 'stacked',
  showVisibility = true,
}: ProjectTemplateMetadataFieldsProps) {
  const nameField = (
    <div className="space-y-2">
      <Label>Name *</Label>
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Template name"
        autoFocus={nameAutoFocus}
      />
    </div>
  )

  const descriptionField = (
    <div className="space-y-2">
      <Label>Description</Label>
      <Textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Short description"
        rows={descriptionRows}
      />
    </div>
  )

  const visibilityField = (
    <div className="space-y-2">
      <Label>Visibility</Label>
      <DaSelect
        value={visibility}
        onValueChange={(v) => onVisibilityChange(v as 'public' | 'private')}
        className="h-9 text-sm"
      >
        <DaSelectItem value="public">public</DaSelectItem>
        <DaSelectItem value="private">private</DaSelectItem>
      </DaSelect>
    </div>
  )

  if (layout === 'split') {
    return (
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">{nameField}</div>
        <div className="flex-1">{descriptionField}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {nameField}
      {descriptionField}
      {showVisibility && visibility != null && onVisibilityChange && visibilityField}
    </div>
  )
}
