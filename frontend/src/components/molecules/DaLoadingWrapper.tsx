// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import { Spinner } from '@/components/atoms/spinner'
import { DaText } from '@/components/atoms/DaText'

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
    children,
}: DaLoadingWrapperProps) => {
    return (
        <div className="flex flex-col w-full h-full items-center">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center w-full h-full gap-3 py-8">
                    <Spinner size={32} />
                    <DaText variant="regular" className="text-muted-foreground">
                        {loadingMessage}
                    </DaText>
                </div>
            ) : !data || data.length === 0 ? (
                <div className="flex items-center justify-center w-full h-full py-8">
                    <DaText variant="title" className="text-muted-foreground">
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
