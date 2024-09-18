import { useState, useEffect } from 'react'
import { Bubble } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  ChartOptions,
  ChartEvent,
  InteractionItem,
  Plugin,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import useCurrentModel from '@/hooks/useCurrentModel'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import { listPrototypeFeedback } from '@/services/feedback.service'
import DaLoading from '../atoms/DaLoading'
import { DaText } from '../atoms/DaText'
import { getCSSVariable } from '@/lib/utils'

ChartJS.register(LinearScale, PointElement, ChartDataLabels)

const quadrants: Plugin = {
  id: 'quadrants',
  beforeDraw(chart, args, options) {
    const {
      ctx,
      chartArea: { left, top, right, bottom },
      scales: { x, y },
    } = chart
    const midX = x.getPixelForValue(2.5)
    const midY = y.getPixelForValue(2.5)
    ctx.save()
    ctx.fillStyle = options.topLeft || 'transparent'
    ctx.fillRect(left, top, midX - left, midY - top)
    ctx.fillStyle = options.topRight || 'transparent'
    ctx.fillRect(midX, top, right - midX, midY - top)
    ctx.fillStyle = options.bottomRight || 'transparent'
    ctx.fillRect(midX, midY, right - midX, bottom - midY)
    ctx.fillStyle = options.bottomLeft || 'transparent'
    ctx.fillRect(left, midY, midX - left, bottom - midY)
    ctx.restore()
  },
}

const PrototypeLibraryPortfolio = () => {
  const { data: model } = useCurrentModel()
  const { data: prototypes, refetch } = useListModelPrototypes(
    model ? model.id : '',
  )
  const [data, setData] = useState<any>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!prototypes) return
    fetchFeedbackInfo()
  }, [prototypes])

  const fetchAllFeedbacks = async (prototypeId: string) => {
    let feedbacks: any[] = []
    let page = 1
    let totalPages = 1

    while (page <= totalPages) {
      try {
        const res = await listPrototypeFeedback(prototypeId, page)
        feedbacks = feedbacks.concat(res.results)
        totalPages = res.totalPages
        page += 1
      } catch (error) {
        console.error('Error fetching feedbacks:', error)
        break
      }
    }

    return feedbacks
  }

  const fetchFeedbackInfo = async () => {
    if (!prototypes) return
    let protoData = [] as any[]
    try {
      const feedbacksByPrototype = await Promise.all(
        prototypes.map(async (prototype) => {
          const feedbacks = await fetchAllFeedbacks(prototype.id)
          return { prototype, feedbacks }
        }),
      )

      feedbacksByPrototype.forEach(({ prototype, feedbacks }) => {
        let retItem = {
          label: prototype.name,
          href: model
            ? `/model/${model.id}/library/prototype/${prototype.id}/view`
            : '#',
          x: 0,
          y: 0,
          r: 0,
        }
        if (feedbacks.length > 0) {
          const avgNeedsAddressed =
            feedbacks
              .map((f) => f.score?.need_address || 0)
              .reduce((partialSum, a) => partialSum + a, 0) /
              feedbacks.length || 0
          const avgRelevance =
            feedbacks
              .map((f) => f.score?.relevance || 0)
              .reduce((partialSum, a) => partialSum + a, 0) /
              feedbacks.length || 0
          const avgEasyToUse =
            feedbacks
              .map((f) => f.score?.easy_to_use || 0)
              .reduce((partialSum, a) => partialSum + a, 0) /
              feedbacks.length || 0

          retItem.x = avgNeedsAddressed
          retItem.y = avgRelevance
          retItem.r =
            ((avgNeedsAddressed + avgRelevance + avgEasyToUse) / 3) * 5 // Scale the average size
          protoData.push(retItem)
        } else {
          if (prototype.portfolio) {
            retItem.x = prototype.portfolio?.needs_addressed ?? 0
            retItem.y = prototype.portfolio?.relevance ?? 0
            retItem.r =
              ((prototype.portfolio?.needs_addressed ??
                0 + prototype.portfolio?.relevance ??
                0 + prototype.portfolio?.easy_to_use ??
                0) /
                3) *
              5 // Scale the average size
          }
        }
        if (retItem.x + retItem.y + retItem.r > 0) {
          protoData.push(retItem)
        }
      })
    } catch (err) {
      console.log((err as any)?.message)
    }
    setData({
      datasets: [
        {
          data: protoData,
          backgroundColor: getCSSVariable('--da-primary-500'),
        },
      ],
    })
  }

  const options: ChartOptions<'bubble'> = {
    scales: {
      y: {
        title: {
          text: 'Relevance',
          display: true,
        },
        beginAtZero: true,
        grid: {
          display: false,
        },
        ticks: {
          stepSize: 1,
        },
        min: 0,
        max: 6,
      },
      x: {
        title: {
          text: 'Needs addressed?',
          display: true,
        },
        beginAtZero: true,
        grid: {
          display: false,
        },
        ticks: {
          stepSize: 1,
        },
        min: 0,
        max: 6,
      },
    },
    onHover: (
      event: ChartEvent,
      chartElement: InteractionItem[],
      chart: ChartJS,
    ) => {
      const nativeEvent = event.native
      if (nativeEvent && nativeEvent.target) {
        const target = nativeEvent.target as HTMLElement
        target.style.cursor = chartElement[0] ? 'pointer' : 'default'
        setHoveredIndex(chartElement[0] ? chartElement[0].index : null)
      }
    },
    aspectRatio: 2.8,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
      datalabels: {
        anchor: 'end' as 'end',
        align: 'end' as 'end',
        offset: 10,
        padding: {
          top: 4,
          right: 8,
          bottom: 4,
          left: 8,
        },
        backgroundColor: (context) =>
          context.dataIndex === hoveredIndex
            ? getCSSVariable('--da-primary-500')
            : 'rgba(255, 255, 255, 0.5)',
        borderColor: getCSSVariable('--da-gray-light'),
        borderRadius: 4,
        borderWidth: 1,
        color: (context) =>
          context.dataIndex === hoveredIndex
            ? '#FFFFFF'
            : getCSSVariable('--da-gray-medium'),
        font: {
          size: 12,
          weight: 'normal',
        },
        formatter: (value: any) => value.label,
        // Adding custom drawing logic for hovered label
        listeners: {
          enter: (context) => {
            const element =
              context.chart.getDatasetMeta(0).data[context.dataIndex]
            element.options.radius += 10
            context.chart.update()
          },
          leave: (context) => {
            const element =
              context.chart.getDatasetMeta(0).data[context.dataIndex]
            element.options.radius -= 10
            context.chart.update()
          },
        },
      },
    },
    onClick(event: ChartEvent, elements: InteractionItem[], chart: ChartJS) {
      if (elements.length === 0) return
      window.location.href = (elements[0].element as any).$context.raw.href
    },
  }

  return (
    <div className="flex w-full h-full overflow-hidden p-10">
      {data ? (
        data.datasets[0].data.length > 0 ? (
          <Bubble
            options={options}
            data={data}
            plugins={[quadrants, ChartDataLabels]}
          />
        ) : (
          <div className="flex w-full h-full items-center justify-center">
            <DaText variant="title" className="">
              No feedback found.
            </DaText>
          </div>
        )
      ) : (
        <DaLoading
          text="Loading feedbacks"
          timeoutText="Failed to load feedbacks. Please try again."
        />
      )}
    </div>
  )
}

export default PrototypeLibraryPortfolio
