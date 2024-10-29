import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DaPopup from '../atoms/DaPopup'
import { DaActionCard } from '../molecules/DaActionCard'
import { FaCar } from 'react-icons/fa'
import FormCreateModel from '../molecules/forms/FormCreateModel'
import { TbCode, TbPackageImport } from 'react-icons/tb'
import FormCreatePrototype from '../molecules/forms/FormCreatePrototype'
import FormImportPrototype from '../molecules/forms/FormImportPrototype'

type HomeButtonListProps = {
  items?: {
    title?: string
    description?: string
    url?: string
    type?: string
    icon?: JSX.Element
  }[]
  requiredLogin?: boolean
}

const HomeButtonList = ({ items, requiredLogin }: HomeButtonListProps) => {
  const navigate = useNavigate()
  const { data: user } = useSelfProfileQuery()

  const meetConditions = useMemo(() => {
    let result = true

    if (requiredLogin && !user) {
      result = false
    }

    return result
  }, [requiredLogin, user])

  return (
    meetConditions && (
      <div className="container pb-6 flex w-full flex-col justify-center">
        <div className="grid w-full grid-cols-2 grid-rows-2 xl:grid-cols-4 xl:grid-rows-1 gap-12">
          {items?.map((button, index) => {
            if (button.type === 'new-model')
              return (
                <DaPopup
                  key={index}
                  trigger={
                    <DaActionCard
                      title={button.title || 'New model'}
                      content={button.description || 'Create a vehicle model'}
                      icon={
                        button.icon || (
                          <FaCar className="h-7 w-7 text-da-primary-500" />
                        )
                      }
                      className="w-full"
                    />
                  }
                >
                  <FormCreateModel />
                </DaPopup>
              )

            if (button.type === 'new-prototype')
              return (
                <DaPopup
                  key={index}
                  trigger={
                    <DaActionCard
                      title={button.title || 'New prototype'}
                      content={
                        button.description || 'Quickly develop vehicle app'
                      }
                      icon={
                        button.icon || (
                          <TbCode className="h-7 w-7 text-da-primary-500" />
                        )
                      }
                      className="w-full"
                    />
                  }
                >
                  <FormCreatePrototype />
                </DaPopup>
              )

            if (button.type === 'import-prototype')
              return (
                <DaPopup
                  key={index}
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
              )

            return (
              <DaActionCard
                key={index}
                title={button.title || ''}
                content={button.description || ''}
                icon={button.icon}
                onClick={() => navigate(button.url || '#')}
                className="w-full"
              />
            )
          })}
        </div>
      </div>
    )
  )
}

export default HomeButtonList
