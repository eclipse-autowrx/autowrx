// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { DaText } from '../atoms/DaText'
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
        'flex flex-col min-h-28 w-full h-full bg-da-white rounded-lg border p-4 select-none',
      )}
    >
      <div className="flex w-full items-center space-x-2">
        <DaText variant="title" className="text-da-gray-dark w-full min-h-8">
          {title}
        </DaText>
      </div>
      <DaText variant="small" className=" text-da-gray-medium mt-2">
        {content}
      </DaText>
      <div className="flex-grow"></div>
      <div className="mt-4 lg:mt-3">{children}</div>
    </div>
  )
}

export { DaCardIntroBig }
