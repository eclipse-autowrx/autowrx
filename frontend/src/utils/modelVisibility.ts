// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { ModelVisibility } from '@/types/model.type'

const MODEL_TEMPLATE_VISIBILITIES = new Set<ModelVisibility>(['public', 'private', 'editable'])

/** Map a model template's visibility to a valid model visibility (defaults to private). */
export const visibilityFromModelTemplate = (
  template?: { visibility?: string } | null,
): ModelVisibility => {
  const visibility = template?.visibility
  if (visibility && MODEL_TEMPLATE_VISIBILITIES.has(visibility as ModelVisibility)) {
    return visibility as ModelVisibility
  }
  return 'private'
}

export const MODEL_VISIBILITY_OPTIONS: {
  value: ModelVisibility
  label: string
  description: string
}[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you and contributors can view this model.',
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can view; only you and contributors can add prototypes.',
  },
  {
    value: 'editable',
    label: 'Editable',
    description: 'Anyone can view; signed-in users can create prototypes on this model.',
  },
]

export const canCreatePrototypeOnModel = (
  model: { visibility?: string } | undefined,
  userId: string | undefined,
  hasWritePermission: boolean,
) => hasWritePermission || (!!userId && model?.visibility === 'editable')
