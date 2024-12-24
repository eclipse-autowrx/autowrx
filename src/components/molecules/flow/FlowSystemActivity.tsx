import { TbX } from 'react-icons/tb'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/atoms/dropdown-menu'
import { useSystemUI } from '@/hooks/useSystemUI'
import { ASILBadge, ASILLevel } from './ASILBadge'

interface SystemActivityData {
  type: string
  description: string
  asilLevel: ASILLevel
  [key: string]: string
}

interface FlowSystemActivityProps {
  text: string
}

const formatFieldLabel = (key: string): string => {
  switch (key) {
    case 'asilLevel':
      return 'ASIL Rating'
    default:
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
  }
}

const formatFieldValue = (key: string, value: string): string => {
  switch (key) {
    case 'asilLevel':
      return value === 'QM' ? value : `ASIL-${value}`
    default:
      return value
  }
}

const FlowSystemActivity = ({ text }: FlowSystemActivityProps) => {
  const { showPrototypeFlowASIL } = useSystemUI()
  const safetyLevels = ['<ASIL-D>', '<ASIL-C>', '<ASIL-B>', '<ASIL-A>', '<QM>']

  const isValidASILLevel = (level: string): level is ASILLevel => {
    return ['A', 'B', 'C', 'D', 'QM'].includes(level)
  }
  const isJsonString = (str: string) => {
    try {
      JSON.parse(str)
      return true
    } catch (e) {
      return false
    }
  }

  const parseActivityData = (
    input: string,
  ): {
    displayText: string
    asilLevel: ASILLevel | null
    data: SystemActivityData | null
  } => {
    // Handle JSON input
    if (isJsonString(input)) {
      const jsonData = JSON.parse(input)
      const asilValue = jsonData.asilLevel || null
      const standardizedAsilLevel = asilValue
        ? (asilValue.replace('ASIL-', '').trim() as ASILLevel)
        : null

      return {
        displayText: jsonData.description,
        asilLevel: standardizedAsilLevel,
        data: {
          ...jsonData,
          asilLevel: standardizedAsilLevel,
        },
      }
    }

    // Handle traditional text input
    const matchedLevel = safetyLevels.find((level) => input.includes(level))
    let displayText = input
    let extractedLevel: ASILLevel | null = null

    if (matchedLevel) {
      displayText = input.replace(matchedLevel, '').trim()
      let level = matchedLevel.startsWith('<ASIL-')
        ? matchedLevel.replace(/<ASIL-|>/g, '')
        : matchedLevel.replace(/[<>]/g, '')

      if (isValidASILLevel(level)) {
        extractedLevel = level
      }
    }

    return {
      displayText: displayText || input,
      asilLevel: extractedLevel,
      data: null,
    }
  }

  const { displayText, asilLevel, data } = parseActivityData(text)

  if (!displayText && !asilLevel) {
    return <div>{text}</div>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="p-1 flex items-center justify-center gap-1 min-h-7">
          <span>{displayText || text}</span>
          {asilLevel && (
            <ASILBadge level={asilLevel} showBadge={showPrototypeFlowASIL} />
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="flex flex-col text-xs w-full bg-white p-3 border rounded-lg min-w-[250px] max-w-[400px] z-10">
        <div className="flex justify-between items-center mb-2">
          <div className="flex text-sm font-bold text-da-primary-500">
            System Activity
          </div>
          <button
            className="p-0.5 hover:text-red-500 hover:bg-red-100 rounded-md"
            onClick={(e) => {
              // Manually dispatch an Escape key event to close the menu
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
          {data ? (
            Object.entries(data).map(([key, value]) => {
              // Check if the value is a string that starts with "https://"
              const isLink =
                typeof value === 'string' && value.startsWith('https://')
              return (
                <div key={key} className="flex">
                  <span className="font-semibold text-da-gray-dark mr-1">
                    {formatFieldLabel(key)}:{' '}
                  </span>
                  {isLink ? (
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-500"
                    >
                      {value}
                    </a>
                  ) : (
                    formatFieldValue(key, value)
                  )}
                </div>
              )
            })
          ) : (
            <>
              <div className="flex">
                <span className="font-semibold text-da-gray-dark mr-1">
                  Description:{' '}
                </span>
                {displayText || text}
              </div>
              {asilLevel && (
                <div className="flex">
                  <span className="font-semibold text-da-gray-dark mr-1">
                    ASIL Rating:{' '}
                  </span>
                  {asilLevel === 'QM' ? 'QM' : `ASIL-${asilLevel}`}
                </div>
              )}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default FlowSystemActivity
