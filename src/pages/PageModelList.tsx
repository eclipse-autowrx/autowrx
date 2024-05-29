import { ModelGrid } from '@/components/organisms/ModelGrid'
import { DaText } from '@/components/atoms/DaText'
import { DaButton } from '@/components/atoms/DaButton'
import { HiPlus } from 'react-icons/hi'
import DaPopup from '@/components/atoms/DaPopup'
import { Form } from 'react-router-dom'
import FormCreateModel from '@/components/molecules/forms/FormCreateModel'

const PageModelList = () => {
  return (
    <div className="col-span-full h-full flex flex-col px-2 py-4 container space-y-2">
      <div className="flex mb-2">
        <DaText variant="title" className="text-da-primary-500">
          Model List
        </DaText>
        <div className="grow"></div>
        <DaPopup
          trigger={
            <DaButton variant="outline">
              <HiPlus className="mr-1 text-lg" />
              Create New Model
            </DaButton>
          }
        >
          <FormCreateModel />
        </DaPopup>
      </div>

      <ModelGrid />
    </div>
  )
}

export default PageModelList
