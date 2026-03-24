// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react'
import { configManagementService } from '@/services/configManagement.service'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { Spinner } from '@/components/atoms/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select'
import { useToast } from '@/components/molecules/toaster/use-toast'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'

const HEADER_BACKGROUND_GRADIENT_KEY = 'HEADER_BACKGROUND_GRADIENT'
const HEADER_BUTTON_HOVER_BG_COLOR_KEY = 'HEADER_BUTTON_HOVER_BG_COLOR'

const DEFAULT_HEADER_BACKGROUND_GRADIENT = '#ffffff'
const DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR = '#dbe4ee'
const DEFAULT_GRADIENT_DIRECTION = '90deg'
const DEFAULT_GRADIENT_START_COLOR = '#ffffff'
const DEFAULT_GRADIENT_END_COLOR = '#ffffff'

const GRADIENT_DIRECTION_OPTIONS = [
    { value: '0deg', label: 'Top to Bottom (0deg)' },
    { value: '45deg', label: 'Diagonal (45deg)' },
    { value: '90deg', label: 'Left to Right (90deg)' },
    { value: '135deg', label: 'Diagonal (135deg)' },
    { value: '180deg', label: 'Bottom to Top (180deg)' },
    { value: '225deg', label: 'Diagonal (225deg)' },
    { value: '270deg', label: 'Right to Left (270deg)' },
    { value: '315deg', label: 'Diagonal (315deg)' },
] as const

const LIVE_COLOR_VARS = [
    { key: 'background', label: 'Background' },
    { key: 'foreground', label: 'Foreground' },
    { key: 'primary', label: 'Primary' },
    { key: 'primary-foreground', label: 'Primary text' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'muted', label: 'Muted' },
    { key: 'muted-foreground', label: 'Muted text' },
    { key: 'destructive', label: 'Destructive' },
    { key: 'border', label: 'Border' },
    { key: 'input', label: 'Input' },
] as const

const isHexColor = (value: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())

const parseLinearGradientParts = (value: string) => {
    const match = value
        .trim()
        .match(/^linear-gradient\(\s*([^,]+)\s*,\s*([^\s,\)]+)(?:\s+[\d.]+%?)?\s*,\s*([^\s,\)]+)(?:\s+[\d.]+%?)?\s*\)$/i)

    if (!match) {
        return null
    }

    const direction = match[1].trim()
    const start = match[2].trim()
    const end = match[3].trim()

    if (!isHexColor(start) || !isHexColor(end)) {
        return null
    }

    return {
        direction,
        startColor: start.toLowerCase(),
        endColor: end.toLowerCase(),
    }
}

const buildLinearGradient = (direction: string, startColor: string, endColor: string) => {
    if (startColor.trim().toLowerCase() === endColor.trim().toLowerCase()) {
        return startColor
    }
    return `linear-gradient(${direction}, ${startColor} 0%, ${endColor} 100%)`
}

