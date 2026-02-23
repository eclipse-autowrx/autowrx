// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react'
import { parse, converter, formatHex, formatHex8 } from 'culori'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { ArrowRightIcon } from 'lucide-react'

const toOklch = converter('oklch')
const toRgb = converter('rgb')

// Normalize hex input: allow #RGB, #RGBA, #RRGGBB, #RRGGBBAA (with or without #)
function normalizeHexInput(s: string): string {
  const t = s.trim()
  if (!t) return ''
  const hex = t.startsWith('#') ? t.slice(1) : t
  if (/^[0-9a-fA-F]{3}$/.test(hex)) return '#' + hex
  if (/^[0-9a-fA-F]{4}$/.test(hex)) return '#' + hex
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return '#' + hex
  if (/^[0-9a-fA-F]{8}$/.test(hex)) return '#' + hex
  return t.startsWith('#') ? t : '#' + t
}

// Format oklch color for CSS: rounded values, hue 0 when chroma is 0 (avoid "none")
function formatOklchCss(c: { l?: number; c?: number; h?: number; alpha?: number }): string {
  const L = c.l !== undefined ? Number(c.l.toFixed(4)) : 0
  const C = c.c !== undefined ? Number(c.c.toFixed(4)) : 0
  const H = C === 0 ? 0 : (c.h !== undefined ? Number(c.h.toFixed(2)) : 0)
  const alpha =
    c.alpha !== undefined && c.alpha < 1
      ? Number(c.alpha.toFixed(4))
      : undefined
  if (alpha !== undefined) {
    return `oklch(${L} ${C} ${H} / ${alpha})`
  }
  return `oklch(${L} ${C} ${H})`
}

const HexOklchConverter: React.FC = () => {
  const [hex, setHex] = useState('')
  const [oklch, setOklch] = useState('')
  const { toast } = useToast()

  const handleConvert = () => {
    const hexNorm = normalizeHexInput(hex)
    const oklchTrim = oklch.trim()

    if (hexNorm) {
      const color = parse(hexNorm)
      if (!color) {
        toast({
          title: 'Invalid hex',
          description: 'Use #RGB, #RRGGBB, or #RRGGBBAA (with alpha).',
          variant: 'destructive',
        })
        return
      }
      const oklchColor = toOklch(color)
      const out = oklchColor ? formatOklchCss(oklchColor) : ''
      setOklch(out)
      if (out) {
        toast({ title: 'Converted', description: 'Hex → OKLCH' })
      }
      return
    }

    if (oklchTrim) {
      const color = parse(oklchTrim)
      if (!color) {
        toast({
          title: 'Invalid OKLCH',
          description: 'Use e.g. oklch(0.6 0.15 180)',
          variant: 'destructive',
        })
        return
      }
      const rgbColor = toRgb(color)
      if (!rgbColor) {
        toast({
          title: 'Conversion failed',
          description: 'Could not convert OKLCH to RGB.',
          variant: 'destructive',
        })
        return
      }
      const alpha = (rgbColor as { alpha?: number }).alpha
      const hasAlpha = alpha !== undefined && alpha < 1
      const hexOut = hasAlpha ? formatHex8(rgbColor) : formatHex(rgbColor)
      setHex(hexOut ?? '')
      if (hexOut) {
        toast({ title: 'Converted', description: 'OKLCH → Hex' })
      }
      return
    }

    toast({
      title: 'Enter a value',
      description: 'Type hex (#fff or #ffffff) or OKLCH, then click Convert.',
      variant: 'destructive',
    })
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          Hex <ArrowRightIcon className="w-4 h-4 inline-block" /> OKLCH
        </h4>
        <Button type="button" size="sm" onClick={handleConvert}>
          Convert
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Input
            id="hex-input"
            type="text"
            placeholder="Hex (#RGB, #RRGGBB, or #RRGGBBAA)"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Input
            id="oklch-input"
            type="text"
            placeholder="oklch(l c h / a)"
            value={oklch}
            onChange={(e) => setOklch(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
      </div>
    </div>
  )
}

export default HexOklchConverter
