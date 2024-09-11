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
  TbGauge,
  TbMessagePlus,
  TbRoute,
  TbScale,
} from 'react-icons/tb'
import { saveRecentPrototype } from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { PERMISSIONS } from '@/data/permission'
import usePermissionHook from '@/hooks/usePermissionHook'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaPopup from '@/components/atoms/DaPopup'
import { DaButton } from '@/components/atoms/DaButton'
import { TbMessage } from 'react-icons/tb'
import DaDiscussions from '@/components/molecules/DaDiscussions'
import DaStaging from '@/components/molecules/staging/DaStaging'

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
  const { data: model } = useCurrentModel()
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
    <div className="flex flex-col w-full h-full relative">
      <div className="sticky flex top-0 py-0 bg-da-gray-light min-h-10 justify-between">
        <div className="flex w-fit">
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
            SDV Code
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
        <div className="grow"></div>
        {
          <DaPopup
            trigger={
              <DaTabItem>
                {/* <TbMessage className="w-5 h-5 mr-2" /> */}
                Staging
              </DaTabItem>
            }
          >
            <DaStaging />
          </DaPopup>
        }
        {
          <DaPopup
            trigger={
              <DaTabItem>
                <TbMessage className="w-5 h-5 mr-2" />
                Discussion
              </DaTabItem>
            }
          >
            <DaDiscussions
              refId={prototype?.id ?? ''}
              refType="prototype"
              className="max-h-[80vh] xl:max-h-[60vh]"
            />
          </DaPopup>
        }
      </div>

      <div className="flex flex-col h-full overflow-y-auto">
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
      timeoutText="Failed to load prototype or access denied"
    />
  )
}

export default PagePrototypeDetail
