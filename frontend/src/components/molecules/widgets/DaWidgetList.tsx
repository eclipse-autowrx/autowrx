// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useEffect, useState } from 'react'
import { MdOutlineWidgets } from 'react-icons/md'
import { TbDownload, TbHeart, TbSearch, TbStarFilled } from 'react-icons/tb'
import { Input } from '@/components/atoms/input'
import { Button } from '@/components/atoms/button'
import CodeEditor from '@/components/molecules/CodeEditor'
import { searchWidget, loadWidgetReviews } from '@/services/widget.service'
import { DaImage } from '@/components/atoms/DaImage'

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
      setWidgetReviews(reviews || [])
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
      let options = JSON.parse(JSON.stringify(activeWidget.options))
      delete options.url
      setOptionStr(JSON.stringify(options, null, 4))
    } else {
      setOptionStr('{}')
    }
  }, [activeWidget])

  return (
    <div className="flex w-full h-full space-x-2">
      <div className="flex flex-col w-[320px] h-full mr-2">
        {renderWidgets && (
          <div className="flex flex-col w-full h-full ">
            <div className="relative">
              <TbSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10 text-base"
                placeholder="Search Widget"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="flex flex-col h-full overflow-y-auto space-y-2 mt-3">
              {renderWidgets
                .filter((widget: any) => {
                  const label = widget.label || widget.widget || ''
                  return label.toLowerCase().includes(searchText.toLowerCase())
                })
                .map((widget: any, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      fetchWidgetDetails(widget)
                    }}
                    className={`flex h-[120px] rounded px-1 py-1 mr-2 cursor-pointer border hover:border-gray-400 ${
                      activeWidget &&
                      activeWidget.plugin === widget.plugin &&
                      activeWidget.id === widget.id
                        ? 'border-primary'
                        : ''
                    }`}
                  >
                    <div className="aspect-square grid place-items-center min-w-[100px]">
                      {!widget.icon && (
                        <MdOutlineWidgets size={52} className="text-gray-300" />
                      )}
                      {widget.icon && (
                        <img
                          src={widget.icon}
                          className="w-[100px] aspect-square rounded-lg object-contain"
                          alt={widget.label || widget.widget}
                        />
                      )}
                    </div>
                    <div className="widget-list-item px-4 py-1 truncate text-ellipsis text-primary text-base">
                      <div className="font-semibold widget-list-item-name">
                        {widget.label || widget.widget}
                      </div>
                      <div className="py-1 text-sm leading-tight max-h-[30px] max-w-max truncate text-ellipsis text-muted-foreground">
                        {widget.desc}
                      </div>
                      {widget.likes != undefined && (
                        <>
                          <div className="mt-2 flex items-center text-muted-foreground text-xs">
                            <TbHeart
                              className="w-4 h-4"
                              style={{ strokeWidth: 1.8 }}
                            />
                            <div className="ml-1 mr-4">
                              {widget.likes?.length || 0}
                            </div>
                            <TbDownload
                              className="w-4 h-4"
                              style={{ strokeWidth: 1.8 }}
                            />
                            <div className="ml-1">{widget.downloads || 0}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col w-full h-full pl-4 overflow-auto ">
        {!activeWidget && (
          <div className="flex w-full h-full items-center justify-center ">
            Select a widget to view details
          </div>
        )}
        {activeWidget && (
          <div className="flex flex-col w-full h-full pb-4 flex-1">
            {activeWidget && activeTab === 'market' && activeWidget.id && (
              <div className="flex w-full pr-7 mt-2">
                <DaMarketWidgetDetail activeWidget={activeWidget} />
              </div>
            )}
            <div className="flex flex-col pr-8 pt-1">
              <div className="text-muted-foreground text-sm italic">
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
                    <div className="text-muted-foreground text-md italic">
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

// Placeholder components
const DaMarketWidgetDetail: FC<any> = ({ activeWidget }) => {
  const isWidgetAvailable =
    activeWidget &&
    activeWidget.label &&
    activeWidget.author &&
    activeWidget.desc &&
    activeWidget.thumbnail

  if (!isWidgetAvailable) {
    return (
      <div className="flex flex-col w-full h-fit text-muted-foreground bg-muted items-center justify-center px-4 py-12 rounded-lg">
        Please select widget again.
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-fit text-muted-foreground pb-2 items-center justify-center">
      <div className="flex w-full">
        <div className="flex w-full h-full">
          <div className="flex w-[30%] max-w-[200px] h-[40%] max-h-[250px] rounded-lg overflow-hidden">
            <DaImage
              className="aspect-square rounded-lg border border-gray-300 object-contain"
              src={activeWidget.thumbnail}
              alt="thumbnail"
            />
          </div>
          <div className="flex flex-col w-full pl-5 h-[40%] max-h-[300px]">
            <div className="flex w-full justify-between items-center">
              <div className="flex flex-col w-full ">
                <div className="font-semibold text-primary">
                  {activeWidget.label}
                </div>
                <div className="mr-1 text-muted-foreground">
                  {activeWidget.author[0]}
                </div>
              </div>
              <div className="flex w-full space-x-2 items-center justify-end text-xs text-muted-foreground">
                <div className="flex items-center justify-center px-2 py-0.5 bg-muted rounded">
                  <TbHeart className="flex w-3 h-3 text-rose-500 mr-1" />
                  {activeWidget.likes?.length > 0 ? activeWidget.likes.length : 0}
                </div>
                <div className="flex items-center justify-center px-2 py-0.5 bg-muted rounded">
                  <TbDownload className="flex w-3 h-3 text-primary mr-1" />
                  {activeWidget.downloads}
                </div>
              </div>
            </div>
            <div className="flex pt-2 whitespace-pre-line leading-tight overflow-y-auto text-sm">
              {activeWidget.desc}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Review {
  id: string
  rating: number
  content: string
  images: string[]
  createdBy: {
    _id: string
    fullName: string
  }
  createdAt: string
}

const DaWidgetReview: FC<{ reviews: Review[] }> = ({ reviews }) => {
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(3)

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
    return new Date(dateString).toLocaleDateString('en-GB', options)
  }

  const Rating: FC<{ rating: number; outOf?: number }> = ({ rating, outOf = 5 }) => {
    return (
      <div className="flex">
        {[...Array(outOf)].map((_, index) => (
          <TbStarFilled
            key={index}
            className={`h-4 w-4 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full overflow-y-auto">
      {reviews.slice(0, visibleReviewsCount).map((review) => (
        <div
          key={review.id}
          className="flex flex-col p-3 my-2 bg-muted rounded"
        >
          <div className="flex flex-col mb-2 w-full">
            <div className="flex w-full items-center mb-3">
              <img
                src="/imgs/profile.png"
                alt="profile"
                className="flex w-5 h-5 rounded-full"
              />
              <div className="ml-2 text-sm text-muted-foreground">
                {review.createdBy.fullName}
              </div>
            </div>
            <div className="flex items-center">
              <Rating rating={review.rating} />
              <div className="text-xs text-muted-foreground ml-2">
                {formatDate(review.createdAt)}
              </div>
            </div>
          </div>
          <div className="text-muted-foreground">{review.content}</div>
        </div>
      ))}
      {visibleReviewsCount < reviews.length && (
        <Button variant="ghost" onClick={() => setVisibleReviewsCount((prevCount) => prevCount + 5)}>
          See all reviews
        </Button>
      )}
    </div>
  )
}

export default DaWidgetList

