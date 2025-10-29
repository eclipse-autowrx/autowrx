// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useEffect, useState } from 'react'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { useParams } from 'react-router-dom'
import { Spinner } from '@/components/atoms/spinner'
import DaTabItem from '@/components/atoms/DaTabItem'
import {
  TbCode,
  TbGauge,
  TbListCheck,
  TbMessagePlus,
  TbRoute,
} from 'react-icons/tb'
import { saveRecentPrototype } from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaDialog from '@/components/molecules/DaDialog'
import { TbMessage } from 'react-icons/tb'
import DaDiscussions from '@/components/molecules/DaDiscussions'
import DaStaging from '@/components/molecules/staging/DaStaging'
import PrototypeTabCode from '@/components/organisms/PrototypeTabCode'
import PrototypeTabDashboard from '@/components/organisms/PrototypeTabDashboard'
import PrototypeTabFeedback from '@/components/organisms/PrototypeTabFeedback'
import DaRuntimeControl from '@/components/molecules/dashboard/DaRuntimeControl'
import PrototypeOverview from '@/components/organisms/PrototypeOverview'

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
    <div className="flex flex-col w-full h-full relative">
      <div className="flex min-h-[52px] border-b border-border bg-background">
        <div className="flex w-fit">
          <DaTabItem
            active={isDefaultTab}
            to={`/model/${model_id}/library/prototype/${prototype_id}/view`}
          >
            <TbRoute className="w-5 h-5 mr-2" />
            Journey
          </DaTabItem>
          <DaTabItem
            active={tab === 'code'}
            to={`/model/${model_id}/library/prototype/${prototype_id}/code`}
            dataId="tab-code"
          >
            <TbCode className="w-5 h-5 mr-2" />
            SDV Code
          </DaTabItem>
          <DaTabItem
            active={tab === 'dashboard'}
            to={`/model/${model_id}/library/prototype/${prototype_id}/dashboard`}
            dataId="tab-dashboard"
          >
            <TbGauge className="w-5 h-5 mr-2" />
            Dashboard
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
          <DaDialog
            open={openStagingDialog}
            onOpenChange={setOpenStagingDialog}
            trigger={
              <DaTabItem>
                <TbListCheck className="w-5 h-5 mr-2" />
                Staging
              </DaTabItem>
            }
          >
            <DaStaging />
          </DaDialog>
        }
        {
          <DaDialog
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
          </DaDialog>
        }
      </div>

      <div className="flex flex-col h-full overflow-y-auto relative">
        <div
          style={{ right: showRt ? '3.5rem' : '0' }}
          className="absolute left-0 bottom-0 top-0 grow h-full z-0"
        >
          {isDefaultTab && <PrototypeOverview mode="overview" prototype={prototype} />}
          {tab == 'code' && <PrototypeTabCode />}
          {tab == 'dashboard' && <PrototypeTabDashboard />}
          {tab == 'feedback' && <PrototypeTabFeedback />}
        </div>
        {showRt && <DaRuntimeControl />}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <Spinner size={32} />
      <p className="text-base text-muted-foreground">Loading prototype...</p>
      <p className="text-sm text-muted-foreground">
        (Timeout after 20s: Failed to load prototype or access denied)
      </p>
    </div>
  )
}

export default PagePrototypeDetail
