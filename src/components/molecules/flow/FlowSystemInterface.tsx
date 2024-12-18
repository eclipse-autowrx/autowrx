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
}

const FlowSystemInterface = ({ flow }: FlowSystemInterfaceProps) => {
  const { model_id } = useParams()

  if (!flow) return <div className="p-2"></div>

  const isLink = flow.signal?.startsWith('https://')
  const isVehicle = flow.signal?.startsWith('Vehicle.')

  const handleClick = () => {
    if (isVehicle && flow.signal) {
      // Construct the URL with origin
      const url = `${window.location.origin}/model/${model_id}/api/${flow.signal}`
      window.open(url, '_blank')
    }
  }

  const Content = (
    <ContextMenu>
      <ContextMenuTrigger>
        <DaTooltip content={flow.signal}>
          <DirectionArrow direction={flow.direction} />
        </DaTooltip>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-white p-4">
        {flow.signal}
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
