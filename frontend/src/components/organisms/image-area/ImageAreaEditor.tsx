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
import { cloneDeep, isEmpty } from 'lodash'
import {
  ActionButton,
  CloseX,
  ConfirmDialog,
  PaletteButton,
  UploadButton,
} from './ui'
import { ColorSwatchSelect } from './SketchColorPicker'
import { ShapeIconSvg } from './icons'
import ImageAreaStage from './ImageAreaStage'
import {
  FONT_SIZE,
  ICON_SHAPE_RENDER,
  PALETTE_ICONS,
  PALETTE_SHAPES,
  SHAPE,
  type ImageAreaEditorProps,
  type ImageAreaShape,
  type ShapeType,
} from './types'

const GROUP_STYLE: React.CSSProperties = {
  width: 'fit-content',
  maxWidth: 200,
}

const GROUP_SEPARATOR = (
  <div className="mx-2.5 h-full" style={{ borderRight: '1px solid lightgray' }} />
)

// The lib's dropdown item (width 100px, 10px padding, left-aligned, #b8d6ff
// when active).
const MenuItem = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) => (
  <div
    onClick={onClick}
    className={active ? 'bg-[#b8d6ff]' : ''}
    style={{
      width: 100,
      maxHeight: 200,
      textAlign: 'left',
      padding: 10,
      fontWeight: 'normal',
    }}
  >
    {children}
  </div>
)

const URL_TEXTAREA_CLASS =
  'text-slate-700 mt-1 block w-full p-2 text-xs bg-slate-100'

interface ShapeSettingsProps {
  shape: ImageAreaShape
  onChange: (shape: ImageAreaShape) => void
  onDelete: (id?: string) => void
  onClose: () => void
}

const ShapeSettings = ({
  shape,
  onChange,
  onDelete,
  onClose,
}: ShapeSettingsProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.keyCode === 27) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  const update = (patch: Partial<ImageAreaShape>) =>
    onChange({ ...shape, ...patch })
  const fontSizeLabel =
    Object.values(FONT_SIZE).find((f) => f.value === shape.fontSize)?.label ?? ''
  return (
    <div className="w-full h-full flex flex-col">
      <ConfirmDialog
        open={confirmOpen}
        title="Remove"
        content="Do you want to remove this shape?"
        onYes={() => {
          onDelete(shape.id)
          setConfirmOpen(false)
        }}
        onNo={() => setConfirmOpen(false)}
      />
      <div className="flex items-center">
        <div className="text-xl font-semibold mb-2.5 text-black flex-1">
          Settings
        </div>
        <CloseX onClick={onClose} />
      </div>
      {shape.type === SHAPE.TEXT ? (
        <div className="text-slate-700 flex flex-col w-full">
          <div className="flex items-center">
            <div className="mr-2">Text Color:</div>
            <ColorSwatchSelect
              hex={shape.fill || '#000000'}
              setHex={(hex) => update({ fill: hex })}
            />
          </div>
          <div className="flex items-center mt-2">
            <div className="mr-2">Font Size:</div>
            <ActionButton
              height="30px"
              color="black"
              variant="contained"
              bgColor="transparent"
              className="ml-0.5 border-solid border-2 border-gray-500 p-2 text-sm"
              text={fontSizeLabel}
              menu={Object.values(FONT_SIZE).map((f) => (
                <MenuItem
                  key={f.value}
                  active={f.value === shape.fontSize}
                  onClick={() => update({ fontSize: f.value })}
                >
                  {f.label}
                </MenuItem>
              ))}
            />
          </div>
          <div className="mt-2">
            <div>URL:</div>
            <textarea
              className={URL_TEXTAREA_CLASS}
              rows={3}
              value={shape.url || ''}
              onChange={(e) => update({ url: e.target.value })}
              placeholder="Enter URL."
            />
          </div>
          <div className="mt-4">
            <div>Hover message:</div>
            <textarea
              className={URL_TEXTAREA_CLASS}
              rows={5}
              value={shape.hoverMessage || ''}
              onChange={(e) => update({ hoverMessage: e.target.value })}
              placeholder="Hover message ..."
            />
          </div>
        </div>
      ) : (
        <div className="text-slate-700 flex flex-col w-full">
          <div>URL:</div>
          <textarea
            className={URL_TEXTAREA_CLASS}
            rows={3}
            value={shape.url || ''}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="Enter URL."
          />
          <div className="mt-4">
            <div>Hover message:</div>
            <textarea
              className={URL_TEXTAREA_CLASS}
              rows={5}
              value={shape.hoverMessage || ''}
              onChange={(e) => update({ hoverMessage: e.target.value })}
              placeholder="Hover message ..."
            />
          </div>
        </div>
      )}
      <div className="mt-3 flex items-center justify-center">
        <ActionButton
          variant="outlined"
          text="Remove"
          className="mr-1.5"
          icon={{ name: 'TRASH', fill: 'red' }}
          color="red"
          width="100%"
          height="40px"
          onClick={() => setConfirmOpen(true)}
        />
        <ActionButton
          variant="contained"
          text="Close"
          icon={{ name: 'CHECK', fill: 'white' }}
          width="100%"
          height="40px"
          onClick={onClose}
        />
      </div>
    </div>
  )
}

