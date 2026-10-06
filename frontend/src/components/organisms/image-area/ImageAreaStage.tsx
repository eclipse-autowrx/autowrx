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

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { debounce } from 'lodash'
import Konva from 'konva'
import {
  Ellipse as KonvaEllipse,
  Image as KonvaImage,
  Rect as KonvaRect,
  Stage as KonvaStage,
  Text as KonvaText,
  Layer,
  Transformer,
} from 'react-konva'
import { ConfirmDialog } from './ui'
import { useShapeImage } from './icons'
import {
  ASPECT_RATIO,
  FONT_SIZE,
  ICON_SHAPE_RENDER,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  PALETTE_ICONS,
  SHAPE,
  type ImageAreaShape,
  type ShapeType,
} from './types'

interface StageMetrics {
  width: number
  height: number
  scaleX: number
  scaleY: number
}

interface ImageAreaStageProps {
  shapes: ImageAreaShape[]
  bgImage?: string
  bgColor?: string
  viewOnly?: boolean
  selectedShape?: ImageAreaShape | null
  sourceType: ShapeType
  loaded: boolean
  onImageLoaded: () => void
  toolbar?: React.ReactNode
  navigate?: (url: string) => void
  onChangeShapes: (shapes: ImageAreaShape[], notChange?: boolean) => void
  onSelectShape: (shape: ImageAreaShape) => void
  onDeleteShape: (id?: string) => void
}

interface ShapeCallbacks {
  viewOnly: boolean
  onHoverShape: (index: number | null) => void
  onSelectShape: (shape: ImageAreaShape) => void
  onShapeActionStart: () => void
  onShapeActionEnd: (
    index: number,
    payload: Partial<ImageAreaShape>,
    isClose?: boolean,
  ) => void
  onChangePointer: (cursor?: string) => void
  onEditTextStart: (index: number) => void
  navigate?: (url: string) => void
}

interface StageShapeProps {
  shape: ImageAreaShape
  index: number
  isFocus: boolean
  editing: boolean
  callbacks: ShapeCallbacks
}

const HIGHLIGHT_SHADOW =
  '0 14px 28px rgb( 0 0 0/25% ), 0 10px 10px rgb(0 0 0/22%)'

type TooltipKind = 'rect' | 'ellipse' | 'icon' | 'text'

const tooltipKind = (type: ShapeType): TooltipKind => {
  if (type === SHAPE.RECTANGLE) return 'rect'
  if (type === SHAPE.ELLIPSE) return 'ellipse'
  if (type === SHAPE.TEXT) return 'text'
  return 'icon'
}

// Dark rounded tooltip with an arrow, mirroring the lib's BCHover. DOM-only:
// it must render into the (relative) stage container, never inside <Stage>.
const ShapeTooltip = ({
  text,
  shape,
  kind,
}: {
  text: string
  shape: ImageAreaShape
  kind: TooltipKind
}) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState({ left: 0, top: 0 })
  const sx = shape.scaleX ?? 1
  const sy = shape.scaleY ?? 1
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const width = el.offsetWidth
    const height = el.offsetHeight
    let left: number
    let top: number
    if (kind === 'ellipse') {
      left = (shape.x ?? 0) * sx - width / 2
      top = (shape.y ?? 0) * sy - height - (shape.radiusY ?? 0) * sy - 10
    } else if (kind === 'icon') {
      left = (shape.x ?? 0) * sx + ((shape.width ?? 0) * sx) / 2 - width / 2
      top = (shape.y ?? 0) * sy - height - 10
    } else {
      left = (shape.x ?? 0) * sx + ((shape.width ?? 0) * sx) / 2 - width / 2
      top = (shape.y ?? 0) * sy - height
    }
    setPos((prev) =>
      prev.left === left && prev.top === top ? prev : { left, top },
    )
  }, [kind, text, sx, sy, shape.x, shape.y, shape.width, shape.radiusY])
  return (
    <div
      ref={ref}
      className="absolute z-10 flex items-center rounded-[10px] p-[5px] text-center pointer-events-none"
      style={{
        backgroundColor: '#111111CC',
        color: '#fff',
        minHeight: 50,
        minWidth: 150,
        maxWidth: 300,
        top: pos.top,
        left: pos.left,
      }}
    >
      <div className="w-full px-2 text-left text-[12px] leading-tight whitespace-pre-line">
        {text}
      </div>
      <div
        className="absolute top-full left-1/2 h-0 w-0"
        style={{
          marginLeft: -5,
          borderWidth: 5,
          borderStyle: 'solid',
          borderColor: 'black transparent transparent transparent',
        }}
      />
    </div>
  )
}

