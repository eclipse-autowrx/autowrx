import { FC, useEffect, useState } from 'react'
import { MdOutlineWidgets } from 'react-icons/md'
import { TbDownload, TbHeart, TbSearch } from 'react-icons/tb'
import { DaInput } from '../../atoms/DaInput'
import { DaText } from '../../atoms/DaText'
import CodeEditor from '../CodeEditor'
import DaMarketWidgetDetail from './DaMarketWidgetDetail'
import DaWidgetReview from './DaWidgetReview'
import { loadWidgetReviews, searchWidget } from '@/services/widget.service'

interface DaWidgetListProps {
  renderWidgets: any[]
  activeWidgetState: [any, React.Dispatch<React.SetStateAction<any>>]
  activeTab: 'builtin' | 'market' | 'genAI'
}

const DaWidgetList: FC<DaWidgetListProps> = ({
  renderWidgets,
  activeWidgetState: [activeWidget, setActiveWidget],
  activeTab,
}) => {
  const [searchText, setSearchText] = useState<string>('')
  const [optionsStr, setOptionStr] = useState<string>('')
  const [widgetReviews, setWidgetReviews] = useState<any[]>([])
  const [editorHeight, setEditorHeight] = useState('')

  const fetchWidgetDetails = async (widget: any) => {
    if (!widget) return

    if (activeTab === 'market') {
      try {
        const widgetDetails = await searchWidget(widget.id)
        if (widgetDetails) {
          // console.log('widgetDetails', widgetDetails);
          // Update the active widget with detail information and media
          setActiveWidget(widgetDetails)
        }
      } catch (error) {
        console.error('Error fetching widget details:', error)
      }
    } else {
      setActiveWidget(widget) // for builtin widgets
    }
  }

  useEffect(() => {
    const fetchWidgetReviews = async () => {
      if (!activeWidget) {
        setWidgetReviews([])
        return
      }
      const reviews = await loadWidgetReviews(activeWidget.id)
      setWidgetReviews(reviews)
    }

    fetchWidgetReviews()
  }, [activeWidget])

  useEffect(() => {
    const lineHeight = 20
    const lines = optionsStr.split('\n').length // Count the number of new lines
    let calculatedHeight = lines * lineHeight + 15 // 15px for padding at the bottom
    setEditorHeight(`${calculatedHeight}px`)
  }, [optionsStr])

  useEffect(() => {
    if (activeWidget && activeWidget.options) {
      setOptionStr(JSON.stringify(activeWidget.options, null, 4))
    } else {
      setOptionStr('{}')
    }
  }, [activeWidget])

  return (
    <div className="flex items-stretch h-[500px] max-h-[80vh] space-x-2 pt-2">
      <div className="w-[320px] mr-2 flex flex-col">
        {renderWidgets && (
          <>
            <DaInput
              inputClassName="text-[16px] "
              className="bg-da-white border-da-gray-medium"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search Widget"
              iconBefore
              Icon={TbSearch}
              iconSize={20}
            />
            <div className="grow">
              <div className="max-h-[440px] w-full flex flex-col space-y-2 overflow-y-auto scroll-gray mt-3">
                {renderWidgets
                  .filter((widget: any) => {
                    const label = widget.label || widget.widget || ''
                    return label
                      .toLowerCase()
                      .includes(searchText.toLowerCase())
                  })
                  .map((widget: any, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        fetchWidgetDetails(widget)
                      }}
                      className={`flex h-[120px] max-h-[120px] rounded px-1 py-1 mr-2 cursor-pointer border hover:border-gray-400 ${
                        activeWidget &&
                        activeWidget.plugin === widget.plugin &&
                        activeWidget.id === widget.id
                          ? 'border-da-primary-500'
                          : ''
                      }`}
                    >
                      <div className="aspect-square grid place-items-center min-w-[100px] max-w-[100px]">
                        {!widget.icon && (
                          <MdOutlineWidgets
                            size={52}
                            className="text-gray-300"
                          />
                        )}
                        {widget.icon && (
                          <img
                            src={widget.icon}
                            className="w-[100px] aspect-square rounded-lg object-contain"
                          />
                        )}
                      </div>
                      <div className="px-4 py-1 truncate text-ellipsis text-da-primary-500 text-base">
                        <DaText variant="regular-bold">
                          {widget.label || widget.widget}
                        </DaText>
                        {widget.likes != undefined && (
                          <>
                            <div className="py-1 text-sm leading-tight max-h-[30px] max-w-max truncate text-ellipsis text-da-gray-dark">
                              {widget.desc}
                            </div>
                            <div className="mt-2 flex items-center text-da-gray-dark da-label-small">
                              <TbHeart
                                className="w-4 h-4"
                                style={{ strokeWidth: 1.8 }}
                              />
                              <div className="ml-1 mr-4">
                                {widget.likes?.length}
                              </div>
                              <TbDownload
                                className="w-4 h-4"
                                style={{ strokeWidth: 1.8 }}
                              />
                              <div className="ml-1">
                                {widget.downloads || 0}
                              </div>
                            </div>
                          </>
                        )}
                        <div>{}</div>
                      </div>
                    </div>
                  ))}
              </div>
              {renderWidgets.length === 0 && searchText && (
                <div className="grid da-label-regular px-2 text-da-gray-medium italic place-items-center">{`No widget match "${searchText}"`}</div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex grow h-full flex-col pl-4 pr-1 overflow-x-hidden scroll-gray text-da-gray-dark border-l border-da-gray-light">
        {!activeWidget && (
          <div className="bg-da-gray-light text-da-gray-medium da-label-regular w-full h-full rounded-xl grid place-items-center">
            No widget selected
          </div>
        )}
        {activeWidget && (
          <div className="flex flex-col w-full pb-4 flex-1">
            {activeWidget && activeTab === 'market' && activeWidget.id && (
              <div className="flex w-full pr-7 mt-2">
                <DaMarketWidgetDetail activeWidget={activeWidget} />
              </div>
            )}
            <div className="flex flex-col pr-8 pt-1">
              <div className="text-da-gray-medium da-label-regular italic">
                Options
              </div>
              <div
                className="flex pointer-events-none"
                style={{ minHeight: editorHeight }}
              >
                <CodeEditor
                  code={optionsStr}
                  editable={true}
                  setCode={setOptionStr}
                  language="json"
                  onBlur={() => {}}
                />
              </div>
              {activeTab === 'market' &&
                widgetReviews &&
                widgetReviews.length > 0 && (
                  <div className="flex flex-col w-full h-full">
                    <div className="text-da-gray-medium text-md italic">
                      Ratings and reviews
                    </div>
                    <div className="flex flex-col w-full h-full overflow-y-auto">
                      <DaWidgetReview reviews={widgetReviews} />
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DaWidgetList
