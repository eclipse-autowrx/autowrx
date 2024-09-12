import { DaText } from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import { TbArrowRight } from 'react-icons/tb'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

interface CardIntroProps {
  title: string
  content: string
  url?: string
}

const DaCardIntroBig = ({ title, content, url }: CardIntroProps) => {
  return (
    <Link
      to={url || '#'}
      className={clsx(
        'flex flex-col min-h-28 w-full h-full bg-da-white rounded-lg border p-4 select-none',
        url ? 'hover:border-da-primary-300' : 'pointer-events-none',
      )}
    >
      <div className="flex w-full items-center space-x-2">
        <DaText variant="title" className="text-da-gray-medium w-full min-h-8">
          {title}
        </DaText>
      </div>
      <DaText variant="small" className=" text-da-gray-medium mt-2">
        {content}
      </DaText>
    </Link>
  )
}

export { DaCardIntroBig }
