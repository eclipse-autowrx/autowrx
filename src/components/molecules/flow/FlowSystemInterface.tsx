import { useState } from 'react'
import { SignalFlow, Direction } from '@/types/flow.type'
import { useParams } from 'react-router-dom'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '@radix-ui/react-context-menu'
import DaTooltip from '@/components/atoms/DaTooltip'
import {
  TbArrowLeft,
  TbArrowRight,
  TbArrowsHorizontal,
  TbX,
} from 'react-icons/tb'

type InterfaceType = 'p2c' | 'v2c' | 's2s' | 's2e'

interface SystemInterfaceData {
  endpointUrl?: string
  name?: string
  [key: string]: string | undefined
}

const interfaceTypeLabels: Record<InterfaceType, string> = {
  p2c: 'Phone to Cloud',
  v2c: 'Vehicle to Cloud',
  s2s: 'Signal to Service',
  s2e: 'Signal to Embedded',
}

const formatFieldLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
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
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  if (!flow) return <div className="p-2"></div>

  const isJsonString = (str: string) => {
    try {
      JSON.parse(str)
      return true
    } catch (e) {
      return false
    }
  }

  const parseInterfaceData = (
    input: string,
  ): {
    displayText: string
    data: SystemInterfaceData | null
  } => {
    // Handle JSON input
    if (isJsonString(input)) {
      const jsonData = JSON.parse(input) as SystemInterfaceData
      return {
        displayText: jsonData.endpointUrl || jsonData.name || input,
        data: jsonData,
      }
    }

    // Handle traditional text input
    return {
      displayText: input,
      data: null,
    }
  }

  const { displayText, data } = parseInterfaceData(flow.signal)
  const isLink =
    displayText.startsWith('https://') ||
    data?.endpointUrl?.startsWith('https://')
  const isVehicle =
    displayText.startsWith('Vehicle.') || data?.name?.startsWith('Vehicle.')

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click if context menu is open
    if (isContextMenuOpen) {
      e.preventDefault()
      return
    }

    if (isVehicle) {
      const signalPath = data?.name || displayText
      const url = `${window.location.origin}/model/${model_id}/api/${signalPath}`
      window.open(url, '_blank')
    }
  }

  const getTooltipContent = () => {
    if (data) {
      // For JSON data, return endpointUrl or name based on what's available
      return data.endpointUrl || data.name || displayText
    }
    // For traditional string input, return the original text
    return displayText
  }

  const Content = (
    <ContextMenu onOpenChange={setIsContextMenuOpen}>
      <ContextMenuTrigger>
        <DaTooltip content={getTooltipContent()}>
          <DirectionArrow direction={flow.direction} />
        </DaTooltip>
      </ContextMenuTrigger>
      <ContextMenuContent className="flex flex-col w-full bg-white p-3 border rounded-lg min-w-[250px] max-w-[400px] z-10">
        <div className="flex w-full justify-between items-center mb-2">
          <div className="flex text-sm font-bold text-da-primary-500">
            System Interface
          </div>
          <button
            className="p-0.5 hover:text-red-500 hover:bg-red-100 rounded-md"
            onClick={(e) => {
              const menu = e.currentTarget.closest('[role="menu"]')
              if (menu) {
                menu.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'Escape' }),
                )
              }
            }}
          >
            <TbX className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col space-y-1">
          {/* Interface Type */}
          <div className="flex">
            <span className="font-semibold text-da-gray-dark mr-1">Type: </span>
            {interfaceTypeLabels[interfaceType]}
          </div>

          {data ? (
            // Render JSON data
            Object.entries(data)
              .filter(([key]) => key !== '__typename') // Exclude GraphQL typename if present
              .map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="font-semibold text-da-gray-dark mr-1">
                    {formatFieldLabel(key)}:{' '}
                  </span>
                  <span className="text-da-gray-dark break-all">{value}</span>
                </div>
              ))
          ) : (
            // Render traditional text input
            <>
              <div className="flex">
                <span className="font-semibold text-da-gray-dark mr-1">
                  {isLink ? 'Endpoint URL' : 'Name'}:{' '}
                </span>
                <span className="text-da-gray-dark break-all">
                  {displayText}
                </span>
              </div>
              <div className="flex">
                <span className="font-semibold text-da-gray-dark mr-1">
                  Direction:{' '}
                </span>
                <span className="text-da-gray-dark">
                  {flow.direction.charAt(0).toUpperCase() +
                    flow.direction.slice(1)}
                </span>
              </div>
            </>
          )}
        </div>
      </ContextMenuContent>
    </ContextMenu>
  )

  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer min-h-7 justify-center">
      {flow.signal &&
        (isLink ? (
          <a
            href={data?.endpointUrl || displayText}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => isContextMenuOpen && e.preventDefault()}
          >
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
