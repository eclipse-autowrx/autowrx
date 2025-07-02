// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { DaText } from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import { TbArrowRight } from 'react-icons/tb'
import { cn } from '@/lib/utils'
import { FaCar } from 'react-icons/fa'

interface CardActionProps {
  title: string
  content: string
  onClick?: () => void
  className?: string
  icon?: React.ReactNode
}

const DaActionCard = ({
  title,
  content,
  onClick,
  className,
  icon,
}: CardActionProps) => {
  return (
    <div
      className={cn(
        `flex p-4 w-full rounded-lg border border-da-gray-light items-center space-x-4 bg-da-gray-light/25 hover:bg-da-gray-light/50 cursor-pointer`,
        className,
      )}
      onClick={onClick}
    >
      {icon && (
        <div className="p-2 rounded-full bg-da-primary-300/25">{icon}</div>
      )}
      <div className="flex flex-col">
        <DaText variant="regular-bold" className="text-da-gray-dark">
          {title}
        </DaText>
        <DaText variant="small" className=" text-gray-500">
          {content}
        </DaText>
      </div>
    </div>
  )
}

export { DaActionCard }
