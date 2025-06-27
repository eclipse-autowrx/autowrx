import { FC, useEffect, useState, lazy, Suspense } from 'react'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { Link, useParams } from 'react-router-dom'
import DaLoading from '@/components/atoms/DaLoading'
import DaTabItem from '@/components/atoms/DaTabItem'
import {
  TbBinaryTree,
  TbChecklist,
  TbCode,
  TbDotsVertical,
  TbGauge,
  TbListCheck,
  TbMessagePlus,
  TbRoute,
  TbScale,
  TbTargetArrow,
  TbListTree,
} from 'react-icons/tb'
import { saveRecentPrototype } from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaPopup from '@/components/atoms/DaPopup'
import { TbMessage } from 'react-icons/tb'
import DaDiscussions from '@/components/molecules/DaDiscussions'
import DaStaging from '@/components/molecules/staging/DaStaging'
import PrototypeTabJourney from '@/components/organisms/PrototypeTabJourney'
import PrototypeTabArchitecture from '@/components/organisms/PrototypeTabArchitecture'
import PrototypeTabCode from '@/components/organisms/PrototypeTabCode'
import PrototypeTabDashboard from '@/components/organisms/PrototypeTabDashboard'
import PrototypeTabHomologation from '@/components/organisms/PrototypeTabHomologation'
import PrototypeTabFeedback from '@/components/organisms/PrototypeTabFeedback'
import PrototypeTabFlow from '@/components/organisms/PrototypeTabFlow'
import DaRuntimeControl from '@/components/molecules/dashboard/DaRuntimeControl'
import PrototypeTabTestDesign from '@/components/organisms/PrototypeTabTestDesign'
import PrototypeTabRequirement from '@/components/organisms/PrototypeTabRequirement'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/atoms/dropdown-menu'
import { MdOutlineDoubleArrow } from 'react-icons/md'

interface ViewPrototypeProps {
  display?: 'tree' | 'list'
}

