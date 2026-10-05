// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  TRANSPARENT,
  isValidHex,
  toState,
  type ColorInput,
  type ColorState,
  type HslColor,
  type HsvColor,
  type RgbColor,
} from './color'
import { ShapeIconSvg } from './icons'
import { useOutsideClose } from './ui'

const INSET_SHADOW =
  'inset 0 0 0 1px rgba(0,0,0,.15), inset 0 0 4px rgba(0,0,0,.25)'
const HUE_GRADIENT =
  'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
const BAR_POINTER: React.CSSProperties = {
  width: 4,
  height: 8,
  marginTop: 1,
  borderRadius: 1,
  background: '#fff',
  boxShadow: '0 0 2px rgba(0, 0, 0, .6)',
  transform: 'translateX(-2px)',
}
const CHECKBOARD: React.CSSProperties = {
  backgroundImage:
    'conic-gradient(rgba(0,0,0,.08) 0 25%, transparent 0 50%, rgba(0,0,0,.08) 0 75%, transparent 0)',
  backgroundSize: '16px 16px',
}

interface SliderProps {
  hsl: HslColor
  rgb: RgbColor
  onChange: (data: ColorInput) => void
}

interface SaturationProps {
  hsl: HslColor
  hsv: HsvColor
  onChange: (data: ColorInput) => void
}

const useSliderDrag = (
  containerRef: React.RefObject<HTMLElement | null>,
  compute: (e: MouseEvent | TouchEvent) => void,
) => {
  const computeRef = useRef(compute)
  computeRef.current = compute
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleMove = (e: MouseEvent | TouchEvent) => computeRef.current(e)
    const handleMouseDown = (e: MouseEvent) => {
      handleMove(e)
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', unbind)
    }
    const unbind = () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', unbind)
    }
    const onTouch = (e: TouchEvent) => computeRef.current(e)
    el.addEventListener('mousedown', handleMouseDown)
    el.addEventListener('touchmove', onTouch)
    el.addEventListener('touchstart', onTouch)
    return () => {
      el.removeEventListener('mousedown', handleMouseDown)
      el.removeEventListener('touchmove', onTouch)
      el.removeEventListener('touchstart', onTouch)
      unbind()
    }
  }, [containerRef])
}

const pointerPosition = (e: MouseEvent | TouchEvent, el: HTMLElement) => {
  const source =
    'pageX' in e
      ? e
      : { pageX: e.touches[0]?.pageX ?? 0, pageY: e.touches[0]?.pageY ?? 0 }
  const rect = el.getBoundingClientRect()
  return {
    x: source.pageX - (rect.left + window.pageXOffset),
    y: source.pageY - (rect.top + window.pageYOffset),
    width: el.clientWidth,
    height: el.clientHeight,
  }
}

// Saturation/value square with the 4px dot pointer.
const Saturation = ({ hsl, hsv, onChange }: SaturationProps) => {
  const ref = useRef<HTMLDivElement | null>(null)
  useSliderDrag(ref, (e) => {
    const el = ref.current
    if (!el) return
    const { x, y, width, height } = pointerPosition(e, el)
    const s = x < 0 ? 0 : x > width ? 1 : Math.round((100 * x) / width) / 100
    const v =
      y < 0
        ? 1
        : y > height
          ? 0
          : Math.round((100 * (height - y)) / height) / 100
    if (s !== hsv.s || v !== hsv.v) {
      onChange({ h: hsl.h, s, v, source: 'hsv' })
    }
  })
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        background: `hsl(${hsl.h},100%, 50%)`,
        borderRadius: 3,
        cursor: 'default',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 3,
          background:
            'linear-gradient(to right, #fff, rgba(255,255,255,0))',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 3,
            boxShadow: INSET_SHADOW,
            background: 'linear-gradient(to top, #000, rgba(0,0,0,0))',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: `${-hsv.v * 100 + 100}%`,
              left: `${hsv.s * 100}%`,
              cursor: 'default',
            }}
          >
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                boxShadow:
                  '0 0 0 1.5px #fff, inset 0 0 1px 1px rgba(0,0,0,.3), 0 0 1px 2px rgba(0,0,0,.4)',
                transform: 'translate(-2px, -2px)',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const Hue = ({ hsl, onChange }: SliderProps) => {
  const ref = useRef<HTMLDivElement | null>(null)
  useSliderDrag(ref, (e) => {
    const el = ref.current
    if (!el) return
    const { x, width } = pointerPosition(e, el)
    const h = x < 0 ? 0 : x > width ? 359 : ((100 * x) / width) * 360 / 100
    if (h !== hsl.h) {
      onChange({ h, s: hsl.s, l: hsl.l, a: hsl.a, source: 'hsl' })
    }
  })
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 2,
        boxShadow: INSET_SHADOW,
        background: HUE_GRADIENT,
      }}
    >
      <div
        ref={ref}
        style={{ padding: '0 2px', position: 'relative', height: '100%' }}
      >
        <div style={{ position: 'absolute', left: `${(hsl.h * 100) / 360}%` }}>
          <div style={BAR_POINTER} />
        </div>
      </div>
    </div>
  )
}

