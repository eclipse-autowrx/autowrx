import { useState } from 'react'
import { SignalFlow, Direction } from '@/types/flow.type'
import { useParams } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/atoms/dropdown-menu'
import DaTooltip from '@/components/atoms/DaTooltip'
import {
  TbArrowLeft,
  TbArrowRight,
  TbCornerDownLeft,
  TbCornerDownRight,
  TbArrowsLeftRight,
  TbX,
  TbArrowsRightLeft,
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
      return <TbCornerDownLeft className="mx-auto size-5 text-da-primary-500" />
  }
}

interface FlowSystemInterfaceProps {
  flow: SignalFlow | null
  interfaceType: InterfaceType
}

function FlowSystemInterface({
  flow,
  interfaceType,
}: FlowSystemInterfaceProps) {
  const { model_id } = useParams()
  const [isOpen, setIsOpen] = useState(false)

  if (!flow) return <div className="p-2"></div>

  // Quick helper to detect JSON
  const isJsonString = (str: string) => {
    try {
      JSON.parse(str)
      return true
    } catch (e) {
      return false
    }
  }

  // Parse flow.signal into either JSON data or plain text
  const parseInterfaceData = (
    input: string,
  ): {
    displayText: string
    data: SystemInterfaceData | null
  } => {
    if (isJsonString(input)) {
      const jsonData = JSON.parse(input) as SystemInterfaceData
      return {
        displayText: jsonData.endpointUrl || jsonData.name || input,
        data: jsonData,
      }
    }
    return {
      displayText: input,
      data: null,
    }
  }

  const { displayText, data } = parseInterfaceData(flow.signal)

  const getTooltipContent = () => {
    if (data) {
      // For JSON data, return endpointUrl or name if present; else displayText
      return data.endpointUrl || data.name || displayText
    }
    return displayText
  }

  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer min-h-7 justify-center">
      {flow.signal && (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger>
            <DaTooltip content={getTooltipContent()}>
              <DirectionArrow direction={flow.direction} />
            </DaTooltip>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="flex text-xs flex-col w-full bg-white p-3 border rounded-lg min-w-[250px] max-w-[400px] z-10">
            <div className="flex w-full justify-between items-center mb-2">
              <div className="flex text-sm font-bold text-da-primary-500">
                System Interface
              </div>
              <button
                className="p-0.5 hover:text-red-500 hover:bg-red-100 rounded-md"
                onClick={(e) => {
                  // Manually dispatch "Escape" to close the menu
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

            <div className="flex flex-col space-y-1 text-da-gray-dark">
              {/* Interface Type */}
              <div className="flex">
                <span className="font-semibold mr-1">Type: </span>
                {interfaceTypeLabels[interfaceType]}
              </div>

              {data ? (
                // Render JSON data fields
                Object.entries(data)
                  .filter(([key]) => key !== '__typename')
                  .map(([key, value]) => {
                    if (!value) return null

                    // Check if the value starts with "https://" or "Vehicle."
                    const isValueLink = value.startsWith('https://')
                    const isValueVehicle = value.startsWith('Vehicle.')

                    let linkHref = ''
                    if (isValueVehicle) {
                      linkHref = `${window.location.origin}/model/${model_id}/api/${value}`
                    } else if (isValueLink) {
                      linkHref = value
                    }

                    return (
                      <div key={key} className="flex">
                        <span className="font-semibold mr-1">
                          {formatFieldLabel(key)}:{' '}
                        </span>
                        {isValueLink || isValueVehicle ? (
                          <a
                            href={linkHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-blue-500 break-all"
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
                // Render traditional text input
                <>
                  <div className="flex">
                    <span className="font-semibold mr-1">Name: </span>
                    {(() => {
                      // If `displayText` starts with "https://" or "Vehicle.", make it a link
                      const isValueLink = displayText.startsWith('https://')
                      const isValueVehicle = displayText.startsWith('Vehicle.')

                      let linkHref = ''
                      if (isValueVehicle) {
                        linkHref = `${window.location.origin}/model/${model_id}/api/${displayText}`
                      } else if (isValueLink) {
                        linkHref = displayText
                      }

                      return isValueLink || isValueVehicle ? (
                        <a
                          href={linkHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-500 break-all"
                        >
                          {displayText}
                        </a>
                      ) : (
                        <span className="break-all">{displayText}</span>
                      )
                    })()}
                  </div>

                  <div className="flex">
                    <span className="font-semibold mr-1">Direction: </span>
                    <span>
                      {flow.direction.charAt(0).toUpperCase() +
                        flow.direction.slice(1)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

export default FlowSystemInterface
