import { TbX } from 'react-icons/tb'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/atoms/dropdown-menu'
import { useSystemUI } from '@/hooks/useSystemUI'
import { ASILBadge, ASILLevel } from './ASILBadge'
import RiskAssessmentMarkdown from './RiskAssessmentMarkdown'
import { defaultRiskAssessmentPlaceholder } from './FlowItemEditor'

interface SystemActivityData {
  type: string
  component: string
  description: string
  preAsilLevel: ASILLevel
  postAsilLevel: ASILLevel
  riskAssessment: string
  approvedBy?: string
  approvedAt?: string
  [key: string]: string | undefined
}

interface FlowItemActivityProps {
  text: string
}

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

/**
 * Parse the input string. If the input is valid JSON, then:
 * - Use jsonData.preAsilLevel if provided; otherwise, fall back to jsonData.asilLevel (defaulting to 'QM').
 * - Extract type, component, description, riskAssessment, etc.
 */
const parseActivityData = (
  input: string,
): {
  displayText: string
  preAsilLevel: ASILLevel | null
  postAsilLevel: ASILLevel | null
  riskAssessment: string
  data: SystemActivityData | null
} => {
  if (isJsonString(input)) {
    const jsonData = JSON.parse(input)
    // Determine preMitigation ASIL: prefer preAsilLevel, then asilLevel, then default 'QM'
    const preAsil = jsonData.preAsilLevel || jsonData.asilLevel || 'QM'
    const postAsil = jsonData.postAsilLevel || 'QM'
    const riskAssessment = jsonData.riskAssessment || ''
    return {
      displayText: jsonData.description || '',
      preAsilLevel: preAsil,
      postAsilLevel: postAsil,
      riskAssessment,
      data: {
        ...jsonData,
        type: jsonData.type || '',
        component: jsonData.component || '',
        description: jsonData.description || '',
        preAsilLevel: preAsil,
        postAsilLevel: postAsil,
        riskAssessment,
        approvedBy: jsonData.approvedBy || '',
        approvedAt: jsonData.approvedAt || '',
      },
    }
  }

  // Fallback for non-JSON text input:
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
    preAsilLevel: extractedLevel,
    postAsilLevel: 'QM', // default for text input
    riskAssessment: '',
    data: null,
  }
}

const FlowItem = ({ text }: FlowItemActivityProps) => {
  const { showPrototypeFlowASIL } = useSystemUI()

  // Parse the input text
  const { displayText, preAsilLevel, postAsilLevel, riskAssessment, data } =
    parseActivityData(text)

  // If nothing was parsed, simply return the text.
  if (!displayText && !preAsilLevel) {
    return <div>{text}</div>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="p-1 flex items-center justify-center gap-1 min-h-7">
          <span>{displayText || text}</span>
          {preAsilLevel && (
            <ASILBadge
              preAsilLevel={preAsilLevel}
              postAsilLevel={postAsilLevel || 'QM'}
              showBadge={showPrototypeFlowASIL}
            />
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="flex flex-col text-xs w-full bg-white p-3 border rounded-lg overflow-y-auto  max-h-[40vh] min-w-[250px] max-w-[500px] z-10">
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
        <div className="flex flex-col space-y-1 h-full overflow-y-auto scroll-gray">
          {data ? (
            <div className="flex flex-col space-y-1">
              {/* Fields in desired order */}
              {data.type && (
                <div className="flex">
                  <span className="font-semibold text-da-gray-dark mr-1">
                    Type:
                  </span>
                  <span>{data.type}</span>
                </div>
              )}
              {data.component && (
                <div className="flex">
                  <span className="font-semibold text-da-gray-dark mr-1">
                    Component:
                  </span>
                  <span>{data.component}</span>
                </div>
              )}
              {data.description && (
                <div className="flex">
                  <span className="font-semibold text-da-gray-dark mr-1">
                    Description:
                  </span>
                  <span>{data.description}</span>
                </div>
              )}
              <div className="flex">
                <span className="font-semibold text-da-gray-dark mr-1">
                  Pre-Mitigation ASIL:
                </span>
                <span>
                  {data.preAsilLevel === 'QM'
                    ? 'QM'
                    : `ASIL-${data.preAsilLevel}`}
                </span>
              </div>
              <div className="flex">
                <span className="font-semibold text-da-gray-dark mr-1">
                  Post-Mitigation ASIL:
                </span>
                <span>
                  {data.postAsilLevel === 'QM'
                    ? 'QM'
                    : `ASIL-${data.postAsilLevel}`}
                </span>
              </div>
              {data.riskAssessment &&
                data.riskAssessment !== defaultRiskAssessmentPlaceholder && (
                  <div className="flex flex-col">
                    <span className="font-semibold text-da-gray-dark mr-1">
                      Risk Assessment:
                    </span>
                    <div className="flex h-full overflow-auto mt-1">
                      <RiskAssessmentMarkdown
                        markdownText={data.riskAssessment || ''}
                      />
                    </div>
                  </div>
                )}
              {data.approvedBy && (
                <div className="flex">
                  <span className="font-semibold text-da-gray-dark mr-1">
                    Approved By:
                  </span>
                  <span>{data.approvedBy}</span>
                </div>
              )}
              {data.approvedAt && (
                <div className="flex">
                  <span className="font-semibold text-da-gray-dark mr-1">
                    Approved At:
                  </span>
                  <span>{new Date(data.approvedAt).toLocaleString()}</span>
                </div>
              )}
              {/* Render any additional custom attributes */}
              {Object.entries(data)
                .filter(
                  ([key]) =>
                    ![
                      'type',
                      'component',
                      'description',
                      'preAsilLevel',
                      'postAsilLevel',
                      'riskAssessment',
                      'approvedBy',
                      'approvedAt',
                      'asilLevel',
                      'generatedAt',
                    ].includes(key),
                )
                .map(([key, value]) => {
                  const isLink =
                    typeof value === 'string' && value.startsWith('https://')
                  return (
                    <div key={key} className="flex">
                      <span className="font-semibold text-da-gray-dark mr-1">
                        {formatFieldLabel(key)}:
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
                        <span>{formatFieldValue(key, value)}</span>
                      )}
                    </div>
                  )
                })}
            </div>
          ) : (
            <>
              <div className="flex">
                <span className="font-semibold text-da-gray-dark mr-1">
                  Description:
                </span>
                {displayText || text}
              </div>
              {preAsilLevel && (
                <div className="flex">
                  <span className="font-semibold text-da-gray-dark mr-1">
                    ASIL Rating:
                  </span>
                  {preAsilLevel === 'QM' ? 'QM' : `ASIL-${preAsilLevel}`}
                </div>
              )}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const formatFieldLabel = (key: string): string => {
  switch (key) {
    case 'asilLevel':
      return 'ASIL Rating'
    case 'preAsilLevel':
      return 'Pre-Mitigation ASIL'
    case 'postAsilLevel':
      return 'Post-Mitigation ASIL'
    case 'riskAssessment':
      return 'Risk Assessment'
    case 'approvedBy':
      return 'Approved By'
    case 'approvedAt':
      return 'Approved At'
    default:
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
  }
}

const formatFieldValue = (key: string, value: string | undefined): string => {
  const safeValue = value || ''
  switch (key) {
    case 'asilLevel':
      return safeValue === 'QM' ? safeValue : `ASIL-${safeValue}`
    default:
      return safeValue
  }
}

export default FlowItem
