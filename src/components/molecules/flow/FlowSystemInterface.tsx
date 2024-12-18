import { useState } from 'react'
import { SignalFlow, Direction } from '@/types/flow.type'
import { useParams } from 'react-router-dom'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '@radix-ui/react-context-menu'
import DaTooltip from '@/components/atoms/DaTooltip'
import { TbArrowLeft, TbArrowRight, TbArrowsHorizontal } from 'react-icons/tb'

type InterfaceType = 'p2c' | 'v2c' | 's2s' | 's2e'

const interfaceTypeLabels: Record<InterfaceType, string> = {
  p2c: 'Phone to Cloud',
  v2c: 'Vehicle to Cloud',
  s2s: 'Signal to Service',
  s2e: 'Signal to Embedded',
}

interface DirectionArrowProps {
  direction: Direction
}

const DirectionArrow = ({ direction }: DirectionArrowProps) => {
  switch (direction) {
    case 'left':
      return <TbArrowLeft className="mx-auto size-5 text-da-primary-500" />
    case 'right':
      return <TbArrowRight className="mx-auto size-5 text-da-primary-500" />
    case 'bi-direction':
      return (
        <TbArrowsHorizontal className="mx-auto size-5 text-da-primary-500" />
      )
  }
}

interface FlowSystemInterfaceProps {
  flow: SignalFlow | null
  interfaceType: InterfaceType
}

const FlowSystemInterface = ({
  flow,
  interfaceType,
}: FlowSystemInterfaceProps) => {
  const { model_id } = useParams()

  if (!flow) return <div className="p-2"></div>

  const isLink = flow.signal?.startsWith('https://')
  const isVehicle = flow.signal?.startsWith('Vehicle.')

  const handleClick = () => {
    if (isVehicle && flow.signal) {
      const url = `${window.location.origin}/model/${model_id}/api/${flow.signal}`
      window.open(url, '_blank')
    }
  }

  // Helper to get the appropriate label and value for the signal/endpoint
  const getSignalInfo = () => {
    if (isLink) {
      return {
        label: 'Endpoint URL',
        value: flow.signal,
        tooltip: 'External API Endpoint',
      }
    }
    return {
      label: 'Name',
      value: flow.signal,
      tooltip: 'Internal Signal Path',
    }
  }

  const signalInfo = getSignalInfo()

  const Content = (
    <ContextMenu>
      <ContextMenuTrigger>
        <DaTooltip content={signalInfo.tooltip}>
          <DirectionArrow direction={flow.direction} />
        </DaTooltip>
      </ContextMenuTrigger>
      <ContextMenuContent className="flex flex-col w-full bg-white p-3 border rounded-lg min-w-[250px] max-w-[400px] z-10">
        <div className="flex text-sm font-bold text-da-primary-500 mb-2">
          System Interface
        </div>

        <div className="flex flex-col space-y-1">
          {/* Interface Type */}
          <div className="flex">
            <span className="font-semibold text-da-gray-dark mr-1">Type: </span>
            {interfaceTypeLabels[interfaceType]}
          </div>

          {/* Signal Path or Endpoint URL */}
          <div className="flex">
            <span className="font-semibold text-da-gray-dark mr-1">
              {signalInfo.label}:{' '}
            </span>
            <span className="text-da-gray-dark break-all">
              {signalInfo.value}
            </span>
          </div>

          {/* Direction */}
          <div className="flex">
            <span className="font-semibold text-da-gray-dark mr-1">
              Direction:{' '}
            </span>
            <span className="text-da-gray-dark">
              {flow.direction.charAt(0).toUpperCase() + flow.direction.slice(1)}
            </span>
          </div>
        </div>
      </ContextMenuContent>
    </ContextMenu>
  )

  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer min-h-7 justify-center">
      {flow.signal &&
        (isLink ? (
          <a href={flow.signal} target="_blank" rel="noopener noreferrer">
            {Content}
          </a>
        ) : isVehicle ? (
          <div onClick={handleClick}>{Content}</div>
        ) : (
          Content
        ))}
    </div>
  )
}

export default FlowSystemInterface
