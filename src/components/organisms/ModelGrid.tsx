import { DaItemVerticalStandard } from "../molecules/DaItemVerticalStandard"
import { DaItemVerticalType2 } from "../molecules/DaItemVerticalType2"
import { DaText } from "../atoms/DaText"
import useListModelLite from "@/hooks/useListModelLite"
import { Link } from "react-router-dom"

const ModelGrid: React.FC = () => {
  const { data: items } = useListModelLite()
  // const items = [
  //     {
  //         title: 'ACME Car (ICE) v0.1',
  //         tags: ['public'],
  //         imageUrl: 'https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/E-Car_Full_Vehicle.png',
  //     },
  //     {
  //         title: 'AUTOCRYPT',
  //         tags: ['public'],
  //         imageUrl: 'https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/car_full_ed.PNG',
  //     },
  //     {
  //         title: 'Basic Actuators with COVESA',
  //         tags: ['public'],
  //         imageUrl: 'https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/car_full_ed.PNG',
  //     },
  //     {
  //         title: 'BCW24_digital_auto_cool_SBSBM',
  //         tags: ['public'],
  //         imageUrl: 'https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/car_full_ed.PNG',
  //     },
  // ]

  return (
    <div className='flex flex-col w-full items-center'>
      <div className='w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4'>
        {items?.results?.map((item, index) => (
          <Link key={index} to={`/model/${item.id}`}>
            <DaItemVerticalType2
              title={item.name}
              imageUrl={item.model_home_image_file}
              tags={item.tags?.map((tag) => `${tag.tagCategoryName}/${tag.tag}`) || []}
              maxWidth='800px'
            />
          </Link>
        ))}
      </div>
    </div>
  )
}

export { ModelGrid }
