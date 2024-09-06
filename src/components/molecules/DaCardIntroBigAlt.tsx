import { DaText } from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import { TbArrowRight } from 'react-icons/tb'

interface CardIntroProps {
  title: string
  content: string
}

const DaCardIntroBig = ({ title, content }: CardIntroProps) => {
  return (
    <div
      className={`flex flex-col min-h-28 w-full bg-da-white rounded-lg  justify-center  border p-4 select-none`}
    >
      <div className="flex w-full items-center space-x-2">
        <DaText variant="title" className="text-da-gray-medium w-full">
          {title}
        </DaText>
      </div>
      <DaText variant="small" className=" text-da-gray-medium mt-2">
        {content}
      </DaText>
    </div>
  )
}

export { DaCardIntroBig }
