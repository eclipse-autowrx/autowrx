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
import { useSiteConfig } from '@/utils/siteConfig'

const HEADER_BACKGROUND_GRADIENT_KEY = 'HEADER_BACKGROUND_GRADIENT'
const HEADER_BUTTON_HOVER_BG_COLOR_KEY = 'HEADER_BUTTON_HOVER_BG_COLOR'
const HEADER_TEXT_COLOR_KEY = 'HEADER_TEXT_COLOR'
const HEADER_LOGO_HEIGHT_KEY = 'HEADER_LOGO_HEIGHT'
const HEADER_LOGO_FILTER_KEY = 'HEADER_LOGO_FILTER'

const DEFAULT_HEADER_BACKGROUND_GRADIENT = '#ffffff'
const DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR = '#dbe4ee'
const DEFAULT_HEADER_TEXT_COLOR = ''
const DEFAULT_HEADER_LOGO_HEIGHT = '28'
const DEFAULT_HEADER_LOGO_FILTER = ''
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

const CSS_VAR_OPTIONS = [
    { value: '', label: 'Custom value' },
    { value: 'var(--primary)', label: '--primary' },
    { value: 'var(--primary-foreground)', label: '--primary-foreground' },
    { value: 'var(--secondary)', label: '--secondary' },
    { value: 'var(--secondary-foreground)', label: '--secondary-foreground' },
    { value: 'var(--background)', label: '--background' },
    { value: 'var(--foreground)', label: '--foreground' },
    { value: 'var(--muted)', label: '--muted' },
    { value: 'var(--muted-foreground)', label: '--muted-foreground' },
    { value: 'var(--destructive)', label: '--destructive' },
    { value: 'var(--border)', label: '--border' },
    { value: 'var(--accent)', label: '--accent' },
] as const

const LOGO_FILTER_PRESETS = [
    { value: '', label: 'None' },
    { value: 'brightness(0) invert(1)', label: 'Invert to white' },
    { value: 'brightness(0)', label: 'Dark (brightness 0)' },
    { value: 'grayscale(1)', label: 'Grayscale' },
    { value: 'grayscale(1) brightness(0) invert(1)', label: 'Grayscale inverted' },
] as const

const isCssVar = (value: string) => /^var\(--[\w-]+\)$/.test(value.trim())

const isHexColor = (value: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())

const isValidColorValue = (value: string) => isHexColor(value) || isCssVar(value)

const parseLinearGradientParts = (value: string) => {
    const match = value
        .trim()
        .match(/^linear-gradient\(\s*([^,]+)\s*,\s*([^\s,)]+(?:\([^)]*\))?)(?:\s+[\d.]+%?)?\s*,\s*([^\s,)]+(?:\([^)]*\))?)(?:\s+[\d.]+%?)?\s*\)$/i)

    if (!match) {
        return null
    }

    const direction = match[1].trim()
    const start = match[2].trim()
    const end = match[3].trim()

    if (!isValidColorValue(start) || !isValidColorValue(end)) {
        return null
    }

    return {
        direction,
        startColor: start,
        endColor: end,
    }
}

const buildLinearGradient = (direction: string, startColor: string, endColor: string) => {
    if (startColor.trim().toLowerCase() === endColor.trim().toLowerCase()) {
        return startColor
    }
    return `linear-gradient(${direction}, ${startColor} 0%, ${endColor} 100%)`
}

const getCssVarSelection = (value: string) => {
    const match = CSS_VAR_OPTIONS.find((opt) => opt.value === value)
    return match ? match.value : ''
}

const isGradientValue = (value: string) => {
    return value.trim().startsWith('linear-gradient(')
}

