import DaText from '../atoms/DaText'

type HomeNewsProps = {
  title?: string
}

const HomeNews = ({ title }: HomeNewsProps) => {
  return (
    <div className="flex flex-col w-full container">
      <DaText variant="sub-title" className="text-da-primary-500">
        {title || 'Popular Prototypes'}
      </DaText>
      <div className="mt-2 bg-gray-300 rounded-md h-[400px]"></div>
    </div>
  )
}

export default HomeNews
