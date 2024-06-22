// import SlickCarousel from "../../../reusable/Carousel/SlickCarousel";
import { TbHeartFilled, TbDownload } from 'react-icons/tb'
import { FC } from 'react'
import { DaText } from '@/components/atoms/DaText'
import { DaImage } from '@/components/atoms/DaImage'

const DaMarketWidgetDetail: FC<any> = ({ activeWidget }) => {
  // Check if activeWidget and its properties are defined
  const isWidgetAvailable =
    activeWidget &&
    activeWidget.label &&
    activeWidget.author &&
    activeWidget.desc &&
    activeWidget.thumbnail &&
    activeWidget.images

  // Default content or error message if activeWidget is not available
  if (!isWidgetAvailable) {
    return (
      <div className="flex flex-col w-full h-fit text-da-gray-dark bg-da-gray-light items-center justify-center px-4 py-12 rounded-lg">
        Please select widget again.
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-fit text-da-gray-medium pb-2 items-center justify-center">
      <div className="flex w-full">
        <div className="flex w-full h-full">
          <div className="flex w-[30%] max-w-[200px] h-[40%] max-h-[250px]  rounded-lg overflow-hidden">
            <DaImage
              className="aspect-square rounded-lg border border-da-gray-medium object-contain"
              src={activeWidget.thumbnail}
              alt="thumbnail"
            />
          </div>
          <div className="flex flex-col w-full pl-5 h-[40%] max-h-[300px]">
            <div className="flex w-full justify-between items-center">
              <div className="flex flex-col w-full ">
                <DaText variant="regular-bold" className="text-da-primary-500">
                  {activeWidget.label}
                </DaText>
                <DaText variant="regular" className="mr-1 text-da-gray-medium">
                  {activeWidget.author[0]}
                </DaText>
              </div>
              <div className="flex w-full space-x-2 items-center justify-end da-label-small text-da-gray-medium">
                <div className="flex items-center justify-center px-2 py-0.5 bg-da-gray-light rounded">
                  <TbHeartFilled className="flex w-3 h-3 text-da-accent-500 mr-1" />
                  {activeWidget.likes?.lenght > 0
                    ? activeWidget.likes.lenght
                    : 0}
                </div>
                <div className="flex items-center justify-center px-2 py-0.5 bg-da-gray-light rounded">
                  <TbDownload className="flex w-3 h-3 text-da-primary-500 mr-1" />
                  {activeWidget.downloads}
                </div>
              </div>
            </div>
            <div className="flex pt-2 whitespace-pre-line leading-tight overflow-y-auto scroll-gray da-label-small">
              {activeWidget.desc}
            </div>
          </div>
        </div>
      </div>
      {/* <div className="flex w-[90%] pt-4">
                <SlickCarousel images={activeWidget.images} />
            </div> */}
    </div>
  )
}

export default DaMarketWidgetDetail
