import {
  TbArrowLeft,
  TbArrowRight,
  TbArrowsLeftRight,
  TbCornerDownLeft,
  TbCornerDownRight,
  TbArrowsRightLeft,
} from 'react-icons/tb'
import { Direction } from '@/types/flow.type'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'

interface FlowDirectionSelectProps {
  value: Direction
  onChange: (value: Direction) => void
}

const FlowDirectionSelector = ({
  value,
  onChange,
}: FlowDirectionSelectProps) => {
  const directionOptions = [
    {
      value: 'left',
      icon: <TbArrowLeft className="size-5" />,
    },
    {
      value: 'right',
      icon: <TbArrowRight className="size-5" />,
    },
    {
      value: 'bi-direction',
      icon: <TbArrowsRightLeft className="size-5" />,
    },
    {
      value: 'reverse-bi-direction',
      icon: <TbArrowsLeftRight className="size-5" />,
    },
    {
      value: 'down-left',
      icon: <TbCornerDownLeft className="size-5" />,
    },
    {
      value: 'down-right',
      icon: <TbCornerDownRight className="size-5" />,
    },
  ] as const

  const handleValueChange = (newValue: string) => {
    onChange(newValue as Direction)
  }

  return (
    <DaSelect
      className="h-9 rounded-md"
      value={value}
      onValueChange={handleValueChange}
      placeholderClassName="flex justify-center items-center w-full"
    >
      {directionOptions.map((direction, index) => (
        <DaSelectItem
          className="flex w-full justify-center items-center"
          value={direction.value}
          key={index}
        >
          {direction.icon}
        </DaSelectItem>
      ))}
    </DaSelect>
  )
}

export default FlowDirectionSelector
