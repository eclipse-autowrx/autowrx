// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { cn } from '@/lib/utils'

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
        'flex p-4 w-full rounded-lg border border-input items-center space-x-4 bg-muted/25 hover:bg-muted/50 cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {icon && <div className="p-2 rounded-full bg-primary/10">{icon}</div>}
      <div className="flex flex-col">
        <p className="text-base font-semibold text-primary">{title}</p>
        <p className="text-sm text-muted-foreground">{content}</p>
      </div>
    </div>
  )
}

export { DaActionCard }
