import { DaCardIntroBig } from '../molecules/DaCardIntroBigAlt'
import { useNavigate } from 'react-router-dom'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useAuthStore from '@/stores/authStore'
import { DaActionCard } from '../molecules/DaActionCard'
import { FaCar } from 'react-icons/fa'
import { TbArrowRight, TbCode, TbPackageImport } from 'react-icons/tb'
import FormCreateModel from '../molecules/forms/FormCreateModel'
import FormImportPrototype from '../molecules/forms/FormImportPrototype'
import FormCreatePrototype from '../molecules/forms/FormCreatePrototype'
import DaPopup from '../atoms/DaPopup'
import { useState } from 'react'
import { BsStars } from 'react-icons/bs'
import { useFeatureCards } from '@/hooks/useInstanceCfg'
import config from '@/configs/config'

const HomeIntroBlock = () => {
  const navigate = useNavigate()
  const { data: user } = useSelfProfileQuery()
  const [open, setOpen] = useState(false)
  const cardData = useFeatureCards()

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

          {config && config.showGenAIWizard ? (
            <DaActionCard
              title="Vehicle app generator"
              content="Create apps with GenAI"
              icon={<BsStars className="h-7 w-7 text-da-primary-500" />}
              onClick={() => navigate('/genai-wizard')}
              className="w-full"
            />
          ) : (
            <DaPopup
              trigger={
                <DaActionCard
                  title="Import Prototype"
                  content="Import existing prototype"
                  icon={
                    <TbPackageImport className="h-7 w-7 text-da-primary-500" />
                  }
                  className="w-full"
                />
              }
            >
              <FormImportPrototype />
            </DaPopup>
          )}

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
