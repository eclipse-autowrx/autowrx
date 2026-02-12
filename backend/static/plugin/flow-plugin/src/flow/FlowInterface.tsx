// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import React, { useState, useRef, useEffect } from 'react'
import {
  TbArrowLeft,
  TbArrowRight,
  TbCornerDownLeft,
  TbCornerDownRight,
  TbArrowsLeftRight,
  TbArrowsRightLeft,
  TbX,
} from 'react-icons/tb'
import type { SignalFlow, Direction, Interface } from '../types/flow.type'

interface SystemInterfaceData {
  endpointUrl?: string
  name?: string
  [key: string]: string | undefined
}

const interfaceTypeLabels: Record<Interface, string> = {
  p2c: 'Phone to Cloud',
  v2c: 'Vehicle to Cloud',
  s2s: 'Signal to Service',
  s2e: 'Signal to Embedded',
}

const formatFieldLabel = (key: string): string =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())

const DirectionArrow = ({ direction }: { direction: Direction }) => {
  switch (direction) {
    case 'left':
      return (
        <TbArrowLeft className="mx-auto size-5 text-da-primary-500" />
      )
    case 'right':
      return (
        <TbArrowRight className="mx-auto size-5 text-da-primary-500" />
      )
    case 'bi-direction':
      return (
        <TbArrowsRightLeft className="mx-auto size-5 text-da-primary-500" />
      )
    case 'reverse-bi-direction':
      return (
        <TbArrowsLeftRight className="mx-auto size-5 text-da-primary-500" />
      )
    case 'down-right':
      return (
        <TbCornerDownRight className="mx-auto size-5 text-da-primary-500" />
      )
    case 'down-left':
      return (
        <TbCornerDownLeft className="mx-auto size-5 text-da-primary-500" />
      )
    default:
      return (
        <TbArrowRight className="mx-auto size-5 text-da-primary-500" />
      )
  }
}

interface FlowInterfaceProps {
  flow: SignalFlow | null
  interfaceType: Interface
  modelId?: string
}

export default function FlowInterface({ flow, interfaceType, modelId }: FlowInterfaceProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  if (!flow) return <div className="p-2" />

  const isJsonString = (str: string) => {
    try {
      JSON.parse(str)
      return true
    } catch {
      return false
    }
  }

  const parseInterfaceData = (input: string): { displayText: string; data: SystemInterfaceData | null } => {
    if (isJsonString(input)) {
      const jsonData = JSON.parse(input) as SystemInterfaceData
      return {
        displayText: jsonData.endpointUrl || jsonData.name || input,
        data: jsonData,
      }
    }
    return { displayText: input, data: null }
  }

  const { displayText, data } = parseInterfaceData(flow.signal)
  const getTooltipContent = () =>
    data ? (data.endpointUrl || data.name || displayText) : displayText

  return (
    <div ref={ref} className="relative flex flex-col items-center gap-1 cursor-pointer min-h-7 justify-center">
      {flow.signal && (
        <>
          <div
            title={getTooltipContent()}
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center"
          >
            <DirectionArrow direction={flow.direction} />
          </div>

          {open && (
            <div
              className="absolute left-0 top-full mt-1 flex flex-col text-xs bg-white p-3 border rounded-lg min-w-[250px] max-w-[400px] z-50 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-da-primary-500">System Interface</div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-0.5 rounded hover:opacity-80"
                >
                  <TbX className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col space-y-1 text-da-gray-dark">
                <div className="flex">
                  <span className="font-semibold mr-1">Type:</span>
                  {interfaceTypeLabels[interfaceType]}
                </div>
                {data ? (
                  Object.entries(data)
                    .filter(([key]) => key !== '__typename')
                    .map(([key, value]) => {
                      if (!value) return null
                      const isValueLink = value.startsWith('https://')
                      const isValueVehicle = value.startsWith('Vehicle.')
                      const linkHref = isValueVehicle && modelId
                        ? `${window.location.origin}/model/${modelId}/api/${value}`
                        : isValueLink
                          ? value
                          : ''
                      return (
                        <div key={key} className="flex">
                          <span className="font-semibold mr-1">{formatFieldLabel(key)}:</span>
                          {linkHref ? (
                            <a
                              href={linkHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline break-all text-da-primary-300"
                            >
                              {value}
                            </a>
                          ) : (
                            <span className="break-all">{value}</span>
                          )}
                        </div>
                      )
                    })
                ) : (
                  <>
                    <div className="flex">
                      <span className="font-semibold mr-1">Name:</span>
                      {displayText.startsWith('Vehicle.') && modelId ? (
                        <a
                          href={`${window.location.origin}/model/${modelId}/api/${displayText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-da-primary-300"
                        >
                          {displayText}
                        </a>
                      ) : displayText.startsWith('https://') ? (
                        <a
                          href={displayText}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-da-primary-300"
                        >
                          {displayText}
                        </a>
                      ) : (
                        <span className="break-all">{displayText}</span>
                      )}
                    </div>
                    <div className="flex">
                      <span className="font-semibold mr-1">Direction:</span>
                      {flow.direction.charAt(0).toUpperCase() + flow.direction.slice(1)}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
