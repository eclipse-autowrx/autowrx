// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useRef, useCallback, useEffect } from 'react'
import PagePrototypePlugin from '@/pages/PagePrototypePlugin'

interface PrototypeSidebarProps {
  pluginSlug: string
  isCollapsed: boolean
  defaultWidthPercent?: number
  minWidthPx?: number
  onSetActiveTab?: (tab: string, pluginSlug?: string) => void
}

const PrototypeSidebar: FC<PrototypeSidebarProps> = ({
  pluginSlug,
  isCollapsed,
  defaultWidthPercent = 35,
  minWidthPx = 200,
  onSetActiveTab,
}) => {
  const [width, setWidth] = useState<number | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize width from percentage on mount
  useEffect(() => {
    if (width === null && containerRef.current) {
      const parentWidth = containerRef.current.parentElement?.clientWidth
      if (parentWidth) {
        setWidth(Math.round((parentWidth * defaultWidthPercent) / 100))
      }
    }
  }, [defaultWidthPercent, width])

  const startResize = useCallback((startX: number) => {
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const startWidth = width ?? minWidthPx

    const onMove = (clientX: number) => {
      if (!isResizing.current) return
      const delta = clientX - startX
      const newWidth = startWidth + delta
      const parentWidth = containerRef.current?.parentElement?.clientWidth ?? window.innerWidth
      const maxWidth = Math.round(parentWidth * 0.7)
      setWidth(Math.max(minWidthPx, Math.min(newWidth, maxWidth)))
    }

    const onEnd = () => {
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', onEnd)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onEnd)
    }

    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX)
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      onMove(e.touches[0].clientX)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', onEnd)
    document.addEventListener('touchcancel', onEnd)
  }, [width, minWidthPx])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    startResize(e.clientX)
  }, [startResize])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    startResize(e.touches[0].clientX)
  }, [startResize])

  return (
    <div ref={containerRef} className="flex h-full">
      {/* Sidebar panel — zero padding/margin/bg, plugin gets full space */}
      {/* Plugin stays mounted always (hidden when collapsed) to avoid reload */}
      <div
        ref={sidebarRef}
        className="h-full overflow-hidden transition-[width] duration-200 ease-in-out"
        style={{
          width: isCollapsed ? 0 : (width ?? minWidthPx),
          minWidth: isCollapsed ? 0 : minWidthPx,
          padding: 0,
          margin: 0,
        }}
      >
        <div className={isCollapsed ? 'hidden' : 'w-full h-full'}>
          <PagePrototypePlugin pluginSlug={pluginSlug} onSetActiveTab={onSetActiveTab} />
        </div>
      </div>

      {/* Resize divider + pill-shaped drag thumb */}
      {!isCollapsed && (
        <div className="relative flex items-center justify-center w-[3px] bg-border shrink-0">
          {/* Invisible wide touch target covering the full height */}
          <div
            className="absolute inset-y-0 -left-2 -right-2 z-10 cursor-col-resize touch-none"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          />
          {/* Visible pill thumb — large enough for touch (24x56px) */}
          <div
            className="absolute z-20 flex flex-col items-center justify-center gap-1 w-6 h-14 rounded-full border border-border bg-background shadow-md cursor-col-resize touch-none hover:bg-accent active:bg-accent"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <span className="block w-[2px] h-3 rounded-full bg-muted-foreground/50" />
            <span className="block w-[2px] h-3 rounded-full bg-muted-foreground/50" />
          </div>
        </div>
      )}
    </div>
  )
}

export default PrototypeSidebar
