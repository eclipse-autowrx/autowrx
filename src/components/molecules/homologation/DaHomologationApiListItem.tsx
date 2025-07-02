// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { VehicleApi } from '@/types/model.type'
import { DaApiListItem } from '../DaApiList'
import clsx from 'clsx'
import DaCheckbox from '@/components/atoms/DaCheckbox'

type DaHomologationApiListItemProps = {
  isSelected: boolean
  api: VehicleApi
  onClick: () => void
  className: string
  isDisabled?: boolean
}

const DaHomologationApiListItem = ({
  isSelected,
  isDisabled,
  api,
  onClick,
  className,
}: DaHomologationApiListItemProps) => {
  return (
    <li
      onClick={onClick}
      className={clsx(
        'active:ring-2 cursor-pointer flex-1 flex min-w-0 ring-da-gray-light/40 ring-inset transition',
        isSelected ? 'bg-da-gray-light' : 'hover:bg-da-gray-light/40',
        className,
        isDisabled && 'pointer-events-none opacity-50',
      )}
    >
      <DaCheckbox
        className="pointer-events-none"
        label=""
        checked={isSelected}
        onChange={() => {}}
      />
      <div className="pointer-events-none flex-1 min-w-0">
        <DaApiListItem
          //   isSelected={isSelected}
          api={{
            ...api,
            name: api.name,
          }}
          onClick={(() => {}) as any}
        />
      </div>
    </li>
  )
}

export default DaHomologationApiListItem
