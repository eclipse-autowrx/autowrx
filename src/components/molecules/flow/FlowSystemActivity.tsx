import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '@radix-ui/react-context-menu'
import { useSystemUI } from '@/hooks/useSystemUI'
import { cn } from '@/lib/utils'
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

    // Always return the input text (either cleaned from ASIL or original)
    return {
      displayText: displayText || input, // Fallback to original input if displayText is empty
      asilLevel: extractedLevel,
      data: null,
    }
  }

  const { displayText, asilLevel, data } = parseActivityData(text)

  if (!displayText && !asilLevel) {
    return <div>{text}</div>
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="p-1 flex items-center justify-center gap-1 min-h-7">
          <span className="">{displayText || text}</span>{' '}
          {/* Use original text if displayText is empty */}
          {asilLevel && (
            <ASILBadge level={asilLevel} showBadge={showPrototypeFlowASIL} />
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="flex flex-col w-full bg-white p-3 border rounded-lg min-w-[250px] max-w-[400px] z-10">
        <div className="flex text-sm font-bold text-da-primary-500 mb-2">
          System Activity
        </div>

        <div className="flex flex-col space-y-1">
          {data ? (
            // Render full JSON data
            Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="font-semibold text-da-gray-dark mr-1">
                  {formatFieldLabel(key)}:{' '}
                </span>
                {formatFieldValue(key, value)}
              </div>
            ))
          ) : (
            // Render minimal info for traditional text input
            <>
              <div className="flex">
                <span className="font-semibold text-da-gray-dark mr-1">
                  Description:{' '}
                </span>
                {displayText || text}{' '}
                {/* Use original text if displayText is empty */}
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
      </ContextMenuContent>
    </ContextMenu>
  )
}

export default FlowSystemActivity