const ImageAreaEditor = ({
  shapes,
  bgImage,
  bgColor,
  onSave,
  handleUploadImage,
}: ImageAreaEditorProps) => {
  const [displayShapes, setDisplayShapes] = useState<ImageAreaShape[]>([])
  const [selectedShape, setSelectedShape] = useState<ImageAreaShape | null>(null)
  const [isChanged, setIsChanged] = useState(false)
  const [displayBgColor, setDisplayBgColor] = useState<string | undefined>(undefined)
  const [loaded, setLoaded] = useState(true)
  const [sourceType, setSourceType] = useState<ShapeType>(SHAPE.RECTANGLE)
  const [visibleIcons, setVisibleIcons] = useState<ShapeType[]>(() =>
    PALETTE_ICONS.slice(0, 5),
  )
  const [panelOnLeft, setPanelOnLeft] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDisplayShapes((shapes ?? []).filter((s) => s.id))
    setSelectedShape(null)
  }, [shapes])

  useEffect(() => {
    setDisplayBgColor(bgColor || '#FFFFFF')
  }, [bgColor])

  useEffect(() => {
    setLoaded(!bgImage)
  }, [bgImage])

  const selectType = (type: ShapeType) => {
    setSourceType(type)
    if (PALETTE_ICONS.includes(type)) {
      setVisibleIcons((prev) => {
        const base = prev.length ? prev : PALETTE_ICONS.slice(0, 5)
        if (base.includes(type)) return base
        return [type, ...base.slice(0, 4)]
      })
    }
  }

  const handleChangeShapes = (next: ImageAreaShape[], notChange?: boolean) => {
    setDisplayShapes(next)
    setIsChanged((prev) => (prev || notChange ? prev : true))
  }

  const handleSelectShape = (shape: ImageAreaShape) => {
    setSelectedShape(cloneDeep(shape))
    if (rootRef.current) {
      const rightEdge =
        (shape.x ?? 0) * (shape.scaleX || 1) + (shape.width ?? 0)
      setPanelOnLeft(rightEdge > rootRef.current.clientWidth / 2)
    }
  }

  const handleDeleteShape = (id?: string) => {
    if (!id) return
    setDisplayShapes((prev) => prev.filter((s) => s.id !== id))
    setIsChanged(true)
    setSelectedShape(null)
  }

  const handleApplyShapeEdit = (edited: ImageAreaShape) => {
    // ShapeSettings is controlled by selectedShape: without this sync every
    // keystroke resets its textareas to the stale selection snapshot.
    setSelectedShape(edited)
    setDisplayShapes((prev) => {
      const index = prev.findIndex((s) => s.id === edited.id)
      if (index === -1) return prev
      const next = [...prev]
      next[index] = { ...next[index], ...edited }
      return next
    })
    setIsChanged(true)
  }

  const handleSave = () => {
    if (!onSave) return
    // Same invalid-shape filter as the lib's save path: drops id-less drafts,
    // shapes without size, and text shapes with empty text.
    const kept = displayShapes.filter(
      (s) =>
        !(
          !s.id ||
          !s.width ||
          !s.height ||
          (s.type === SHAPE.TEXT && isEmpty(s.text))
        ),
    )
    setDisplayShapes(kept)
    setIsChanged(false)
    onSave({ shapes: kept, bgImage, bgColor: displayBgColor })
  }

  const renderPaletteIcon = (type: ShapeType) => {
    const cfg = ICON_SHAPE_RENDER[type]
    return (
      <PaletteButton
        key={type}
        active={sourceType === type}
        disabled={!loaded}
        onClick={() => selectType(type)}
      >
        <ShapeIconSvg
          name={cfg?.iconKey ?? type}
          fill={cfg?.fill}
          className="w-6 h-6"
        />
      </PaletteButton>
    )
  }

  // Same toolbar row as the lib: shapes group, separator, icons group with
  // the dashed three-dot popup, separator, then bg color / upload / save.
  const toolbar = (
    <div className="flex p-2 bg-slate-200">
      <div className="flex-1">
        <div className="flex flex-col w-full h-full">
          <div className="flex items-center w-full h-full">
            <div className="flex items-center" style={GROUP_STYLE}>
              {PALETTE_SHAPES.map((type) => (
                <PaletteButton
                  key={type}
                  active={sourceType === type}
                  disabled={!loaded}
                  onClick={() => selectType(type)}
                >
                  <ShapeIconSvg
                    name={type === SHAPE.TEXT ? 'TEXT' : type.toUpperCase()}
                    fill={type === SHAPE.TEXT ? 'black' : undefined}
                    className="w-6 h-6"
                  />
                </PaletteButton>
              ))}
            </div>
            {GROUP_SEPARATOR}
            <div className="flex items-center" style={GROUP_STYLE}>
              {visibleIcons.map((type) => renderPaletteIcon(type))}
              <ActionButton
                icon={{ name: 'THREE_DOT', fill: 'rgb(107 114 128)' }}
                disabled={!loaded}
                width="30px"
                height="25px"
                color="white"
                variant="contained"
                bgColor="transparent"
                className="ml-0.5 border-dashed border-2 border-gray-500"
                menu={
                  // The lib's popup card: 200px wide, so the ten 34px icon
                  // buttons wrap into 2 rows of 5.
                  <div
                    className="absolute flex flex-wrap bg-white"
                    style={{
                      width: 200,
                      maxHeight: 200,
                      textAlign: 'left',
                      padding: 10,
                      marginTop: 10,
                      transform: 'translateX(-42%)',
                      borderRadius: 4,
                      boxShadow:
                        'rgba(0, 0, 0, 0.15) 0px 0px 0px 1px, rgba(0, 0, 0, 0.15) 0px 8px 16px',
                      overflowY: 'auto',
                    }}
                  >
                    {PALETTE_ICONS.map((type) => {
                      const cfg = ICON_SHAPE_RENDER[type]
                      return (
                        <PaletteButton
                          key={type}
                          active={false}
                          onClick={() => selectType(type)}
                        >
                          <ShapeIconSvg
                            name={cfg?.iconKey ?? type}
                            fill={cfg?.fill}
                            className="w-6 h-6"
                          />
                        </PaletteButton>
                      )
                    })}
                  </div>
                }
              />
            </div>
            {GROUP_SEPARATOR}
          </div>
        </div>
      </div>
      <ColorSwatchSelect
        showFillIcon
        disabled={!loaded}
        hex={displayBgColor}
        setHex={(hex) => {
          setDisplayBgColor(hex)
          setIsChanged(true)
        }}
      />
      <UploadButton
        disabled={!loaded}
        width="150px"
        height="40px"
        className="ml-2.5"
        text="Upload Image"
        handleUploadImage={(file) => {
          handleUploadImage?.(file)
          setIsChanged(true)
        }}
      />
      <ActionButton
        disabled={!loaded || !isChanged}
        variant="contained"
        text="Save"
        icon={{ name: 'SAVE_DISK', fill: 'white' }}
        className="ml-1"
        width="100px"
        height="40px"
        onClick={handleSave}
      />
    </div>
  )

  return (
    <div ref={rootRef} className="flex w-full h-full relative">
      <ImageAreaStage
        shapes={displayShapes}
        bgImage={bgImage}
        bgColor={displayBgColor}
        selectedShape={selectedShape}
        sourceType={sourceType}
        loaded={loaded}
        onImageLoaded={() => setLoaded(true)}
        toolbar={toolbar}
        onChangeShapes={handleChangeShapes}
        onSelectShape={handleSelectShape}
        onDeleteShape={handleDeleteShape}
      />
      {selectedShape?.id && (
        <div
          className={`border border-solid border-slate-200 p-2.5 absolute bg-white top-14 shadow-lg shadow-slate-700 ${
            panelOnLeft ? 'left-0' : 'right-0'
          }`}
          style={{ minWidth: 300 }}
        >
          <ShapeSettings
            shape={selectedShape}
            onChange={handleApplyShapeEdit}
            onDelete={handleDeleteShape}
            onClose={() => setSelectedShape(null)}
          />
        </div>
      )}
    </div>
  )
}

export default ImageAreaEditor
