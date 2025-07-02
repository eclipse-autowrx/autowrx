// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import dashboard_templates from '@/data/dashboard_templates'
import clsx from 'clsx'
import { DaImage } from '../atoms/DaImage'
import DaText from '../atoms/DaText'
import { TbEdit } from 'react-icons/tb'
import { DaButton } from '../atoms/DaButton'

type DaDashboardTemplateProps = {
  selected?: boolean
  onClick?: () => void
  onEditClick?: () => void
  template: (typeof dashboard_templates)[0]
}
const DaDashboardTemplate = ({
  selected,
  onClick,
  onEditClick,
  template,
}: DaDashboardTemplateProps) => {
  return (
    <div className="group relative flex flex-col gap-2">
      <div
        onClick={onClick}
        className={clsx(
          'cursor-pointer rounded-xl border-2 border-da-gray-light hover:border-da-primary-500 overflow-hidden',
          selected && 'border-da-primary-500',
        )}
      >
        <DaImage
          src={template.image}
          className="aspect-[16/9] w-full object-cover hover:scale-110"
        />
      </div>

      <DaText
        variant="regular-medium"
        className={clsx(
          'w-full truncate',
          selected ? 'text-da-primary-500' : 'text-da-gray-medium/80',
        )}
      >
        {template.name}
      </DaText>

      {/* <DaButton
        onClick={onEditClick}
        className="absolute right-[6px] top-[6px] !hidden !h-9 !w-9 !rounded-full group-hover:!block"
        size="sm"
        variant="secondary"
      >
        <TbEdit className="h-5 w-5" />
      </DaButton> */}
    </div>
  )
}

export default DaDashboardTemplate