const Alpha = ({ hsl, rgb, onChange }: SliderProps) => {
  const ref = useRef<HTMLDivElement | null>(null)
  useSliderDrag(ref, (e) => {
    const el = ref.current
    if (!el) return
    const { x, width } = pointerPosition(e, el)
    const a = x < 0 ? 0 : x > width ? 1 : Math.round((100 * x) / width) / 100
    if (a !== rgb.a) {
      onChange({ h: hsl.h, s: hsl.s, l: hsl.l, a, source: 'rgb' })
    }
  })
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 2,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 2 }}>
        <div style={{ position: 'absolute', inset: 0, ...CHECKBOARD }} />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 2,
          boxShadow: INSET_SHADOW,
          background: `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b}, 0) 0%, rgba(${rgb.r},${rgb.g},${rgb.b}, 1) 100%)`,
        }}
      />
      <div ref={ref} style={{ position: 'relative', height: '100%', margin: '0 3px' }}>
        <div style={{ position: 'absolute', left: `${rgb.a * 100}%` }}>
          <div style={BAR_POINTER} />
        </div>
      </div>
    </div>
  )
}

// The lib bundles react-color's EditableInput: local uppercased value while
// typing, arrow-key increments, and a draggable label for numeric fields.
const PickerInput = ({
  label,
  value,
  onChange,
  inputStyle,
  labelStyle,
  dragMax,
}: {
  label: string
  value: string | number
  onChange: (data: Record<string, string | number>) => void
  inputStyle: React.CSSProperties
  labelStyle: React.CSSProperties
  dragMax?: number
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [val, setVal] = useState(() => String(value).toUpperCase())
  const [blurVal, setBlurVal] = useState<string | null>(() =>
    String(value).toUpperCase(),
  )
  useEffect(() => {
    if (String(value) === val) return
    if (inputRef.current && inputRef.current === document.activeElement) {
      setBlurVal(String(value).toUpperCase())
    } else {
      setVal(String(value).toUpperCase())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  const emit = (next: string | number) => {
    setVal(String(next))
    onChange({ [label]: next })
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode !== 38 && e.keyCode !== 40) return
    const num = Number(String(val).replace(/%/g, ''))
    if (isNaN(num)) return
    emit(e.keyCode === 38 ? num + 1 : num - 1)
  }
  const handleLabelMouseDown = (e: React.MouseEvent) => {
    if (!dragMax) return
    e.preventDefault()
    const base = Number(value)
    const onMove = (ev: MouseEvent) => {
      const next = Math.round(base + ev.movementX)
      if (next >= 0 && next <= dragMax) onChange({ [label]: next })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        spellCheck={false}
        style={inputStyle}
        value={val}
        onChange={(e) => emit(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (blurVal !== null) {
            setVal(blurVal)
            setBlurVal(null)
          }
        }}
      />
      <label
        style={{
          ...labelStyle,
          ...(dragMax ? { cursor: 'ew-resize' } : {}),
        }}
        onMouseDown={handleLabelMouseDown}
      >
        {label}
      </label>
    </div>
  )
}

const SketchFields = ({
  rgb,
  hsl,
  hex,
  onChange,
}: {
  rgb: RgbColor
  hsl: HslColor
  hex: string
  onChange: (data: ColorInput) => void
}) => {
  const inputStyle: React.CSSProperties = {
    width: '80%',
    padding: '4px 10% 3px',
    border: 'none',
    boxShadow: 'inset 0 0 0 1px #ccc',
    fontSize: '11px',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    textAlign: 'center',
    fontSize: '11px',
    color: '#222',
    paddingTop: '3px',
    paddingBottom: '4px',
    textTransform: 'capitalize',
  }
  const handleChange = (data: Record<string, string | number>) => {
    if (data.hex !== undefined) {
      if (isValidHex(String(data.hex))) {
        onChange({ hex: String(data.hex), source: 'hex' })
      }
      return
    }
    const read = (key: string) =>
      data[key] !== undefined ? Number(data[key]) : undefined
    const r = read('r')
    const g = read('g')
    const b = read('b')
    const a = read('a')
    // Same guard as react-color's simpleCheckForValidColor: garbage input
    // (mid-typing "rgb" values) must not poison the color state.
    if ([r, g, b, a].some((v) => v !== undefined && Number.isNaN(v))) return
    if (r !== undefined || g !== undefined || b !== undefined) {
      onChange({
        r: r ?? rgb.r,
        g: g ?? rgb.g,
        b: b ?? rgb.b,
        a: rgb.a,
        source: 'rgb',
      })
    } else if (a !== undefined) {
      const clamped = a < 0 ? 0 : a > 100 ? 100 : a
      onChange({ h: hsl.h, s: hsl.s, l: hsl.l, a: clamped / 100, source: 'rgb' })
    }
  }
  return (
    <div className="flex" style={{ paddingTop: 4 }}>
      <div style={{ flex: 2 }}>
        <PickerInput
          label="hex"
          value={hex.replace('#', '')}
          onChange={handleChange}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
      </div>
      {(['r', 'g', 'b'] as const).map((key) => (
        <div key={key} style={{ flex: 1, paddingLeft: 6 }}>
          <PickerInput
            label={key}
            value={rgb[key]}
            onChange={handleChange}
            inputStyle={inputStyle}
            labelStyle={labelStyle}
            dragMax={255}
          />
        </div>
      ))}
      <div style={{ flex: 1, paddingLeft: 6 }}>
        <PickerInput
          label="a"
          value={Math.round(rgb.a * 100)}
          onChange={handleChange}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          dragMax={100}
        />
      </div>
    </div>
  )
}

// Same 15 swatches the lib's Sketch picker ships with.
const PRESET_COLORS = [
  '#D0021B',
  '#F5A623',
  '#F8E71C',
  '#8B572A',
  '#7ED321',
  '#417505',
  '#BD10E0',
  '#9013FE',
  '#4A90E2',
  '#50E3C2',
  '#B8E986',
  '#000000',
  '#4A4A4A',
  '#9B9B9B',
  '#FFFFFF',
]

const SketchPresetColors = ({
  onChange,
}: {
  onChange: (data: ColorInput) => void
}) => (
  <div
    className="flex flex-wrap"
    style={{
      margin: '0 -10px',
      padding: '10px 0 0 10px',
      borderTop: '1px solid #eee',
    }}
  >
    {PRESET_COLORS.map((color) => (
      <div key={color} style={{ width: 16, height: 16, margin: '0 10px 10px 0' }}>
        <div
          title={color}
          onClick={() => onChange({ hex: color, source: 'hex' })}
          style={{
            width: '100%',
            height: '100%',
            background: color,
            borderRadius: 3,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)',
            cursor: 'pointer',
          }}
        />
      </div>
    ))}
  </div>
)

interface SketchColorPickerProps {
  color: string
  onChange: (state: ColorState) => void
  className?: string
  style?: React.CSSProperties
}

// Port of react-color's SketchPicker (200px wide, alpha enabled) as bundled in
// @mekong89/image-area-lib. onChange reports the full converted state; the
// caller only needs `hex`.
export const SketchColorPicker = ({
  color,
  onChange,
  className,
  style,
}: SketchColorPickerProps) => {
  const [state, setState] = useState(() => toState(color))
  const stateRef = useRef(state)
  const handleChange = useCallback(
    (data: ColorInput) => {
      const dataHue =
        typeof data === 'object' && typeof data.h === 'number' ? data.h : 0
      const next = toState(data, dataHue || stateRef.current.oldHue)
      stateRef.current = next
      setState(next)
      onChange(next)
    },
    [onChange],
  )
  useEffect(() => {
    const current = stateRef.current
    const propNorm = color.toUpperCase()
    const currentNorm = current.hex.toUpperCase()
    // The parent echoes our own changes back; only an external value
    // (different shape selected, saved color loaded) may reset the state.
    if (propNorm !== currentNorm) {
      const next = toState(color, current.hsv.h)
      stateRef.current = next
      setState(next)
    }
  }, [color])
  const { rgb, hsl, hsv, hex } = state
  return (
    <div
      className={`sketch-picker ${className ?? ''}`}
      style={{
        width: 200,
        padding: '10px 10px 0',
        boxSizing: 'initial',
        background: '#fff',
        borderRadius: 4,
        boxShadow: '0 0 0 1px rgba(0,0,0,.15), 0 8px 16px rgba(0,0,0,.15)',
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          paddingBottom: '75%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Saturation hsl={hsl} hsv={hsv} onChange={handleChange} />
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ padding: '4px 0', flex: 1 }}>
          <div style={{ position: 'relative', height: 10, overflow: 'hidden' }}>
            <Hue hsl={hsl} rgb={rgb} onChange={handleChange} />
          </div>
          <div
            style={{ position: 'relative', height: 10, marginTop: 4, overflow: 'hidden' }}
          >
            <Alpha hsl={hsl} rgb={rgb} onChange={handleChange} />
          </div>
        </div>
        <div
          style={{
            width: 24,
            height: 24,
            position: 'relative',
            marginTop: 4,
            marginLeft: 4,
            borderRadius: 3,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, ...CHECKBOARD }} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 2,
              background: `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})`,
              boxShadow: INSET_SHADOW,
            }}
          />
        </div>
      </div>
      <SketchFields rgb={rgb} hsl={hsl} hex={hex} onChange={handleChange} />
      <SketchPresetColors onChange={handleChange} />
    </div>
  )
}

// The lib's swatch control: paint-bucket icon over a color bar (toolbar
// background) or a plain 40x20 swatch (text color), opening the picker popup
// with a "No Fill" row at the bottom.
interface ColorSwatchSelectProps {
  hex?: string
  setHex: (hex?: string) => void
  disabled?: boolean
  showFillIcon?: boolean
  className?: string
}

export const ColorSwatchSelect = ({
  hex,
  setHex,
  disabled,
  showFillIcon,
  className,
}: ColorSwatchSelectProps) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  useOutsideClose(rootRef, useCallback(() => setOpen(false), []))
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.keyCode === 27) setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  const current = hex || '#FFFFFF'
  return (
    <div
      ref={rootRef}
      className={`relative cursor-pointer ${className ?? ''}`}
    >
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col" onClick={() => !disabled && setOpen((v) => !v)}>
          {showFillIcon ? (
            <>
              <ShapeIconSvg name="FILL" className="m-auto mb-1 w-5" />
              <div
                className="h-1 w-7"
                style={{ backgroundColor: current === TRANSPARENT ? 'white' : current }}
              />
            </>
          ) : (
            <div
              className="h-5 w-10"
              style={{ backgroundColor: current === TRANSPARENT ? 'white' : current }}
            />
          )}
        </div>
      </div>
      {open && (
        <div
          className="absolute z-[1] bg-white"
          style={{
            boxShadow:
              'rgba(0, 0, 0, 0.15) 0px 0px 0px 1px, rgba(0, 0, 0, 0.15) 0px 8px 16px',
            transform: 'translateX(-40%)',
          }}
        >
          <SketchColorPicker
            color={current}
            onChange={(s) => setHex(s.hex)}
            style={{ boxShadow: 'none', background: 'none' }}
          />
          <div
            className={`flex cursor-pointer items-center p-2 hover:bg-[rgb(248_250_252)] ${
              current === TRANSPARENT ? 'bg-slate-300' : ''
            }`}
            onClick={() => setHex(TRANSPARENT)}
          >
            <div className="w-[23px]">
              <ShapeIconSvg name="SQUARE" fill="black" className="h-auto w-full" />
            </div>
            <div className="ml-1.5 text-base font-semibold text-black">No Fill</div>
          </div>
        </div>
      )}
    </div>
  )
}
