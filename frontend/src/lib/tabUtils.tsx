// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { ReactNode } from 'react'
import DOMPurify from 'dompurify'
import { TabConfig, TabsBorderRadius } from '@/components/organisms/CustomTabEditor'
import { cn } from '@/lib/utils'

/** Get Tailwind border-radius class from TabsBorderRadius value */
export const getBorderRadiusClass = (radius: TabsBorderRadius | undefined): string => {
    switch (radius) {
        case 'none':
            return 'rounded-none'
        case 'full':
            return 'rounded-full'
        case 'round':
        default:
            return 'rounded-md'
    }
}

/** Render a tab icon: use custom SVG if present, otherwise fall back to the default icon node. */
export const renderTabIcon = (tabConfig: TabConfig, defaultIcon: ReactNode): ReactNode => {
    if (tabConfig.iconSvg) {
        return (
            <span
                className="w-5 h-5 mr-2 shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tabConfig.iconSvg, { USE_PROFILES: { svg: true, svgFilters: true } }) }}
            />
        )
    }
    return defaultIcon
}

/** Compute class names for an active/inactive/disabled tab button based on the global tabsVariant and border radius. */
export const tabItemClasses = (variant: string | undefined, isActive: boolean, disabled?: boolean, borderRadius?: TabsBorderRadius): string => {
    const radiusClass = getBorderRadiusClass(borderRadius)

    switch (variant) {
        case 'primary':
            return cn(
                `flex items-center self-center px-3 py-1.5 ${radiusClass} text-sm font-semibold mx-1 cursor-pointer transition-colors`,
                isActive
                    ? 'bg-primary text-primary-foreground'
                    : disabled
                        ? 'text-muted-foreground/30 cursor-default pointer-events-none'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )
        case 'outline':
            return cn(
                `flex items-center self-center px-3 py-1.5 ${radiusClass} text-sm font-semibold mx-1 cursor-pointer border transition-colors`,
                isActive
                    ? 'border-primary text-primary'
                    : disabled
                        ? 'border-transparent text-muted-foreground/30 cursor-default pointer-events-none'
                        : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
            )
        case 'ghost':
            return cn(
                `flex items-center self-center px-3 py-1.5 ${radiusClass} text-sm font-semibold mx-1 cursor-pointer transition-colors`,
                isActive
                    ? 'bg-accent text-foreground'
                    : disabled
                        ? 'text-muted-foreground/30 cursor-default pointer-events-none'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )
        default: // 'tab'
            return cn(
                'flex h-full text-sm font-semibold items-center justify-center min-w-20 border-b-2 px-4 py-1 transition-colors',
                isActive
                    ? 'text-primary border-primary'
                    : disabled
                        ? 'text-muted-foreground/30 border-transparent cursor-default'
                        : 'text-muted-foreground border-transparent hover:opacity-80',
            )
    }
}
