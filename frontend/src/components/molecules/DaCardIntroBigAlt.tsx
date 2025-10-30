// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardIntroProps {
  title: string
  content: string
  children?: ReactNode
}

const DaCardIntroBig = ({ title, content, children }: CardIntroProps) => {
  return (
    <div
      className={clsx(
        'flex flex-col min-h-28 w-full h-full bg-background rounded-lg border p-4 select-none',
      )}
    >
      <div className="flex w-full items-center space-x-2">
        <h3 className="text-lg font-semibold text-primary w-full min-h-8">
          {title}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{content}</p>
      <div className="grow"></div>
      <div className="mt-4 lg:mt-3">{children}</div>
    </div>
  )
}

export { DaCardIntroBig }
