import { DaCardIntroBig } from '../molecules/DaCardIntroBig'
import { useNavigate } from 'react-router-dom'
import config from '@/configs/config'

const cardData = [
  {
    title: 'Vehicle Signal Catalogue',
    content:
      'Browse, explore and enhance the catalogue of Connected Vehicle Interfaces',
    buttonText: 'Getting Started',
    path: `model/${config.defaultModelId}/api`,
  },
  {
    title: 'Prototyping',
    content:
      'Build and test new connected vehicle app prototypes in the browser, using Python and the Vehicle Signals',
    buttonText: 'Getting Started',
    path: '/model',
  },
  {
    title: 'User Feedback',
    content:
      'Collect and evaluate user feedback to prioritize your development portfolio',
    buttonText: 'Getting Started',
    path: `model/${config.defaultModelId}/api`,
  },
]

const HomeIntroBlock = () => {
  const navigate = useNavigate()

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  return (
    <div className="flex container justify-center w-full">
      <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-12">
        {cardData.map((card, index) => (
          <div key={index} className="flex w-full items-center justify-center">
            <DaCardIntroBig
              key={index}
              title={card.title}
              content={card.content}
              buttonText={card.buttonText}
              maxWidth={'600px'}
              onClick={() => {
                handleNavigation(card.path ? card.path : '/')
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export { HomeIntroBlock }
