import { FC, useEffect, useState } from 'react'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { useParams } from 'react-router-dom'
import { DaText } from '@/components/atoms/DaText'
import DaLoading from '@/components/atoms/DaLoading'
import PrototypeTabCode from '@/components/organisms/PrototypeTabCode'
import DaTabItem from '@/components/atoms/DaTabItem'
import PrototypeTabDashboard from '@/components/organisms/PrototypeTabDashboard'
import PrototypeTabJourney from '@/components/organisms/PrototypeTabJourney'
import PrototypeTabFeedback from '@/components/organisms/PrototypeTabFeedback'
import PrototypeTabHomologation from '@/components/organisms/PrototypeTabHomologation'
import PrototypeTabArchitecture from '@/components/organisms/PrototypeTabArchitecture'

interface ViewPrototypeProps {
  display?: 'tree' | 'list'
}

const PagePrototypeDetail: FC<ViewPrototypeProps> = ({}) => {
  const { model_id, prototype_id, tab } = useParams()
  const [prototype] = useModelStore((state) => [state.prototype as Prototype])
  const [isDefaultTab, setIsDefaultTab] = useState(false)
  useEffect(() => {
    if (!tab || tab == 'journey' || tab == 'view') {
      setIsDefaultTab(true)
      return
    }
    setIsDefaultTab(false)
  }, [tab])

  if (!prototype) {
    return (
      <DaLoading
        text="Loading prototype..."
        timeout={10}
        timeoutText="Failed to load prototype"
      />
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-4 py-2 flex bg-da-primary-500 text-da-white da-label-sub-title">
        {prototype.name}
        <div className="grow"></div>
      </div>
      <div className="flex px-6 py-0 bg-da-gray-light min-h-8">
        <DaTabItem
          active={isDefaultTab}
          to={`/model/${model_id}/library/prototype/${prototype_id}/journey`}
        >
          Journey
        </DaTabItem>
        <DaTabItem
          active={tab == 'architecture'}
          to={`/model/${model_id}/library/prototype/${prototype_id}/architecture`}
        >
          Architecture
        </DaTabItem>
        <DaTabItem
          active={tab == 'code'}
          to={`/model/${model_id}/library/prototype/${prototype_id}/code`}
        >
          Code
        </DaTabItem>
        {/* <DaTabItem
          active={tab == 'flow'}
          to={`/model/${model_id}/library/prototype/${prototype_id}/flow`}
        >
          Flow
        </DaTabItem> */}
        <DaTabItem
          active={tab == 'dashboard'}
          to={`/model/${model_id}/library/prototype/${prototype_id}/dashboard`}
        >
          Dashboard
        </DaTabItem>
        <DaTabItem
          active={tab == 'homologation'}
          to={`/model/${model_id}/library/prototype/${prototype_id}/homologation`}
        >
          Homologation
        </DaTabItem>
        <DaTabItem
          active={tab == 'feedback'}
          to={`/model/${model_id}/library/prototype/${prototype_id}/feedback`}
        >
          Feedback
        </DaTabItem>
      </div>
      <div className="w-full min-h-[100px] grow">
        {isDefaultTab && <PrototypeTabJourney prototype={prototype} />}
        {tab == 'architecture' && <PrototypeTabArchitecture />}
        {tab == 'code' && <PrototypeTabCode />}
        {tab == 'flow' && (
          <div className="p-8">
            <DaText variant="huge">Flow Page</DaText>
          </div>
        )}
        {tab == 'dashboard' && <PrototypeTabDashboard />}
        {tab == 'homologation' && <PrototypeTabHomologation />}
        {tab == 'feedback' && <PrototypeTabFeedback />}
      </div>
    </div>
  )
}

export default PagePrototypeDetail
