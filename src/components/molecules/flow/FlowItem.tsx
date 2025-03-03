import { TbEdit, TbX } from 'react-icons/tb'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/atoms/dropdown-menu'
import { useSystemUI } from '@/hooks/useSystemUI'
import { ASILBadge, ASILLevel } from './ASILBadge'
import RiskAssessmentMarkdown from './RiskAssessmentMarkdown'
import { defaultRiskAssessmentPlaceholder } from './FlowItemEditor'
import { DaButton } from '@/components/atoms/DaButton'
import FlowItemEditor from './FlowItemEditor'

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
  riskAssessmentEvaluation?: string
}

interface FlowItemActivityProps {
  stringData: string
  // New optional onChange callback to propagate edited content
  onChange?: (newValue: string) => void
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
    // Determine pre-Mitigation ASIL: prefer preAsilLevel, then asilLevel, then default 'QM'
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

  // Fallback for non-JSON stringData input:
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
    postAsilLevel: 'QM', // default for plain text input
    riskAssessment: '',
    data: null,
  }
}

const FlowItem = ({ stringData, onChange }: FlowItemActivityProps) => {
  const { showPrototypeFlowASIL } = useSystemUI()

  // Parse the input stringData
  const { displayText, preAsilLevel, postAsilLevel, data } =
    parseActivityData(stringData)

  // Determine the content to display.
  const content = data !== null ? displayText : displayText || stringData

  // Only show the ASILBadge if:
  // - preAsilLevel exists AND
  // - For JSON input, the parsed description is non-empty.
  // - For plain text, the original stringData is non-empty.
  const shouldShowBadge =
    preAsilLevel &&
    (data !== null ? displayText.trim() !== '' : stringData.trim() !== '')

  // If nothing was parsed (and nothing to show), simply return the stringData.
  if (!content && !preAsilLevel) {
    return <div>{stringData}</div>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="p-1 flex items-center justify-center gap-2.5 min-h-7">
          <span>{content}</span>
          {shouldShowBadge && (
            <ASILBadge
              preAsilLevel={preAsilLevel}
              postAsilLevel={postAsilLevel || 'QM'}
              showBadge={showPrototypeFlowASIL}
            />
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="flex flex-col text-xs bg-white p-3 -my-2 border rounded-lg overflow-y-auto max-h-[50vh] min-w-[250px] w-[500px] z-10">
        <div className="flex justify-between items-center mb-2">
          <div className="flex text-sm font-bold text-da-primary-500">
            System Activity
          </div>
          <div className="flex items-center space-x-1">
            {/* Wrap the Edit button with FlowItemEditor so that it opens the modal */}
            <FlowItemEditor
              value={stringData}
              onChange={(updatedValue) => {
                // Propagate the updated JSON string back to the parent (if provided)
                if (onChange) onChange(updatedValue)
              }}
            >
              <DaButton
                size="sm"
                variant="plain"
                className="flex ml-1 !h-6 !p-2 !text-xs !text-da-primary-500"
              >
                <TbEdit className="size-3.5 mr-1" /> Edit
              </DaButton>
            </FlowItemEditor>
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
        </div>
        {/* Existing details in the dropdown */}
        <div className="flex flex-col h-full overflow-y-auto scroll-gray">
          {data ? (
            <div className="flex flex-col space-y-1.5">
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
                      Hazard Analysis and Risk Assessment:
                    </span>
                    <div className="flex h-full overflow-auto mt-1 ml-4">
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
                      'riskAssessmentEvaluation',
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
                {displayText || stringData}
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
