// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import DaLoading from '../atoms/DaLoading'
import { DaText } from '../atoms/DaText'

interface DaLoadingWrapperProps {
  isLoading: boolean
  data: any
  loadingMessage: string
  emptyMessage: string
  timeoutMessage: string
  timeout?: number
  children: React.ReactNode
}

const DaLoadingWrapper = ({
  isLoading,
  data,
  loadingMessage,
  emptyMessage,
  timeoutMessage,
  timeout,
  children,
}: DaLoadingWrapperProps) => {
  return (
    <div className="flex flex-col w-full h-full items-center">
      {isLoading ? (
        <DaLoading
          text={loadingMessage}
          timeout={timeout}
          timeoutText={timeoutMessage}
          fullScreen={true}
        />
      ) : data?.length === 0 ? (
        <div className="flex items-center justify-center w-full h-full">
          <DaText variant="title" className="text-da-gray-medium">
            {emptyMessage}
          </DaText>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

export default DaLoadingWrapper
