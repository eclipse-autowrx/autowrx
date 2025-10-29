import { useEffect, useRef, useState } from 'react'

export default function useResizeObserver() {
  const ref = useRef<HTMLElement | null>(null)
  const [rect, setRect] = useState<DOMRectReadOnly | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setRect(entries[0].contentRect)
      }
    })

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  return [ref, rect] as const
}
