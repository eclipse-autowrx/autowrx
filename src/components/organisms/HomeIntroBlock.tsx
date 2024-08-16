import { DaCardIntroBig } from '../molecules/DaCardIntroBigAlt'
import { useNavigate } from 'react-router-dom'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useAuthStore from '@/stores/authStore'
import { DaActionCard } from '../molecules/DaActionCard'
import { FaCar } from 'react-icons/fa'
import {
  TbArrowRight,
  TbCode,
  TbPackageImport,
} from 'react-icons/tb'

const cardData = [
  {
    title: 'Vehicle Signal Catalogue',
    content:
      'Browse, explore and enhance the catalogue of Connected Vehicle Interfaces',
    buttonText: 'Getting Started',
  },
  {
    title: 'Prototyping',
    content:
      'Build and test new connected vehicle app prototypes in the browser, using Python and the Vehicle Signals',
    buttonText: 'Getting Started',
  },
  {
    title: 'User Feedback',
    content:
      'Collect and evaluate user feedback to prioritize your development portfolio',
    buttonText: 'Getting Started',
  },
]

const HomeIntroBlock = () => {
  const navigate = useNavigate()
  const { data: user } = useSelfProfileQuery()
  const { setOpenLoginDialog } = useAuthStore()

  return (
    <div className="flex flex-col container justify-center w-full">
      <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-12 my-6">
        {cardData.map((card, index) => (
          <div key={index} className="flex w-full items-center justify-center">
            <DaCardIntroBig
              key={index}
              title={card.title}
              content={card.content}
            />
          </div>
        ))}
      </div>
      {user && (
        <div className="grid w-full grid-cols-1 md:grid-cols-4 gap-12 mt-12">
          <DaActionCard
            title="New model"
            content="Create a vehicle model"
            icon={<FaCar className="w-7 h-7 text-da-primary-500" />}
            className="w-full"
          />
          <DaActionCard
            title="New prototype"
            content="Quickly develop vehicle app"
            icon={<TbCode className="w-7 h-7 text-da-primary-500" />}
            className="w-full"
          />
          <DaActionCard
            title="Import model"
            content="Import my available model"
            icon={<TbPackageImport className="w-7 h-7 text-da-primary-500" />}
            className="w-full"
          />
          <DaActionCard
            title="My models"
            content="Go to my models"
            icon={<TbArrowRight className="w-7 h-7 text-da-primary-500" />}
            className="w-full"
          />
        </div>
      )}
    </div>
  )
}

export { HomeIntroBlock }