const PagePrototypeDetail: FC<ViewPrototypeProps> = ({}) => {
  const { model_id, prototype_id, tab } = useParams()
  const { data: user } = useSelfProfileQuery()
  const { data: model } = useCurrentModel()
  const prototype = useModelStore((state) => state.prototype as Prototype)
  const [isDefaultTab, setIsDefaultTab] = useState(false)
  const [openStagingDialog, setOpenStagingDialog] = useState(false)
  const [showRt, setShowRt] = useState(false)

  useEffect(() => {
    if (!tab || tab === 'journey' || tab === 'view') {
      setIsDefaultTab(true)
    } else {
      setIsDefaultTab(false)
    }
    setShowRt(['code', 'dashboard'].includes(tab || ''))
  }, [tab])

  useEffect(() => {
    if (user && prototype && tab) {
      saveRecentPrototype(user.id, prototype.id, 'prototype', tab)
    }
  }, [prototype, tab, user])

  return prototype ? (
    <div className={`flex flex-col w-full h-full relative`}>
      <div className="flex min-h-[52px] border-b border-da-gray-medium/50 bg-da-white">
        <div className="flex w-fit">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={`${['journey', 'view', 'requirements'].includes(tab || '') ? 'text-da-primary-500 border-b-2 border-da-primary-500' : ''} flex text-sm font-semibold items-center px-4 h-[52px] hover:opacity-80 cursor-pointer`}
              >
                <TbListTree className="w-5 h-5 mr-2" />
                Overview
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white" align="end">
              <DropdownMenuItem
                className="hover:bg-da-primary-100 cursor-pointer rounded-md hover:text-da-primary-500 font-medium"
                asChild
              >
                <Link
                  to={`/model/${model_id}/library/prototype/${prototype_id}/journey`}
                  className="flex items-center"
                >
                  <TbRoute className="w-5 h-5 mr-2" />
                  Journey
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-da-primary-100 cursor-pointer rounded-md hover:text-da-primary-500 font-medium"
                asChild
              >
                <Link
                  to={`/model/${model_id}/library/prototype/${prototype_id}/requirements`}
                  className="flex items-center"
                >
                  <TbTargetArrow className="w-5 h-5 mr-2" />
                  Requirements
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* <DaTabItem
            active={isDefaultTab}
            to={`/model/${model_id}/library/prototype/${prototype_id}/journey`}
          >
            <TbRoute className="w-5 h-5 mr-2" />
            Journey
          </DaTabItem> */}
          <DaTabItem
            active={tab === 'flow'}
            to={`/model/${model_id}/library/prototype/${prototype_id}/flow`}
          >
            <MdOutlineDoubleArrow className="w-5 h-5 mr-2" />
            Flow
          </DaTabItem>
          {/* <DaTabItem
            active={tab === 'requirements'}
            to={`/model/${model_id}/library/prototype/${prototype_id}/requirements`}
          >
            <TbTargetArrow className="w-5 h-5 mr-2" />
            Requirements
          </DaTabItem> */}
          <DaTabItem
            active={tab === 'code'}
            to={`/model/${model_id}/library/prototype/${prototype_id}/code`}
          >
            <TbCode className="w-5 h-5 mr-2" />
            SDV Code
          </DaTabItem>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={`${['architecture', 'test-design', 'feedback'].includes(tab || '') ? 'text-da-primary-500 border-b-2 border-da-primary-500' : ''} flex text-sm font-semibold items-center px-4 h-[52px] hover:opacity-80 cursor-pointer`}
              >
                <TbDotsVertical className="w-5 h-5 mr-2" />
                More
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white" align="end">
              <DropdownMenuItem
                className="hover:bg-da-primary-100 cursor-pointer rounded-md hover:text-da-primary-500 font-medium"
                asChild
              >
                <Link
                  to={`/model/${model_id}/library/prototype/${prototype_id}/architecture`}
                  className="flex items-center"
                >
                  <TbBinaryTree className="w-5 h-5 mr-2" />
                  Architecture
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-da-primary-100 cursor-pointer rounded-md hover:text-da-primary-500 font-medium"
                asChild
              >
                <Link
                  to={`/model/${model_id}/library/prototype/${prototype_id}/test-design`}
                  className="flex items-center"
                >
                  <TbChecklist className="w-5 h-5 mr-2" />
                  Test Design
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-da-primary-100 cursor-pointer rounded-md hover:text-da-primary-500 font-medium"
                asChild
              >
                <Link
                  to={`/model/${model_id}/library/prototype/${prototype_id}/feedback`}
                  className="flex items-center"
                >
                  <TbMessagePlus className="w-5 h-5 mr-2" />
                  Feedback
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="grow"></div>
        {
          <DaPopup
            trigger={
              <DaTabItem>
                <TbListCheck className="w-5 h-5 mr-2" />
                Staging
              </DaTabItem>
            }
            state={[openStagingDialog, setOpenStagingDialog]}
            onClose={() => {
              setOpenStagingDialog(false)
            }}
            closeBtnClassName="top-5 size-5"
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

      <div className="flex flex-col h-full overflow-y-auto relative">
        <div
          style={{ right: showRt ? '3.5rem' : '0' }}
          className={`absolute left-0 bottom-0 top-0 grow h-full z-0`}
        >
          {isDefaultTab && <PrototypeTabJourney prototype={prototype} />}
          {tab == 'architecture' && <PrototypeTabArchitecture />}
          {tab == 'code' && <PrototypeTabCode />}
          {tab == 'flow' && <PrototypeTabFlow />}
          {tab == 'dashboard' && <PrototypeTabDashboard />}
          {tab == 'homologation' && <PrototypeTabHomologation />}
          {tab == 'test-design' && <PrototypeTabTestDesign />}
          {tab == 'feedback' && <PrototypeTabFeedback />}
          {tab == 'requirements' && <PrototypeTabRequirement />}
        </div>
        {showRt && <DaRuntimeControl />}
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
