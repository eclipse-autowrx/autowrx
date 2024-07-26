import { FC, useEffect, useState, lazy, Suspense } from 'react'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { useParams } from 'react-router-dom'
import { DaText } from '@/components/atoms/DaText'
import DaLoading from '@/components/atoms/DaLoading'
import DaTabItem from '@/components/atoms/DaTabItem'
import {
  TbBinaryTree,
  TbCode,
  TbDownload,
  TbGauge,
  TbMessage,
  TbMessagePlus,
  TbRoute,
  TbScale,
} from 'react-icons/tb'
import { DaButton } from '@/components/atoms/DaButton'
import DaDiscussions from '@/components/molecules/DaDiscussions'
import DaPopup from '@/components/atoms/DaPopup'
import { saveRecentPrototype } from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

// import PrototypeTabCode from '@/components/organisms/PrototypeTabCode'
// import PrototypeTabDashboard from '@/components/organisms/PrototypeTabDashboard'
// import PrototypeTabJourney from '@/components/organisms/PrototypeTabJourney'
// import PrototypeTabFeedback from '@/components/organisms/PrototypeTabFeedback'
// import PrototypeTabHomologation from '@/components/organisms/PrototypeTabHomologation'
// import PrototypeTabArchitecture from '@/components/organisms/PrototypeTabArchitecture'
const PrototypeTabCode = lazy(
  () => import('@/components/organisms/PrototypeTabCode'),
)
const PrototypeTabDashboard = lazy(
  () => import('@/components/organisms/PrototypeTabDashboard'),
)
const PrototypeTabJourney = lazy(
  () => import('@/components/organisms/PrototypeTabJourney'),
)
const PrototypeTabFeedback = lazy(
  () => import('@/components/organisms/PrototypeTabFeedback'),
)
const PrototypeTabHomologation = lazy(
  () => import('@/components/organisms/PrototypeTabHomologation'),
)
const PrototypeTabArchitecture = lazy(
  () => import('@/components/organisms/PrototypeTabArchitecture'),
)

interface ViewPrototypeProps {
  display?: 'tree' | 'list'
}

const PagePrototypeDetail: FC<ViewPrototypeProps> = ({}) => {
  const { model_id, prototype_id, tab } = useParams()
  const { data: user } = useSelfProfileQuery()
  const prototype = useModelStore((state) => state.prototype as Prototype)
  const [isDefaultTab, setIsDefaultTab] = useState(false)

  useEffect(() => {
    if (!tab || tab === 'journey' || tab === 'view') {
      setIsDefaultTab(true)
    } else {
      setIsDefaultTab(false)
    }
  }, [tab])

  useEffect(() => {
    if (user && prototype && tab) {
      saveRecentPrototype(user.id, prototype.id, 'prototype', tab)
    }
  }, [prototype, tab, user])

  return prototype ? (
    <div className="flex flex-col w-full h-full">
      <div className="flex px-4 py-2 bg-da-primary-500 justify-between items-center">
        <DaText variant="sub-title" className="text-white">
          {prototype.name}
        </DaText>
        <div className="flex space-x-2 w-1/2 justify-end">
          <DaPopup
            trigger={
              <DaButton
                variant="plain"
                className="!text-da-white !bg-transparent hover:opacity-75"
                size="sm"
              >
                <TbMessage className="w-5 h-5 mr-2" />
                Discussion
              </DaButton>
            }
          >
            <DaDiscussions refId={prototype.id} refType="prototype" />
          </DaPopup>
        </div>
      </div>
      <div className="flex px-2 py-0 bg-da-gray-light min-h-10">
        <DaTabItem
          active={isDefaultTab}
          to={`/model/${model_id}/library/prototype/${prototype_id}/journey`}
        >
          <TbRoute className="w-5 h-5 mr-2" />
          Journey
        </DaTabItem>
        <DaTabItem
          active={tab === 'architecture'}
          to={`/model/${model_id}/library/prototype/${prototype_id}/architecture`}
        >
          <TbBinaryTree className="w-5 h-5 mr-2" />
          Architecture
        </DaTabItem>
        <DaTabItem
          active={tab === 'code'}
          to={`/model/${model_id}/library/prototype/${prototype_id}/code`}
        >
          <TbCode className="w-5 h-5 mr-2" />
          Code
        </DaTabItem>
        {/* <DaTabItem
          active={tab === 'flow'}
          to={`/model/${model_id}/library/prototype/${prototype_id}/flow`}
        >
          Flow
        </DaTabItem> */}
        <DaTabItem
          active={tab === 'dashboard'}
          to={`/model/${model_id}/library/prototype/${prototype_id}/dashboard`}
        >
          <TbGauge className="w-5 h-5 mr-2" />
          Dashboard
        </DaTabItem>
        <DaTabItem
          active={tab === 'homologation'}
          to={`/model/${model_id}/library/prototype/${prototype_id}/homologation`}
        >
          <TbScale className="w-5 h-5 mr-2" />
          Homologation
        </DaTabItem>
        <DaTabItem
          active={tab === 'feedback'}
          to={`/model/${model_id}/library/prototype/${prototype_id}/feedback`}
        >
          <TbMessagePlus className="w-5 h-5 mr-2" />
          Feedback
        </DaTabItem>
      </div>
      <div className="w-full min-h-[100px] grow">
        {isDefaultTab && (
          <Suspense>
            <PrototypeTabJourney prototype={prototype} />
          </Suspense>
        )}
        {tab == 'architecture' && (
          <Suspense>
            <PrototypeTabArchitecture />
          </Suspense>
        )}
        {tab == 'code' && (
          <Suspense>
            <PrototypeTabCode />
          </Suspense>
        )}
        {tab == 'flow' && (
          <div className="p-8">
            <DaText variant="huge">Flow Page</DaText>
          </div>
        )}
        {tab == 'dashboard' && (
          <Suspense>
            <PrototypeTabDashboard />
          </Suspense>
        )}
        {tab == 'homologation' && (
          <Suspense>
            <PrototypeTabHomologation />
          </Suspense>
        )}
        {tab == 'feedback' && (
          <Suspense>
            <PrototypeTabFeedback />
          </Suspense>
        )}
      </div>
    </div>
  ) : (
    <DaLoading
      text="Loading prototype..."
      timeout={20}
      timeoutText="Failed to load prototype. Please try again later"
    />
  )
}

export default PagePrototypeDetail
