import { MutableRefObject, useEffect, useRef, useState } from 'react'

type ObserverRect = Omit<DOMRectReadOnly, 'toJSON'>

const useResizeObserver = (): [
  MutableRefObject<HTMLDivElement | null>,
  ObserverRect | null,
] => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [rect, setRect] = useState<ObserverRect | null>(null)

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (ref.current) {
        setRect(ref.current.getBoundingClientRect())
      }
    })

    if (ref.current) {
      resizeObserver.observe(ref.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [ref])

  return [ref, rect]
}

export default useResizeObserver
