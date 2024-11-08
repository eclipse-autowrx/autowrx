import { DaText } from '../atoms/DaText'
import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardIntroProps {
  title: string
  content: string
  children?: ReactNode // Accepting children as a prop
}

const DaCardIntroBig = ({ title, content, children }: CardIntroProps) => {
  return (
    <div
      className={clsx(
        'flex flex-col min-h-28 w-full h-full bg-da-white rounded-lg border p-4 select-none',
      )}
    >
      <div className="flex w-full items-center space-x-2">
        <DaText variant="title" className="text-da-gray-dark w-full min-h-8">
          {title}
        </DaText>
      </div>
      <DaText variant="small" className=" text-da-gray-medium mt-2">
        {content}
      </DaText>
      <div className="mt-4 lg:mt-auto">
        {children} {/* Render any passed children here */}
      </div>
    </div>
  )
}

export { DaCardIntroBig }