const HeaderStyleConfigSection: React.FC = () => {
    const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
    const { toast } = useToast()

    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isRestoringDefault, setIsRestoringDefault] = useState(false)

    const [headerBackgroundGradient, setHeaderBackgroundGradient] = useState(
        DEFAULT_HEADER_BACKGROUND_GRADIENT,
    )
    const [gradientDirection, setGradientDirection] = useState(DEFAULT_GRADIENT_DIRECTION)
    const [gradientStartColor, setGradientStartColor] = useState(DEFAULT_GRADIENT_START_COLOR)
    const [gradientEndColor, setGradientEndColor] = useState(DEFAULT_GRADIENT_END_COLOR)
    const [headerButtonHoverBgColor, setHeaderButtonHoverBgColor] = useState(
        DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR,
    )
    const [originalHeaderBackgroundGradient, setOriginalHeaderBackgroundGradient] =
        useState(DEFAULT_HEADER_BACKGROUND_GRADIENT)
    const [originalHeaderButtonHoverBgColor, setOriginalHeaderButtonHoverBgColor] =
        useState(DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR)

    useEffect(() => {
        if (selfLoading || !self) return
        loadConfigs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selfLoading, !!self])

    useEffect(() => {
        setHeaderBackgroundGradient(
            buildLinearGradient(gradientDirection, gradientStartColor, gradientEndColor),
        )
    }, [gradientDirection, gradientStartColor, gradientEndColor])

    const getSafeBackgroundValue = (value: string) => {
        const trimmed = (value || '').trim()
        if (!trimmed) return DEFAULT_HEADER_BACKGROUND_GRADIENT
        if (typeof CSS !== 'undefined' && CSS.supports('background', trimmed)) {
            return trimmed
        }
        return DEFAULT_HEADER_BACKGROUND_GRADIENT
    }

    const getSafeHoverColorValue = (value: string) => {
        const trimmed = (value || '').trim()
        if (!trimmed) return DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR
        if (typeof CSS !== 'undefined' && CSS.supports('color', trimmed)) {
            return trimmed
        }
        return DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR
    }

    const loadConfigs = async () => {
        try {
            setIsLoading(true)

            const res = await configManagementService.getConfigs({
                secret: false,
                scope: 'site',
                limit: 100,
            })

            const existing = res.results || []
            const byKey = new Map(existing.map((cfg) => [cfg.key, cfg]))

            const missingConfigs: any[] = []
            if (!byKey.has(HEADER_BACKGROUND_GRADIENT_KEY)) {
                missingConfigs.push({
                    key: HEADER_BACKGROUND_GRADIENT_KEY,
                    scope: 'site',
                    value: DEFAULT_HEADER_BACKGROUND_GRADIENT,
                    secret: false,
                    valueType: 'string',
                    description:
                        'CSS background value used for the application header. Example: #ffffff or linear-gradient(90deg, #f8fafc 0%, #e2e8f0 100%).',
                })
            }
            if (!byKey.has(HEADER_BUTTON_HOVER_BG_COLOR_KEY)) {
                missingConfigs.push({
                    key: HEADER_BUTTON_HOVER_BG_COLOR_KEY,
                    scope: 'site',
                    value: DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR,
                    secret: false,
                    valueType: 'color',
                    description: 'Background color used when hovering header action buttons.',
                })
            }

            if (missingConfigs.length > 0) {
                await configManagementService.bulkUpsertConfigs({ configs: missingConfigs })
            }

            const backgroundRaw = byKey.get(HEADER_BACKGROUND_GRADIENT_KEY)?.value
            const hoverRaw = byKey.get(HEADER_BUTTON_HOVER_BG_COLOR_KEY)?.value

            const backgroundValue =
                typeof backgroundRaw === 'string' && backgroundRaw.trim()
                    ? backgroundRaw
                    : DEFAULT_HEADER_BACKGROUND_GRADIENT
            const hoverValue =
                typeof hoverRaw === 'string' && hoverRaw.trim()
                    ? hoverRaw
                    : DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR

            setHeaderBackgroundGradient(backgroundValue)
            setOriginalHeaderBackgroundGradient(backgroundValue)
            setHeaderButtonHoverBgColor(hoverValue)
            setOriginalHeaderButtonHoverBgColor(hoverValue)

            const parsedGradient = parseLinearGradientParts(backgroundValue)
            if (parsedGradient) {
                setGradientDirection(parsedGradient.direction)
                setGradientStartColor(parsedGradient.startColor)
                setGradientEndColor(parsedGradient.endColor)
            } else {
                setGradientDirection(DEFAULT_GRADIENT_DIRECTION)
                setGradientStartColor(DEFAULT_GRADIENT_START_COLOR)
                setGradientEndColor(DEFAULT_GRADIENT_END_COLOR)
            }
        } catch (err) {
            toast({
                title: 'Load failed',
                description:
                    err instanceof Error ? err.message : 'Failed to load header style configs',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const hasChanged = () => {
        return (
            headerBackgroundGradient !== originalHeaderBackgroundGradient ||
            headerButtonHoverBgColor !== originalHeaderButtonHoverBgColor
        )
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)

            const nextBackground = headerBackgroundGradient.trim()
            const nextHoverBg = headerButtonHoverBgColor.trim()

            await configManagementService.updateConfigByKey(HEADER_BACKGROUND_GRADIENT_KEY, {
                value: nextBackground,
            })
            await configManagementService.updateConfigByKey(HEADER_BUTTON_HOVER_BG_COLOR_KEY, {
                value: nextHoverBg,
            })

            pushSiteConfigEdit({
                key: HEADER_BACKGROUND_GRADIENT_KEY,
                valueBefore: originalHeaderBackgroundGradient,
                valueAfter: nextBackground,
                valueType: 'string',
                section: 'public',
            })
            pushSiteConfigEdit({
                key: HEADER_BUTTON_HOVER_BG_COLOR_KEY,
                valueBefore: originalHeaderButtonHoverBgColor,
                valueAfter: nextHoverBg,
                valueType: 'color',
                section: 'public',
            })

            setOriginalHeaderBackgroundGradient(nextBackground)
            setOriginalHeaderButtonHoverBgColor(nextHoverBg)

            toast({
                title: 'Saved',
                description: 'Header style updated. Reloading page...',
            })

            setTimeout(() => {
                window.location.reload()
            }, 800)
        } catch (err) {
            toast({
                title: 'Save failed',
                description:
                    err instanceof Error ? err.message : 'Failed to save header style',
                variant: 'destructive',
            })
            setIsSaving(false)
        }
    }

    const handleRestoreDefault = async () => {
        if (!window.confirm('Restore header style to default values?')) return

        try {
            setIsRestoringDefault(true)

            await configManagementService.updateConfigByKey(HEADER_BACKGROUND_GRADIENT_KEY, {
                value: DEFAULT_HEADER_BACKGROUND_GRADIENT,
            })
            await configManagementService.updateConfigByKey(HEADER_BUTTON_HOVER_BG_COLOR_KEY, {
                value: DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR,
            })

            pushSiteConfigEdit({
                key: HEADER_BACKGROUND_GRADIENT_KEY,
                valueBefore: originalHeaderBackgroundGradient,
                valueAfter: DEFAULT_HEADER_BACKGROUND_GRADIENT,
                valueType: 'string',
                section: 'public',
            })
            pushSiteConfigEdit({
                key: HEADER_BUTTON_HOVER_BG_COLOR_KEY,
                valueBefore: originalHeaderButtonHoverBgColor,
                valueAfter: DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR,
                valueType: 'color',
                section: 'public',
            })

            setHeaderBackgroundGradient(DEFAULT_HEADER_BACKGROUND_GRADIENT)
            setHeaderButtonHoverBgColor(DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR)
            setOriginalHeaderBackgroundGradient(DEFAULT_HEADER_BACKGROUND_GRADIENT)
            setOriginalHeaderButtonHoverBgColor(DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR)

            setGradientDirection(DEFAULT_GRADIENT_DIRECTION)
            setGradientStartColor(DEFAULT_GRADIENT_START_COLOR)
            setGradientEndColor(DEFAULT_GRADIENT_END_COLOR)

            toast({
                title: 'Restored',
                description: 'Header style restored to defaults. Reloading page...',
            })

            setTimeout(() => {
                window.location.reload()
            }, 800)
        } catch (err) {
            toast({
                title: 'Restore failed',
                description:
                    err instanceof Error ? err.message : 'Failed to restore header style',
                variant: 'destructive',
            })
            setIsRestoringDefault(false)
        }
    }

    const safePreviewHeaderBackground = getSafeBackgroundValue(
        headerBackgroundGradient,
    )
    const safePreviewHeaderHoverBg = getSafeHoverColorValue(
        headerButtonHoverBgColor,
    )

    return (
        <>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-foreground">Header Style</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Customize app header background and hover styling with a live preview
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestoreDefault}
                        disabled={isLoading || isSaving || isRestoringDefault}
                    >
                        {isRestoringDefault ? 'Restoring...' : 'Restore Default'}
                    </Button>
                    {hasChanged() && (
                        <Button size="sm" onClick={handleSave} disabled={isSaving || isLoading}>
                            {isSaving ? 'Saving...' : 'Save Header Style'}
                        </Button>
                    )}
                </div>
            </div>

            <div className="p-6">
                {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <Spinner />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="rounded-lg border border-border overflow-hidden">
                            <div
                                className="px-4 py-3 border-b border-border flex items-center justify-between gap-3"
                                style={{ background: safePreviewHeaderBackground }}
                            >
                                <span className="text-sm font-semibold text-foreground">
                                    Header Preview
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = safePreviewHeaderHoverBg
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent'
                                        }}
                                    >
                                        Action
                                    </button>
                                    <button
                                        type="button"
                                        className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = safePreviewHeaderHoverBg
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent'
                                        }}
                                    >
                                        Tools
                                    </button>
                                </div>
                            </div>
                            <div className="px-4 py-3 bg-background">
                                <p className="text-xs text-muted-foreground">
                                    Invalid CSS values automatically fall back to safe defaults in preview and runtime.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Gradient Direction</Label>
                                <Select
                                    value={gradientDirection}
                                    onValueChange={setGradientDirection}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select direction" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GRADIENT_DIRECTION_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gradient-start-color">Gradient Start Color</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            id="gradient-start-color"
                                            value={gradientStartColor}
                                            onChange={(e) => setGradientStartColor(e.target.value)}
                                            placeholder="#ffffff"
                                        />
                                        <Input
                                            type="color"
                                            value={isHexColor(gradientStartColor) ? gradientStartColor : DEFAULT_GRADIENT_START_COLOR}
                                            onChange={(e) => setGradientStartColor(e.target.value)}
                                            className="w-16 p-1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gradient-end-color">Gradient End Color</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            id="gradient-end-color"
                                            value={gradientEndColor}
                                            onChange={(e) => setGradientEndColor(e.target.value)}
                                            placeholder="#ffffff"
                                        />
                                        <Input
                                            type="color"
                                            value={isHexColor(gradientEndColor) ? gradientEndColor : DEFAULT_GRADIENT_END_COLOR}
                                            onChange={(e) => setGradientEndColor(e.target.value)}
                                            className="w-16 p-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="header-hover-bg-color">Header Button Hover Background</Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        id="header-hover-bg-color"
                                        value={headerButtonHoverBgColor}
                                        onChange={(e) => setHeaderButtonHoverBgColor(e.target.value)}
                                        placeholder="#dbe4ee"
                                    />
                                    <Input
                                        type="color"
                                        value={safePreviewHeaderHoverBg}
                                        onChange={(e) => setHeaderButtonHoverBgColor(e.target.value)}
                                        className="w-16 p-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="header-background-gradient">Generated Gradient CSS</Label>
                                <Input
                                    id="header-background-gradient"
                                    value={headerBackgroundGradient}
                                    onChange={(e) => setHeaderBackgroundGradient(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default HeaderStyleConfigSection
