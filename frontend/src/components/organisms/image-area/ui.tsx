// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT
//
// Portions derived from @mekong89/image-area-lib (MIT, (c) Chieucasmen).
// See NOTICE.md in this folder.

import { useEffect, useRef, useState } from 'react'
import { ShapeIconSvg } from './icons'

// Close-on-outside-click, same protocol as the lib's hook: a click only
// closes when the press started outside, so the opening click can't instantly
// close (or swallow) the popup.
export const useOutsideClose = (
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
) => {
  useEffect(() => {
    let started = false
    let startedWithin = false
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      started = !!ref.current
      startedWithin =
        !!ref.current && ref.current.contains(e.target as Node)
    }
    const onClick = (e: MouseEvent) => {
      if (
        !startedWithin &&
        started &&
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('click', onClick)
    }
  }, [ref, onClose])
}

// The lib's BCButton: 5px radius, bold, contained/outlined variants with
// #1976d2 as the default accent, disabled = lightgray.
interface ActionButtonProps {
  variant?: 'contained' | 'outlined'
  width?: string
  height?: string
  className?: string
  bgColor?: string
  color?: string
  disabled?: boolean
  icon?: { name: string; fill?: string }
  text?: string
  style?: React.CSSProperties
  onClick?: () => void
  children?: React.ReactNode
  menu?: React.ReactNode
}

export const ActionButton = ({
  variant = 'outlined',
  width,
  height,
  className = '',
  bgColor,
  color,
  disabled,
  icon,
  text,
  style,
  onClick,
  children,
  menu,
}: ActionButtonProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLButtonElement | null>(null)
  useOutsideClose(rootRef, () => setMenuOpen(false))
  const contained = variant === 'contained'
  return (
    <button
      type="button"
      ref={rootRef}
      disabled={disabled}
      className={`relative rounded-[5px] font-bold ${className}`}
      style={{
        width,
        height,
        ...(contained
          ? { backgroundColor: bgColor || '#1976d2', color: color || '#fff' }
          : {
              backgroundColor: bgColor || '#fff',
              color: color || '#1976d2',
              borderColor: color || '#1976d2',
              borderStyle: 'solid',
              borderWidth: 1,
            }),
        ...(disabled
          ? { color: '#fff', backgroundColor: 'lightgray', border: 'none' }
          : {}),
        ...style,
      }}
      onClick={() => {
        onClick?.()
        if (menu) setMenuOpen((open) => !open)
      }}
    >
      <div className="flex items-center justify-center">
        {icon && <ShapeIconSvg name={icon.name} fill={icon.fill} />}
        {text && (
          <div className={`${icon ? 'ml-1.5' : ''} px-1 font-normal`}>
            {text}
          </div>
        )}
        {children}
      </div>
      {menu && menuOpen && (
        <div
          className="absolute z-[2] mt-[10px] rounded-[4px] bg-white text-black"
          style={{
            boxShadow:
              'rgba(0, 0, 0, 0.15) 0px 0px 0px 1px, rgba(0, 0, 0, 0.15) 0px 8px 16px',
          }}
        >
          {menu}
        </div>
      )}
    </button>
  )
}

// Toolbar shape/icon button (the lib's styled button with the hover/active
// backgrounds #e8f1ff / #b8d6ff).
export const PaletteButton = ({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`rounded-[5px] p-[5px] ${
      active ? 'bg-[#b8d6ff]' : 'enabled:hover:bg-[#e8f1ff]'
    }`}
  >
    {children}
  </button>
)

// Borderless "Upload Image" button (the lib's BCUploadButton): blue cloud
// icon + blue text over the toolbar background, hidden file input inside.
export const UploadButton = ({
  disabled,
  width,
  height,
  className = '',
  text,
  handleUploadImage,
}: {
  disabled?: boolean
  width?: string
  height?: string
  className?: string
  text: string
  handleUploadImage: (file: File) => void
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  return (
    <button
      type="button"
      disabled={disabled}
      className={`rounded-[5px] font-bold text-[#1976d2] ${className}`}
      style={{ width, height }}
      onClick={() => inputRef.current?.click()}
    >
      <div className="flex items-center justify-center">
        <span className="mr-1.5">
          <ShapeIconSvg name="CLOUD_UPLOAD" fill="#1976d2" />
        </span>
        {text}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUploadImage(file)
          e.target.value = ''
        }}
      />
    </button>
  )
}

// Thin light-grey X (the lib's BCCloseButton): two 2px #333 bars rotated
// ±45°, 30% opacity until hovered.
export const CloseX = ({ onClick }: { onClick: () => void }) => (
  <div
    onClick={onClick}
    className="relative h-5 w-5 cursor-pointer opacity-30 hover:opacity-100"
  >
    <div
      className="absolute left-0 top-0 h-5 w-[2px] rotate-45 bg-[#333]"
      style={{ transformOrigin: 'center' }}
    />
    <div
      className="absolute left-0 top-0 h-5 w-[2px] -rotate-45 bg-[#333]"
      style={{ transformOrigin: 'center' }}
    />
  </div>
)

// The lib's modal confirm (BCDialog): dimmed overlay, 300px white card at
// 30% height, No (outlined) / Yes (contained).
export const ConfirmDialog = ({
  open,
  title,
  content,
  onYes,
  onNo,
}: {
  open: boolean
  title: string
  content: string
  onYes: () => void
  onNo: () => void
}) => (
  <div
    className="fixed left-0 top-0 z-[1] w-full overflow-auto"
    style={{
      display: open ? 'block' : 'none',
      paddingTop: 100,
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.4)',
    }}
    onClick={onNo}
  >
    <div
      className="absolute rounded-[5px] bg-white"
      style={{
        width: 300,
        padding: 15,
        left: '50%',
        top: '30%',
        transform: 'translate(-50%, -50%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2.5 text-black" style={{ fontSize: 20, fontWeight: 'bold' }}>
        {title}
      </div>
      <div className="mb-[15px] text-black">{content}</div>
      <div className="flex items-center justify-end">
        <ActionButton
          variant="outlined"
          text="No"
          width="60px"
          height="30px"
          onClick={onNo}
        />
        <ActionButton
          variant="contained"
          text="Yes"
          className="ml-2"
          width="60px"
          height="30px"
          onClick={onYes}
        />
      </div>
    </div>
  </div>
)
