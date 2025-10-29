// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { cn } from '@/lib/utils'
import clsx from 'clsx'
import { useCallback, useEffect, useMemo } from 'react'
import useRefStore from '@/stores/refStore'
import useResizeObserver from '@/hooks/useResizeObserver'
import _ from 'lodash'

interface DaTablePropertyItemProps {
  property: string
  value: string
  diffDetail?: {
    diff?: number
    valueDiff?: number | [number, string][]
  }
  syncHeight?: boolean
}

const DaTablePropertyItem = ({
  property,
  value,
  diffDetail,
  syncHeight,
}: DaTablePropertyItemProps) => {
  const [ref, rect] = useResizeObserver()
  const setStoreValue = useRefStore((state) => state.setValue)

  const isValidValue =
    Array.isArray(diffDetail?.valueDiff) &&
    diffDetail.valueDiff.every(
      (item) => typeof item[0] === 'number' && typeof item[1] === 'string',
    )

  const onLoad = useCallback((el: HTMLDivElement | null) => {
    ref.current = el
    if (!el || !syncHeight) return
    const others = (useRefStore.getState().value[property] || []).filter(
      Boolean,
    )
    if (ref.current && others.includes(ref.current)) return
    if (ref.current) {
      setStoreValue(property, [...others, ref.current])
    }
  }, [])

  const syncHeightValue = useMemo(
    () =>
      _.debounce(async () => {
        try {
          ref.current?.style.setProperty('height', 'auto')
          await new Promise((resolve) => setTimeout(resolve, 300))
          const elements = useRefStore.getState().value[property] || []
          const height = Math.max(...elements.map((el: any) => el.clientHeight))
          if (height && height !== ref.current?.clientHeight)
            ref.current?.style.setProperty('height', `${height}px`)
        } catch (error) {
          console.error('Error syncing height:', error)
        }
      }, 200),
    [],
  )

  useEffect(() => {
    if (syncHeight) syncHeightValue()
  }, [rect?.width, syncHeightValue, syncHeight, value])

  return (
    <div
      ref={onLoad}
      className={clsx(
        'flex w-[calc(100%+16px)] rounded-md h-fit py-2 text-muted-foreground space-x-4 -mx-2 px-2',
        diffDetail?.diff === -1 && 'bg-red-50',
        diffDetail?.diff === 1 && 'bg-green-50',
      )}
    >
      <div className="flex w-[120px] min-w-[120px]">
        <p className="text-sm font-semibold text-foreground">
          {property}
        </p>
      </div>
      <div
        className={clsx(
          'flex w-full max-h-[180px] overflow-auto',
          diffDetail?.valueDiff === -1 && 'bg-red-50',
          diffDetail?.valueDiff === 1 && 'bg-green-50',
        )}
      >
        {Array.isArray(diffDetail?.valueDiff) && isValidValue ? (
          <div>
            {diffDetail.valueDiff.map((item, index) => (
              <p
                key={index}
                className={clsx(
                  'text-sm break-words',
                  item[0] === -1 && 'bg-red-50',
                  item[0] === 1 && 'bg-green-50',
                )}
              >
                {item[1]}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm break-words">
            {value}
          </p>
        )}
      </div>
    </div>
  )
}

interface DaTablePropertyProps {
  properties: { name: string; value: string }[]
  className?: string
  diffDetail?: any
  syncHeight?: boolean
}

export const DaTableProperty = ({
  properties,
  className,
  diffDetail,
  syncHeight,
}: DaTablePropertyProps) => {
  return (
    <div
      className={cn(
        'flex flex-col h-fit w-full rounded-lg bg-background',
        className,
      )}
    >
      {properties.map((item, index) => (
        <DaTablePropertyItem
          key={index}
          property={item.name}
          value={item.value}
          diffDetail={diffDetail?.[item.name]}
          syncHeight={syncHeight}
        />
      ))}
    </div>
  )
}
