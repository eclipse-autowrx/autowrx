import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export default function usePrototypeTabVSCodeResizer(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const resizeRef = useRef<HTMLDivElement | null>(null)

  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const [rightPanelWidth, setRightPanelWidth] = useState<number | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isApiPanelCollapsed, setIsApiPanelCollapsed] = useState(false)

  useEffect(() => {
    const calculateInitialWidth = () => {
      const container = containerRef.current
      if (!container) return
      const containerWidth = container.offsetWidth
      if (containerWidth <= 0) return
      setRightPanelWidth(containerWidth * 0.4)
    }

    const rafId = window.requestAnimationFrame(calculateInitialWidth)
    window.addEventListener('resize', calculateInitialWidth)
    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', calculateInitialWidth)
    }
  }, [isActive])

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault()
      startXRef.current = e.clientX
      const containerWidth = containerRef.current?.offsetWidth ?? 0
      const defaultWidth = containerWidth * 0.4
      startWidthRef.current = rightPanelWidth ?? defaultWidth

      const leftPanel = resizeRef.current?.previousElementSibling as HTMLElement | undefined
      const rightPanel = resizeRef.current?.nextElementSibling as HTMLElement | undefined
      if (leftPanel) leftPanel.style.transition = 'none'
      if (rightPanel) rightPanel.style.transition = 'none'

      setIsResizing(true)
    },
    [rightPanelWidth],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const containerWidth = containerRef.current.offsetWidth
      const minWidth = containerWidth * 0.2
      const maxWidth = containerWidth * 0.6
      const deltaX = e.clientX - startXRef.current

      setRightPanelWidth(clamp(startWidthRef.current - deltaX, minWidth, maxWidth))
    },
    [isResizing],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)

    const leftPanel = resizeRef.current?.previousElementSibling as HTMLElement | undefined
    const rightPanel = resizeRef.current?.nextElementSibling as HTMLElement | undefined
    if (leftPanel) leftPanel.style.transition = ''
    if (rightPanel) rightPanel.style.transition = ''
  }, [])

  useEffect(() => {
    if (!isResizing) {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      return
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  useEffect(() => {
    if (!isApiPanelCollapsed) return
    setIsResizing(false)
  }, [isApiPanelCollapsed])

  const rightPanelWidthStyle = isApiPanelCollapsed
    ? '48px'
    : rightPanelWidth !== null
      ? `${rightPanelWidth}px`
      : '40%'

  return {
    containerRef,
    resizeRef,
    isResizing,
    isApiPanelCollapsed,
    setIsApiPanelCollapsed,
    rightPanelWidthStyle,
    handleMouseDown,
  }
}