const StageRectangle = ({ shape, index, isFocus, callbacks }: StageShapeProps) => {
  const {
    viewOnly,
    onHoverShape,
    onSelectShape,
    onShapeActionStart,
    onShapeActionEnd,
    onChangePointer,
  } = callbacks
  const sx = shape.scaleX ?? 1
  const sy = shape.scaleY ?? 1
  const trRef = useRef<Konva.Transformer | null>(null)
  const shapeRef = useRef<Konva.Rect | null>(null)
  useEffect(() => {
    if (isFocus && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isFocus])
  if (viewOnly) return null // hover/click hotspots for rectangles are DOM overlays rendered by the parent
  return (
    <>
      {isFocus && <Transformer ref={trRef} rotateEnabled={false} />}
      <KonvaRect
        draggable
        ref={shapeRef}
        x={(shape.x ?? 0) * sx}
        y={(shape.y ?? 0) * sy}
        width={(shape.width ?? 0) * sx}
        height={(shape.height ?? 0) * sy}
        stroke="black"
        strokeWidth={2}
        onMouseDown={() => onSelectShape(shape)}
        onDragStart={onShapeActionStart}
        onDragEnd={(e) => {
          const { x, y } = e.target.attrs
          onShapeActionEnd(index, { type: SHAPE.RECTANGLE, x: x / sx, y: y / sy })
        }}
        onTransformStart={onShapeActionStart}
        onTransformEnd={() => {
          const node = shapeRef.current
          if (!node) return
          onShapeActionEnd(index, {
            type: SHAPE.RECTANGLE,
            x: node.x() / sx,
            y: node.y() / sy,
            width: (node.width() * node.scaleX()) / sx,
            height: (node.height() * node.scaleY()) / sy,
          })
          node.scaleX(1)
          node.scaleY(1)
        }}
        onMouseEnter={() => {
          onChangePointer('grab')
          onHoverShape(index)
        }}
        onMouseLeave={() => {
          onChangePointer()
          onHoverShape(null)
        }}
      />
    </>
  )
}

const StageEllipse = ({ shape, index, isFocus, callbacks }: StageShapeProps) => {
  const {
    viewOnly,
    onHoverShape,
    onSelectShape,
    onShapeActionStart,
    onShapeActionEnd,
    onChangePointer,
  } = callbacks
  const sx = shape.scaleX ?? 1
  const sy = shape.scaleY ?? 1
  const trRef = useRef<Konva.Transformer | null>(null)
  const shapeRef = useRef<Konva.Ellipse | null>(null)
  useEffect(() => {
    if (isFocus && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isFocus])
  if (viewOnly) return null // hover/click hotspots for ellipses are DOM overlays rendered by the parent
  return (
    <>
      {isFocus && <Transformer ref={trRef} rotateEnabled={false} />}
      <KonvaEllipse
        draggable
        ref={shapeRef}
        x={(shape.x ?? 0) * sx}
        y={(shape.y ?? 0) * sy}
        width={(shape.width ?? 0) * sx}
        height={(shape.height ?? 0) * sy}
        stroke="black"
        strokeWidth={2}
        radiusX={(shape.radiusX ?? 0) * sx}
        radiusY={(shape.radiusY ?? 0) * sy}
        onMouseDown={() => onSelectShape(shape)}
        onDragStart={onShapeActionStart}
        onDragEnd={(e) => {
          const { x, y } = e.target.attrs
          onShapeActionEnd(index, { type: SHAPE.ELLIPSE, x: x / sx, y: y / sy })
        }}
        onTransformStart={onShapeActionStart}
        onTransformEnd={() => {
          const node = shapeRef.current
          if (!node) return
          const width = (node.width() * node.scaleX()) / sx
          const height = (node.height() * node.scaleY()) / sy
          onShapeActionEnd(index, {
            type: SHAPE.ELLIPSE,
            x: node.x() / sx,
            y: node.y() / sy,
            width,
            height,
            radiusX: width / 2,
            radiusY: height / 2,
          })
          node.scaleX(1)
          node.scaleY(1)
        }}
        onMouseEnter={() => {
          onChangePointer('grab')
          onHoverShape(index)
        }}
        onMouseLeave={() => {
          onChangePointer()
          onHoverShape(null)
        }}
      />
    </>
  )
}

// Konva-only text node. The editing textarea is a DOM overlay owned by the
// parent (textEdit state), so this component renders nothing while editing.
const StageText = ({ shape, index, isFocus, editing, callbacks }: StageShapeProps) => {
  const {
    viewOnly,
    onHoverShape,
    onSelectShape,
    onShapeActionStart,
    onShapeActionEnd,
    onChangePointer,
    onEditTextStart,
    navigate,
  } = callbacks
  const sx = shape.scaleX ?? 1
  const sy = shape.scaleY ?? 1
  const trRef = useRef<Konva.Transformer | null>(null)
  const shapeRef = useRef<Konva.Text | null>(null)
  useEffect(() => {
    if (isFocus && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isFocus])
  if (editing) return null
  return (
    <>
      {isFocus && !viewOnly && <Transformer ref={trRef} rotateEnabled={false} />}
      <KonvaText
        fill={shape.fill}
        fontSize={shape.fontSize}
        text={shape.text ?? ''}
        lineHeight={1.5}
        x={(shape.x ?? 0) * sx}
        y={(shape.y ?? 0) * sy}
        width={(shape.width ?? 0) * sx}
        padding={5}
        height={shape.height ?? 0}
        onMouseEnter={() => {
          onChangePointer(viewOnly ? 'pointer' : 'grab')
          onHoverShape(index)
        }}
        onMouseLeave={() => {
          onChangePointer()
          onHoverShape(null)
        }}
        {...(viewOnly
          ? {
              onClick: () => {
                if (shape.url) navigate?.(shape.url)
              },
            }
          : {
              ref: shapeRef,
              draggable: true,
              onDragStart: onShapeActionStart,
              onDragEnd: (e) => {
                const { x, y } = e.target.attrs
                onShapeActionEnd(index, {
                  type: SHAPE.TEXT,
                  x: x / sx,
                  y: y / sy,
                  text: shape.text ?? '',
                })
              },
              onTransformStart: onShapeActionStart,
              onTransformEnd: () => {
                const node = shapeRef.current
                if (!node) return
                onShapeActionEnd(index, {
                  type: SHAPE.TEXT,
                  x: node.x() / sx,
                  y: node.y() / sy,
                  width: (node.width() * node.scaleX()) / sx,
                  height: (node.height() * node.scaleY()) / sy,
                  text: shape.text ?? '',
                })
                node.scaleX(1)
                node.scaleY(1)
              },
              onMouseDown: () => onSelectShape(shape),
              onDblClick: () => onEditTextStart(index),
            })}
      />
    </>
  )
}

const StageIcon = ({ shape, index, isFocus, callbacks }: StageShapeProps) => {
  const {
    viewOnly,
    onHoverShape,
    onSelectShape,
    onShapeActionStart,
    onShapeActionEnd,
    onChangePointer,
    navigate,
  } = callbacks
  const sx = shape.scaleX ?? 1
  const sy = shape.scaleY ?? 1
  const iconKey = shape.name ? shape.name.toUpperCase().replace('-', '_') : 'LOCATION'
  const image = useShapeImage(iconKey, shape.fill)
  const trRef = useRef<Konva.Transformer | null>(null)
  const shapeRef = useRef<Konva.Image | null>(null)
  useEffect(() => {
    if (isFocus && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isFocus])
  return (
    <>
      {isFocus && !viewOnly && <Transformer ref={trRef} rotateEnabled={false} />}
      <KonvaImage
        {...(viewOnly
          ? {}
          : {
              ref: shapeRef,
              draggable: true,
              onMouseDown: () => onSelectShape(shape),
              onDragStart: onShapeActionStart,
              onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
                const { x, y } = e.target.attrs
                onShapeActionEnd(index, { type: shape.type, x: x / sx, y: y / sy })
              },
              onTransformStart: onShapeActionStart,
              onTransformEnd: () => {
                const node = shapeRef.current
                if (!node) return
                onShapeActionEnd(index, {
                  type: shape.type,
                  x: node.x() / sx,
                  y: node.y() / sy,
                  width: (node.width() * node.scaleX()) / sx,
                  height: (node.height() * node.scaleY()) / sy,
                })
                node.scaleX(1)
                node.scaleY(1)
              },
            })}
        x={(shape.x ?? 0) * sx}
        y={(shape.y ?? 0) * sy}
        width={(shape.width ?? 0) * sx}
        height={(shape.height ?? 0) * sy}
        image={image ?? undefined}
        onMouseEnter={() => {
          onChangePointer(viewOnly ? 'pointer' : 'grab')
          onHoverShape(index)
        }}
        onMouseLeave={() => {
          onChangePointer()
          onHoverShape(null)
        }}
        onClick={() => {
          if (viewOnly && shape.url) navigate?.(shape.url)
        }}
      />
    </>
  )
}

interface TextEditState {
  index: number
  id: string
  text: string
  shape: ImageAreaShape
}

const ImageAreaStage = ({
  shapes,
  bgImage,
  bgColor,
  viewOnly = false,
  selectedShape,
  sourceType,
  loaded,
  onImageLoaded,
  toolbar,
  navigate,
  onChangeShapes,
  onSelectShape,
  onDeleteShape,
}: ImageAreaStageProps) => {
  const selectedId = selectedShape?.id
  // Old saved shapes may have no id: comparing two undefined ids would mark
  // every id-less shape as focused at once.
  const isShapeFocused = (shape: ImageAreaShape) =>
    selectedId != null && selectedId === shape.id
  const [displayBgImage, setDisplayBgImage] = useState<string | undefined>(undefined)
  const [metrics, setMetrics] = useState<StageMetrics>({
    width: 0,
    height: 0,
    scaleX: 0,
    scaleY: 0,
  })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [textEdit, setTextEdit] = useState<{
    index: number
    id: string
    text: string
  } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const mouseDownRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const maxTextHeights = useRef<Record<string, number>>({})
  const setMetricsDebounced = useMemo(() => debounce(setMetrics, 0), [])

  useEffect(() => {
    setDisplayBgImage(bgImage)
  }, [bgImage])

  useEffect(() => {
    const onDocMouseDown = () => {
      mouseDownRef.current = true
    }
    const onDocMouseUp = () => {
      mouseDownRef.current = false
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('mouseup', onDocMouseUp)
    const observer = new ResizeObserver((entries) => {
      const target = entries[0].target
      const width = target.clientWidth
      const height = target.clientHeight
      if (width && height) {
        const boxHeight = width / ASPECT_RATIO
        setMetricsDebounced({
          width,
          height: boxHeight,
          scaleX: width / LOGICAL_WIDTH,
          scaleY: boxHeight / LOGICAL_HEIGHT,
        })
      }
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('mouseup', onDocMouseUp)
      observer.disconnect()
      setMetricsDebounced.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!viewOnly && e.keyCode === 46 && selectedId) setConfirmOpen(true)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedId, viewOnly])

  // A text edit session is only valid while the edited shape still sits at the
  // recorded index (deletions shift indices).
  const textEditState: TextEditState | null = useMemo(() => {
    if (!textEdit) return null
    const s = shapes[textEdit.index]
    return s && s.id === textEdit.id
      ? { ...textEdit, shape: s }
      : null
  }, [textEdit, shapes])

  useEffect(() => {
    if (textEdit && !textEditState) setTextEdit(null)
  }, [textEdit, textEditState])

  const toLogicalX = (px: number) => parseInt(String(px / metrics.scaleX), 10)
  const toLogicalY = (py: number) => parseInt(String(py / metrics.scaleY), 10)

  const changePointer = (cursor?: string) => {
    if (containerRef.current) {
      containerRef.current.style.cursor = cursor || 'default'
    }
  }

  const discardLeftoverDraft = () => {
    if (shapes.length === 0) return
    if (!shapes[shapes.length - 1].id) {
      onChangeShapes(shapes.slice(0, -1), true)
    }
  }

  const finalizeDraft = () => {
    const last = shapes[shapes.length - 1]
    if (!last || last.id) return
    if (!last.width || !last.height) {
      onChangeShapes(shapes.slice(0, -1), true)
      return
    }
    const finalized = { ...last, id: Date.now().toString(36) }
    onChangeShapes([...shapes.slice(0, -1), finalized])
    onSelectShape(finalized)
  }

  const buildDraft = (shapeType: ShapeType): ImageAreaShape | null => {
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return null
    const px = toLogicalX(pointer.x)
    const py = toLogicalY(pointer.y)
    if (shapeType === SHAPE.RECTANGLE) {
      return { type: shapeType, x: px, y: py, width: 0, height: 0 }
    }
    if (shapeType === SHAPE.ELLIPSE) {
      return {
        type: shapeType,
        x: px,
        y: py,
        startX: px,
        startY: py,
        width: 0,
        height: 0,
        radiusX: 0,
        radiusY: 0,
      }
    }
    if (shapeType === SHAPE.TEXT) {
      return {
        type: shapeType,
        x: px,
        y: py,
        width: 150,
        height: 40,
        text: '',
        fill: 'black',
        fontSize: FONT_SIZE.SMALL.value,
        edit: true,
      }
    }
    if (PALETTE_ICONS.includes(shapeType)) {
      return { type: shapeType, x: px - 17.5, y: py - 30, width: 35, height: 40 }
    }
    return null
  }

  const createDraft = (shapeType: ShapeType) => {
    const draft = buildDraft(shapeType)
    if (draft) onChangeShapes([...shapes, draft], true)
  }

  // Icons and text are placed on mouse-up. Creation and id assignment must
  // land in ONE state update (the lib mutates its array synchronously before
  // finalizing); splitting them leaves an unfinalized id-less draft behind.
  const placeShape = (shapeType: ShapeType) => {
    const draft = buildDraft(shapeType)
    if (!draft) return
    const finalized = { ...draft, id: Date.now().toString(36) }
    onChangeShapes([...shapes, finalized])
    onSelectShape(finalized)
    if (finalized.type === SHAPE.TEXT) {
      setTextEdit({ index: shapes.length, id: finalized.id, text: '' })
    }
  }

  const startTextEdit = (index: number) => {
    if (viewOnly) return
    const s = shapes[index]
    if (!s?.id) return
    setTextEdit({ index, id: s.id, text: s.text ?? '' })
  }

  const endTextEdit = () => {
    const cur = textEdit
    if (!cur) return
    setTextEdit(null)
    const s = shapes[cur.index]
    if (!s || s.id !== cur.id) return
    const scrollHeight = textareaRef.current?.scrollHeight ?? 0
    const prevMax = maxTextHeights.current[cur.id] ?? 0
    if (scrollHeight > prevMax) maxTextHeights.current[cur.id] = scrollHeight
    const maxHeight = maxTextHeights.current[cur.id]
    const height = (s.height ?? 0) > maxHeight ? s.height : maxHeight
    const next = [...shapes]
    next[cur.index] = { ...s, type: SHAPE.TEXT, text: cur.text, height, edit: false }
    onChangeShapes(next)
  }

  const handleStageMouseDown = () => {
    if (viewOnly || selectedId) return
    if (sourceType === SHAPE.RECTANGLE || sourceType === SHAPE.ELLIPSE) {
      createDraft(sourceType)
    }
  }

  const handleStageMouseMove = () => {
    if (viewOnly || shapes.length === 0) return
    if (sourceType !== SHAPE.RECTANGLE && sourceType !== SHAPE.ELLIPSE) return
    if (!mouseDownRef.current) {
      finalizeDraft()
      return
    }
    const last = shapes[shapes.length - 1]
    if (last.id) return
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return
    const px = toLogicalX(pointer.x)
    const py = toLogicalY(pointer.y)
    const next = [...shapes]
    const updated = { ...last }
    if (sourceType === SHAPE.RECTANGLE) {
      updated.width = px - (updated.x ?? 0)
      updated.height = py - (updated.y ?? 0)
    } else {
      const startX = updated.startX ?? 0
      const startY = updated.startY ?? 0
      const radiusX = Math.abs(px - startX) / 2
      const radiusY = Math.abs(py - startY) / 2
      updated.radiusX = radiusX
      updated.radiusY = radiusY
      updated.x = radiusX + Math.min(px, startX)
      updated.y = radiusY + Math.min(py, startY)
      // The lib stores width/height as half the radius while drawing.
      updated.width = radiusX / 2
      updated.height = radiusY / 2
    }
    next[next.length - 1] = updated
    onChangeShapes(next, true)
  }

  const handleStageMouseUp = () => {
    if (viewOnly || selectedId) return
    if (sourceType !== SHAPE.RECTANGLE && sourceType !== SHAPE.ELLIPSE) {
      placeShape(sourceType)
      return
    }
    finalizeDraft()
  }

  const handleShapeActionStart = () => {
    if (viewOnly) return
    discardLeftoverDraft()
  }

  const handleShapeActionEnd = (
    index: number,
    payload: Partial<ImageAreaShape>,
    isClose?: boolean,
  ) => {
    if (viewOnly) return
    const next = [...shapes]
    next[index] = { ...next[index], ...payload }
    onChangeShapes(next)
    if (!isClose) onSelectShape(next[index])
  }

  const callbacks: ShapeCallbacks = {
    viewOnly,
    onHoverShape: setHoverIndex,
    onSelectShape,
    onShapeActionStart: handleShapeActionStart,
    onShapeActionEnd: handleShapeActionEnd,
    onChangePointer: changePointer,
    onEditTextStart: startTextEdit,
    navigate,
  }

  const editingId = textEditState?.id
  const hoverShape = hoverIndex != null ? shapes[hoverIndex] : undefined

  return (
    <div className="border border-solid border-slate-200 flex flex-col w-full h-full relative">
      {!viewOnly && toolbar}
      <ConfirmDialog
        open={confirmOpen}
        title="Remove"
        content="Do you want to remove this shape?"
        onYes={() => {
          onDeleteShape(selectedId)
          setConfirmOpen(false)
        }}
        onNo={() => setConfirmOpen(false)}
      />
      <div
        ref={containerRef}
        style={{ background: bgColor || '#FFFFFF', aspectRatio: ASPECT_RATIO }}
        className="w-full relative"
      >
        {displayBgImage && (
          <img
            src={displayBgImage}
            onLoad={onImageLoaded}
            alt=""
            className="w-full h-full object-contain absolute"
          />
        )}
        {loaded ? (
          <KonvaStage
            ref={stageRef}
            width={metrics.width}
            height={metrics.height}
            onMouseDown={handleStageMouseDown}
            onMouseUp={handleStageMouseUp}
            onMouseMove={handleStageMouseMove}
          >
            <Layer>
              {shapes.map((shape, index) => {
                const iconCfg = ICON_SHAPE_RENDER[shape.type]
                const renderShape: ImageAreaShape = {
                  ...shape,
                  viewOnly,
                  isFocus: isShapeFocused(shape),
                  scaleX: metrics.scaleX,
                  scaleY: metrics.scaleY,
                  ...(iconCfg
                    ? { name: iconCfg.jsonName, fill: iconCfg.fill }
                    : {}),
                }
                const props = {
                  shape: renderShape,
                  index,
                  isFocus: isShapeFocused(shape),
                  editing: editingId != null && editingId === shape.id,
                  callbacks,
                }
                switch (shape.type) {
                  case SHAPE.RECTANGLE:
                  case SHAPE.ELLIPSE:
                    if (viewOnly) return null
                    return shape.type === SHAPE.RECTANGLE ? (
                      <StageRectangle key={shape.id ?? `draft-${index}`} {...props} />
                    ) : (
                      <StageEllipse key={shape.id ?? `draft-${index}`} {...props} />
                    )
                  case SHAPE.TEXT:
                    return <StageText key={shape.id ?? `draft-${index}`} {...props} />
                  case SHAPE.CLOSE:
                  case SHAPE.PIN:
                  case SHAPE.LIKE:
                  case SHAPE.DISLIKE:
                  case SHAPE.SAND_CLOCK:
                  case SHAPE.ONE:
                  case SHAPE.TWO:
                  case SHAPE.THREE:
                  case SHAPE.FOUR:
                  case SHAPE.FIVE:
                    return <StageIcon key={shape.id ?? `draft-${index}`} {...props} />
                  default:
                    return null
                }
              })}
            </Layer>
          </KonvaStage>
        ) : (
          <div className="flex items-center justify-center h-full relative bg-slate-200/50">
            <div className="h-[50px] w-[50px] animate-[spin_2s_linear_infinite] rounded-full border-[5px] border-solid border-[#f3f3f3] border-t-[#3498db]" />
          </div>
        )}
        {viewOnly &&
          loaded &&
          shapes.map((shape, index) => {
            const sx = metrics.scaleX
            const sy = metrics.scaleY
            if (shape.type === SHAPE.RECTANGLE) {
              return (
                <div
                  key={shape.id ?? `hotspot-${index}`}
                  role="button"
                  tabIndex={0}
                  className="absolute cursor-pointer"
                  style={{
                    width: (shape.width ?? 0) * sx,
                    height: (shape.height ?? 0) * sy,
                    top: (shape.y ?? 0) * sy,
                    left: (shape.x ?? 0) * sx,
                  }}
                  onClick={() => {
                    if (shape.url) navigate?.(shape.url)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && shape.url) navigate?.(shape.url)
                  }}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <div
                    className="h-full w-full"
                    style={{
                      boxShadow: HIGHLIGHT_SHADOW,
                      visibility: hoverIndex === index ? 'visible' : 'hidden',
                    }}
                  />
                </div>
              )
            }
            if (shape.type === SHAPE.ELLIPSE) {
              return (
                <div
                  key={shape.id ?? `hotspot-${index}`}
                  role="button"
                  tabIndex={0}
                  className="absolute cursor-pointer"
                  style={{
                    // The lib inflates the hotspot by the aspect ratio on BOTH
                    // axes (so it stays geometrically similar to the editor
                    // ellipse) plus 10px of hover padding.
                    width: (shape.radiusX ?? 0) * sx * ASPECT_RATIO + 10,
                    height: (shape.radiusY ?? 0) * sy * ASPECT_RATIO + 10,
                    top: (shape.y ?? 0) * sy,
                    left: (shape.x ?? 0) * sx,
                    transform: 'translate( -50%, -50% )',
                  }}
                  onClick={() => {
                    if (shape.url) navigate?.(shape.url)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && shape.url) navigate?.(shape.url)
                  }}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <div
                    className="h-full w-full rounded-[50%]"
                    style={{
                      boxShadow: HIGHLIGHT_SHADOW,
                      visibility: hoverIndex === index ? 'visible' : 'hidden',
                    }}
                  />
                </div>
              )
            }
            return null
          })}
        {hoverShape?.hoverMessage && hoverIndex != null && (
          <ShapeTooltip
            text={hoverShape.hoverMessage}
            kind={tooltipKind(hoverShape.type)}
            shape={{ ...hoverShape, scaleX: metrics.scaleX, scaleY: metrics.scaleY }}
          />
        )}
        {loaded && textEditState && (
          <textarea
            ref={textareaRef}
            autoFocus
            value={textEditState.text}
            onChange={(e) =>
              setTextEdit((cur) =>
                cur && cur.id === textEditState.id
                  ? { ...cur, text: e.target.value }
                  : cur,
              )
            }
            onKeyDown={(e) => {
              if (e.key === 'Escape' || e.keyCode === 27) endTextEdit()
            }}
            onBlur={endTextEdit}
            onMouseEnter={() => {
              changePointer('grab')
              setHoverIndex(textEditState.index)
            }}
            onMouseLeave={() => {
              changePointer()
              setHoverIndex(null)
            }}
            className="absolute"
            style={{
              top: (textEditState.shape.y ?? 0) * metrics.scaleY,
              left: (textEditState.shape.x ?? 0) * metrics.scaleX,
              fontSize: textEditState.shape.fontSize,
              color: textEditState.shape.fill,
              width: (textEditState.shape.width ?? 0) * metrics.scaleX,
              height: Math.max(
                textEditState.shape.height ?? 0,
                maxTextHeights.current[textEditState.id] ?? 0,
                textareaRef.current?.scrollHeight ?? 0,
              ),
              border: '1px dashed lightgrey',
              padding: 5,
              margin: 0,
              overflow: 'hidden',
              background: 'none',
              outline: 'none',
              resize: 'none',
              transformOrigin: 'left top',
              lineHeight: 1.5,
            }}
          />
        )}
      </div>
    </div>
  )
}

export default ImageAreaStage
