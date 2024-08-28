import { DaCardIntroBig } from '../molecules/DaCardIntroBigAlt'
import { useNavigate } from 'react-router-dom'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useAuthStore from '@/stores/authStore'
import { DaActionCard } from '../molecules/DaActionCard'
import { FaCar } from 'react-icons/fa'
import { TbArrowRight, TbCode, TbPackageImport } from 'react-icons/tb'
import FormCreateModel from '../molecules/forms/FormCreateModel'
import FormCreatePrototype from '../molecules/forms/FormCreatePrototype'
import DaPopup from '../atoms/DaPopup'
import FormImportPrototype from '../molecules/forms/FormImportPrototype'
import GenAIPrototypeWizard from './GenAIPrototypeWizard'
import { useState } from 'react'
import { BsStars } from 'react-icons/bs'

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
  const [open, setOpen] = useState(false)

  return (
    <div className="container flex w-full flex-col justify-center">
      <div className="grid w-full grid-cols-1 gap-12 md:grid-cols-3">
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
        <div className="mt-12 grid w-full grid-cols-1 gap-12 md:grid-cols-4">
          <DaPopup
            trigger={
              <DaActionCard
                title="New model"
                content="Create a vehicle model"
                icon={<FaCar className="h-7 w-7 text-da-primary-500" />}
                className="w-full"
              />
            }
          >
            <FormCreateModel />
          </DaPopup>
          <DaPopup
            trigger={
              <DaActionCard
                title="New prototype"
                content="Quickly develop vehicle app"
                icon={<TbCode className="h-7 w-7 text-da-primary-500" />}
                className="w-full"
              />
            }
          >
            <FormCreatePrototype />
          </DaPopup>
          <DaActionCard
            title="Build with AI"
            content="Build prototype with GenAI"
            icon={<BsStars className="h-7 w-7 text-da-primary-500" />}
            onClick={() => setOpen(true)}
            className="w-full"
          />
          <GenAIPrototypeWizard open={open} setOpen={setOpen} />
          {/* <DaPopup
            trigger={
              <DaActionCard
                title="Build with AI"
                content="Build prototype with GenAI"
                icon={
                  <TbPackageImport className="h-7 w-7 text-da-primary-500" />
                }
                className="w-full"
              />
            }
          >
            <FormImportPrototype />
          </DaPopup> */}

          <DaActionCard
            title="My models"
            content="Go to my models"
            icon={<TbArrowRight className="h-7 w-7 text-da-primary-500" />}
            className="w-full"
            onClick={() => navigate('/model')}
          />
        </div>
      )}
    </div>
  )
}

export { HomeIntroBlock }
