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

interface CardIntroProps {
  title: string
  content: string
  buttonText: string
  onClick?: () => void
}

const DaCardIntroBig = ({
  title,
  content,
  buttonText,
  onClick,
}: CardIntroProps) => {
  return (
    <div
      className={`flex flex-col p-4 w-full bg-da-white rounded-lg border border-da-gray-light items-center justify-center min-h-[125px]`}
    >
      <div className="flex flex-col items-center">
        <DaText variant="sub-title" className="text-da-gray-medium ">
          {title}
        </DaText>
        <DaText variant="small" className="text-center text-gray-500 mt-2">
          {content}
        </DaText>
      </div>
      {/* <DaButton
        variant="outline-nocolor"
        className="flex w-fit !mt-auto"
        onClick={onClick}
      >
        {buttonText}
        <TbArrowRight className="ml-2 w-4 h-4" />
      </DaButton> */}
    </div>
  )
}

export { DaCardIntroBig }
