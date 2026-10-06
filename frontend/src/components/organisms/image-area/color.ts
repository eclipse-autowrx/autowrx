// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT
//
// Portions derived from react-color (MIT, (c) 2015 Case Sandberg).
// See NOTICE.md in this folder.

// Color math for the in-repo Sketch-style picker, mirroring the behaviour of
// react-color's ColorWrap (as bundled in @mekong89/image-area-lib): any input
// (hex string / rgb / hsl / hsv object) converts to the full state, and a
// saturation of 0 keeps the previous hue so grays/black don't snap to red.

export interface RgbColor {
  r: number
  g: number
  b: number
  a: number
}

export interface HslColor {
  h: number
  s: number
  l: number
  a: number
}

export interface HsvColor {
  h: number
  s: number
  v: number
  a: number
}

export interface ColorState {
  rgb: RgbColor
  hsl: HslColor
  hsv: HsvColor
  hex: string
  // Hue to keep showing on gray edges (s === 0), like react-color's ColorWrap.
  oldHue: number
}

export type ColorInput =
  | string
  | ({ source?: string } & Partial<RgbColor> &
      Partial<HslColor> &
      Partial<HsvColor> & { hex?: string })

export const TRANSPARENT = 'transparent'

export const isValidHex = (hex: string) =>
  /^#?([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex)

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export const hexToRgb = (hex: string): RgbColor => {
  const digits = hex.replace('#', '')
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((c) => c + c)
          .join('')
      : digits
  const int = parseInt(full, 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255, a: 1 }
}

let colorParseCtx: CanvasRenderingContext2D | null | undefined

// Saved shapes may hold any CSS colour (e.g. text shapes default to 'black'),
// which react-color resolved via tinycolor. Let the browser normalise
// non-hex values instead of misreading them as hex digits.
export const cssColorToRgb = (color: string): RgbColor => {
  if (isValidHex(color)) return hexToRgb(color)
  if (colorParseCtx === undefined) {
    colorParseCtx =
      typeof document === 'undefined'
        ? null
        : document.createElement('canvas').getContext('2d')
  }
  if (!colorParseCtx) return { r: 0, g: 0, b: 0, a: 1 }
  colorParseCtx.fillStyle = '#000000'
  colorParseCtx.fillStyle = color
  const normalised = String(colorParseCtx.fillStyle)
  if (isValidHex(normalised)) return hexToRgb(normalised)
  const parts = normalised.match(/[\d.]+/g)?.map(Number) ?? []
  return {
    r: parts[0] ?? 0,
    g: parts[1] ?? 0,
    b: parts[2] ?? 0,
    a: parts[3] ?? 1,
  }
}

export const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((v) =>
      Math.min(255, Math.max(0, Math.round(v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`

export const rgbToHsl = (
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } => {
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0)
    else if (max === gg) h = (bb - rr) / d + 2
    else h = (rr - gg) / d + 4
    h *= 60
  }
  return { h, s, l }
}

export const rgbToHsv = (
  r: number,
  g: number,
  b: number,
): { h: number; s: number; v: number } => {
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0)
    else if (max === gg) h = (bb - rr) / d + 2
    else h = (rr - gg) / d + 4
    h *= 60
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

export const hslToRgb = (
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } => {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = ((((((h % 360) + 360) % 360) / 60) % 6) + 6) % 6
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let rgb: [number, number, number]
  if (hp < 1) rgb = [c, x, 0]
  else if (hp < 2) rgb = [x, c, 0]
  else if (hp < 3) rgb = [0, c, x]
  else if (hp < 4) rgb = [0, x, c]
  else if (hp < 5) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  const m = l - c / 2
  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  }
}

export const hsvToRgb = (
  h: number,
  s: number,
  v: number,
): { r: number; g: number; b: number } => {
  const i = Math.floor((h / 60) % 6)
  const f = h / 60 - Math.floor(h / 60)
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  const idx = ((i % 6) + 6) % 6
  const table: [number, number, number][] = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ]
  const [r, g, b] = table[idx]
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

export const toState = (data: ColorInput, oldHue = 0): ColorState => {
  let rgb: RgbColor
  let hex = ''
  if (typeof data === 'string') {
    if (data === TRANSPARENT) {
      rgb = { r: 0, g: 0, b: 0, a: 0 }
      hex = TRANSPARENT
    } else {
      rgb = cssColorToRgb(data)
      hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    }
  } else if (data.hex !== undefined && isValidHex(data.hex)) {
    rgb = hexToRgb(data.hex)
    hex = rgbToHex(rgb.r, rgb.g, rgb.b)
  } else if (data.r !== undefined || data.g !== undefined || data.b !== undefined) {
    rgb = {
      r: Math.round(data.r ?? 0),
      g: Math.round(data.g ?? 0),
      b: Math.round(data.b ?? 0),
      a: data.a ?? 1,
    }
    hex = rgbToHex(rgb.r, rgb.g, rgb.b)
  } else if (data.h !== undefined && data.v !== undefined) {
    const conv = hsvToRgb(data.h, data.s ?? 0, data.v)
    rgb = { ...conv, a: data.a ?? 1 }
    hex = rgbToHex(rgb.r, rgb.g, rgb.b)
  } else if (data.h !== undefined) {
    const conv = hslToRgb(data.h, data.s ?? 0, data.l ?? 0)
    rgb = { ...conv, a: data.a ?? 1 }
    hex = rgbToHex(rgb.r, rgb.g, rgb.b)
  } else {
    rgb = { r: 0, g: 0, b: 0, a: 1 }
    hex = rgbToHex(0, 0, 0)
  }
  const hsl = { ...rgbToHsl(rgb.r, rgb.g, rgb.b), a: rgb.a }
  const hsv = { ...rgbToHsv(rgb.r, rgb.g, rgb.b), a: rgb.a }
  const sourceHue =
    typeof data === 'object' && typeof data.h === 'number' ? data.h : 0
  if (hsl.s === 0) {
    hsl.h = sourceHue || oldHue || 0
    hsv.h = sourceHue || oldHue || 0
  }
  return {
    rgb,
    hsl,
    hsv,
    hex,
    // Gray edges (s === 0) convert to h = 0; the picker must keep showing the
    // last hue there, exactly like react-color's ColorWrap.
    oldHue: sourceHue || oldHue || hsl.h,
  }
}