const HeaderStyleConfigSection: React.FC = () => {
    const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
    const { toast } = useToast()
    const logoUrl = useSiteConfig('SITE_LOGO_WIDE', '/imgs/logo-wide.png')

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
    const [headerTextColor, setHeaderTextColor] = useState(DEFAULT_HEADER_TEXT_COLOR)
    const [headerLogoHeight, setHeaderLogoHeight] = useState(DEFAULT_HEADER_LOGO_HEIGHT)
    const [headerLogoFilter, setHeaderLogoFilter] = useState(DEFAULT_HEADER_LOGO_FILTER)

    const [originalHeaderBackgroundGradient, setOriginalHeaderBackgroundGradient] =
        useState(DEFAULT_HEADER_BACKGROUND_GRADIENT)
    const [originalHeaderButtonHoverBgColor, setOriginalHeaderButtonHoverBgColor] =
        useState(DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR)
    const [originalHeaderTextColor, setOriginalHeaderTextColor] = useState(DEFAULT_HEADER_TEXT_COLOR)
    const [originalHeaderLogoHeight, setOriginalHeaderLogoHeight] = useState(DEFAULT_HEADER_LOGO_HEIGHT)
    const [originalHeaderLogoFilter, setOriginalHeaderLogoFilter] = useState(DEFAULT_HEADER_LOGO_FILTER)

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
        if (isCssVar(trimmed)) return trimmed
        if (trimmed.includes('var(--')) return trimmed
        if (typeof CSS !== 'undefined' && CSS.supports('background', trimmed)) {
            return trimmed
        }
        return DEFAULT_HEADER_BACKGROUND_GRADIENT
    }

    const getSafeHoverColorValue = (value: string) => {
        const trimmed = (value || '').trim()
        if (!trimmed) return DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR
        if (isCssVar(trimmed)) return trimmed
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
                        'CSS background value used for the application header. Example: #ffffff or linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%).',
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
            if (!byKey.has(HEADER_TEXT_COLOR_KEY)) {
                missingConfigs.push({
                    key: HEADER_TEXT_COLOR_KEY,
                    scope: 'site',
                    value: DEFAULT_HEADER_TEXT_COLOR,
                    secret: false,
                    valueType: 'string',
                    description: 'Text color for the header. Supports CSS variables like var(--primary-foreground).',
                })
            }
            if (!byKey.has(HEADER_LOGO_HEIGHT_KEY)) {
                missingConfigs.push({
                    key: HEADER_LOGO_HEIGHT_KEY,
                    scope: 'site',
                    value: DEFAULT_HEADER_LOGO_HEIGHT,
                    secret: false,
                    valueType: 'string',
                    description: 'Logo height in pixels for the header logo.',
                })
            }
            if (!byKey.has(HEADER_LOGO_FILTER_KEY)) {
                missingConfigs.push({
                    key: HEADER_LOGO_FILTER_KEY,
                    scope: 'site',
                    value: DEFAULT_HEADER_LOGO_FILTER,
                    secret: false,
                    valueType: 'string',
                    description: 'CSS filter for the header logo. Example: brightness(0) invert(1).',
                })
            }

            if (missingConfigs.length > 0) {
                await configManagementService.bulkUpsertConfigs({ configs: missingConfigs })
            }

            const backgroundRaw = byKey.get(HEADER_BACKGROUND_GRADIENT_KEY)?.value
            const hoverRaw = byKey.get(HEADER_BUTTON_HOVER_BG_COLOR_KEY)?.value
            const textColorRaw = byKey.get(HEADER_TEXT_COLOR_KEY)?.value
            const logoHeightRaw = byKey.get(HEADER_LOGO_HEIGHT_KEY)?.value
            const logoFilterRaw = byKey.get(HEADER_LOGO_FILTER_KEY)?.value

            const backgroundValue =
                typeof backgroundRaw === 'string' && backgroundRaw.trim()
                    ? backgroundRaw
                    : DEFAULT_HEADER_BACKGROUND_GRADIENT
            const hoverValue =
                typeof hoverRaw === 'string' && hoverRaw.trim()
                    ? hoverRaw
                    : DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR
            const textColorValue =
                typeof textColorRaw === 'string' ? textColorRaw : DEFAULT_HEADER_TEXT_COLOR
            const logoHeightValue =
                typeof logoHeightRaw === 'string' && logoHeightRaw.trim()
                    ? logoHeightRaw
                    : DEFAULT_HEADER_LOGO_HEIGHT
            const logoFilterValue =
                typeof logoFilterRaw === 'string' ? logoFilterRaw : DEFAULT_HEADER_LOGO_FILTER

            setHeaderBackgroundGradient(backgroundValue)
            setOriginalHeaderBackgroundGradient(backgroundValue)
            setHeaderButtonHoverBgColor(hoverValue)
            setOriginalHeaderButtonHoverBgColor(hoverValue)
            setHeaderTextColor(textColorValue)
            setOriginalHeaderTextColor(textColorValue)
            setHeaderLogoHeight(logoHeightValue)
            setOriginalHeaderLogoHeight(logoHeightValue)
            setHeaderLogoFilter(logoFilterValue)
            setOriginalHeaderLogoFilter(logoFilterValue)

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
            headerButtonHoverBgColor !== originalHeaderButtonHoverBgColor ||
            headerTextColor !== originalHeaderTextColor ||
            headerLogoHeight !== originalHeaderLogoHeight ||
            headerLogoFilter !== originalHeaderLogoFilter
        )
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)

            const nextBackground = headerBackgroundGradient.trim()
            const nextHoverBg = headerButtonHoverBgColor.trim()
            const nextTextColor = headerTextColor.trim()
            const nextLogoHeight = headerLogoHeight.trim()
            const nextLogoFilter = headerLogoFilter.trim()

            await configManagementService.updateConfigByKey(HEADER_BACKGROUND_GRADIENT_KEY, {
                value: nextBackground,
            })
            await configManagementService.updateConfigByKey(HEADER_BUTTON_HOVER_BG_COLOR_KEY, {
                value: nextHoverBg,
            })
            await configManagementService.updateConfigByKey(HEADER_TEXT_COLOR_KEY, {
                value: nextTextColor,
            })
            await configManagementService.updateConfigByKey(HEADER_LOGO_HEIGHT_KEY, {
                value: nextLogoHeight,
            })
            await configManagementService.updateConfigByKey(HEADER_LOGO_FILTER_KEY, {
                value: nextLogoFilter,
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
            pushSiteConfigEdit({
                key: HEADER_TEXT_COLOR_KEY,
                valueBefore: originalHeaderTextColor,
                valueAfter: nextTextColor,
                valueType: 'string',
                section: 'public',
            })
            pushSiteConfigEdit({
                key: HEADER_LOGO_HEIGHT_KEY,
                valueBefore: originalHeaderLogoHeight,
                valueAfter: nextLogoHeight,
                valueType: 'string',
                section: 'public',
            })
            pushSiteConfigEdit({
                key: HEADER_LOGO_FILTER_KEY,
                valueBefore: originalHeaderLogoFilter,
                valueAfter: nextLogoFilter,
                valueType: 'string',
                section: 'public',
            })

            setOriginalHeaderBackgroundGradient(nextBackground)
            setOriginalHeaderButtonHoverBgColor(nextHoverBg)
            setOriginalHeaderTextColor(nextTextColor)
            setOriginalHeaderLogoHeight(nextLogoHeight)
            setOriginalHeaderLogoFilter(nextLogoFilter)

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
            await configManagementService.updateConfigByKey(HEADER_TEXT_COLOR_KEY, {
                value: DEFAULT_HEADER_TEXT_COLOR,
            })
            await configManagementService.updateConfigByKey(HEADER_LOGO_HEIGHT_KEY, {
                value: DEFAULT_HEADER_LOGO_HEIGHT,
            })
            await configManagementService.updateConfigByKey(HEADER_LOGO_FILTER_KEY, {
                value: DEFAULT_HEADER_LOGO_FILTER,
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
            pushSiteConfigEdit({
                key: HEADER_TEXT_COLOR_KEY,
                valueBefore: originalHeaderTextColor,
                valueAfter: DEFAULT_HEADER_TEXT_COLOR,
                valueType: 'string',
                section: 'public',
            })
            pushSiteConfigEdit({
                key: HEADER_LOGO_HEIGHT_KEY,
                valueBefore: originalHeaderLogoHeight,
                valueAfter: DEFAULT_HEADER_LOGO_HEIGHT,
                valueType: 'string',
                section: 'public',
            })
            pushSiteConfigEdit({
                key: HEADER_LOGO_FILTER_KEY,
                valueBefore: originalHeaderLogoFilter,
                valueAfter: DEFAULT_HEADER_LOGO_FILTER,
                valueType: 'string',
                section: 'public',
            })

            setHeaderBackgroundGradient(DEFAULT_HEADER_BACKGROUND_GRADIENT)
            setHeaderButtonHoverBgColor(DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR)
            setHeaderTextColor(DEFAULT_HEADER_TEXT_COLOR)
            setHeaderLogoHeight(DEFAULT_HEADER_LOGO_HEIGHT)
            setHeaderLogoFilter(DEFAULT_HEADER_LOGO_FILTER)
            setOriginalHeaderBackgroundGradient(DEFAULT_HEADER_BACKGROUND_GRADIENT)
            setOriginalHeaderButtonHoverBgColor(DEFAULT_HEADER_BUTTON_HOVER_BG_COLOR)
            setOriginalHeaderTextColor(DEFAULT_HEADER_TEXT_COLOR)
            setOriginalHeaderLogoHeight(DEFAULT_HEADER_LOGO_HEIGHT)
            setOriginalHeaderLogoFilter(DEFAULT_HEADER_LOGO_FILTER)

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

    const handleApplyPrimaryToSecondaryGradient = () => {
        setGradientStartColor('var(--primary)')
        setGradientEndColor('var(--secondary)')
        setGradientDirection('90deg')
    }

    const safePreviewHeaderBackground = getSafeBackgroundValue(
        headerBackgroundGradient,
    )
    const safePreviewHeaderHoverBg = getSafeHoverColorValue(
        headerButtonHoverBgColor,
    )

    const previewTextColor = headerTextColor.trim() || undefined
    const previewLogoHeight = parseInt(headerLogoHeight, 10) || 28
    const previewLogoFilter = headerLogoFilter.trim() || undefined
    const showBorder = !isGradientValue(headerBackgroundGradient)

    const ColorVarSelector = ({
        value,
        onChange,
        label,
    }: {
        value: string
        onChange: (v: string) => void
        label: string
    }) => {
        const selectedVar = getCssVarSelection(value)
        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                <div className="flex items-center gap-3">
                    <Select
                        value={selectedVar || '_custom'}
                        onValueChange={(v) => {
                            if (v === '_custom') {
                                onChange('')
                            } else {
                                onChange(v)
                            }
                        }}
                    >
                        <SelectTrigger className="w-48 shrink-0">
                            <SelectValue placeholder="Select variable" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_custom">Custom value</SelectItem>
                            {CSS_VAR_OPTIONS.filter((o) => o.value).map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {isHexColor(value) && (
                        <div
                            className="w-8 h-8 rounded border border-border shrink-0"
                            style={{ backgroundColor: value }}
                        />
                    )}
                    {isCssVar(value) && (
                        <div
                            className="w-8 h-8 rounded border border-border shrink-0"
                            style={{ backgroundColor: value }}
                        />
                    )}
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-foreground">Header Style</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Customize app header background, text color, logo, and hover styling with a live preview
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
                                className={`px-4 py-3 flex items-center justify-between gap-3 ${showBorder ? 'border-b border-border' : ''}`}
                                style={{
                                    background: safePreviewHeaderBackground,
                                    color: previewTextColor,
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={logoUrl}
                                        alt="Logo"
                                        style={{
                                            height: `${previewLogoHeight}px`,
                                            filter: previewLogoFilter,
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                                        style={{ color: previewTextColor }}
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
                                        style={{ color: previewTextColor }}
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
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Background Gradient</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleApplyPrimaryToSecondaryGradient}
                                    disabled={isLoading || isSaving}
                                >
                                    Apply --primary to --secondary gradient
                                </Button>
                            </div>

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
                                <ColorVarSelector
                                    label="Gradient Start Color"
                                    value={gradientStartColor}
                                    onChange={setGradientStartColor}
                                />
                                <ColorVarSelector
                                    label="Gradient End Color"
                                    value={gradientEndColor}
                                    onChange={setGradientEndColor}
                                />
                            </div>

                            <ColorVarSelector
                                label="Header Button Hover Background"
                                value={headerButtonHoverBgColor}
                                onChange={setHeaderButtonHoverBgColor}
                            />

                            <ColorVarSelector
                                label="Header Text Color"
                                value={headerTextColor}
                                onChange={setHeaderTextColor}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="header-logo-height">Logo Height (px)</Label>
                                    <Input
                                        id="header-logo-height"
                                        type="number"
                                        min={16}
                                        max={80}
                                        value={headerLogoHeight}
                                        onChange={(e) => setHeaderLogoHeight(e.target.value)}
                                        placeholder="28"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Logo Filter</Label>
                                    <Select
                                        value={LOGO_FILTER_PRESETS.find((p) => p.value === headerLogoFilter) ? (headerLogoFilter || '_none') : '_custom'}
                                        onValueChange={(v) => {
                                            if (v === '_custom') return
                                            setHeaderLogoFilter(v === '_none' ? '' : v)
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select preset" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LOGO_FILTER_PRESETS.map((preset) => (
                                                <SelectItem key={preset.value || '_none'} value={preset.value || '_none'}>
                                                    {preset.label}
                                                </SelectItem>
                                            ))}
                                            {!LOGO_FILTER_PRESETS.find((p) => p.value === headerLogoFilter) && headerLogoFilter && (
                                                <SelectItem value="_custom">Custom</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default HeaderStyleConfigSection
