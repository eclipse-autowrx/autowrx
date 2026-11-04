// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import DaDialog from '@/components/molecules/DaDialog'
import PrototypeRightActionButtons from '@/components/molecules/PrototypeRightActionButtons'
import { TabConfig } from '@/components/organisms/CustomTabEditor'
import PrototypeTabStaging from '@/components/organisms/PrototypeTabStaging'
import { useUnknownVehicleApis } from '@/hooks/useUnknownVehicleApis'
import { hasPrototypeCode } from '@/lib/prototypeCodeUtils'
import { filterAndCompareVehicleApis } from '@/lib/vehicleApiUtils'
import PagePrototypePlugin from '@/pages/PagePrototypePlugin'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { useState } from 'react'

export interface PrototypeRightActionProps {
  prototype: Prototype
  actions?: TabConfig[]
  onCopyClick?: () => void
}

const PrototypeRightAction = ({
  prototype,
  actions,
  onCopyClick,
}: PrototypeRightActionProps) => {
  const [openDialog, setOpenDialog] = useState('')
  const draft = useModelStore((s) => s.prototypeDraft)
  const liveCode =
    draft && draft.id === prototype?.id ? draft.code : prototype?.code
  const unknownApis = useUnknownVehicleApis(liveCode || '')
  const stagingDisabled = !hasPrototypeCode(liveCode) || unknownApis.length > 0
  const stagingDisabledTitle = unknownApis.length
    ? `Unknown signals: ${unknownApis.join(', ')}. Fix them before deploying.`
    : stagingDisabled
      ? 'Generate code first to enable staging'
      : undefined

  const handleActionClick = async (action: TabConfig) => {
    if (action.builtin !== 'staging') {
      setOpenDialog(JSON.stringify(action))
      return
    }
    // Persist pending editor code first, then validate the latest state
    const state = useModelStore.getState()
    await state.flushPrototypeCode?.()
    const latest = useModelStore.getState()
    const latestDraft = latest.prototypeDraft
    const savedCode = latest.prototype?.code || ''
    const latestCode =
      latestDraft && latestDraft.id === latest.prototype?.id
        ? latestDraft.code
        : savedCode
    // If the save failed, staging would run stale code — do not open
    if (latestCode !== savedCode) return
    const unknown = latest.activeModelApis?.length
      ? filterAndCompareVehicleApis(latestCode, latest.activeModelApis)
          .apisNotInModel
      : []
    if (unknown.length > 0 || !hasPrototypeCode(latestCode)) return
    setOpenDialog(JSON.stringify(action))
  }
  return (
    <>
      {actions?.map((action) => {
        if (action.openMode === 'page' || action.builtin === 'copy') return null
        const dialogKey = JSON.stringify(action)
        return (
          <DaDialog
            key={`prototype-right-action-dialog-${dialogKey}`}
            open={openDialog === dialogKey}
            onOpenChange={(open) => setOpenDialog(open ? dialogKey : '')}
            dialogTitle={
              action.builtin ? action.label || 'Staging' : action.label
            }
            hideHeaderDivider
            contentContainerClassName={
              action.builtin && action.renderPlugin ? 'p-0! px-2!' : undefined
            }
            className="max-w-[95vw] w-[1200px]"
          >
            <div className="flex overflow-y-auto max-h-[80vh]  min-h-[20vh] [&>div]:p-0!">
              {action.builtin ? (
                unknownApis.length ? (
                  <p className="p-4 text-destructive" role="alert">
                    {stagingDisabledTitle}
                  </p>
                ) : (
                  <PrototypeTabStaging
                    prototype={prototype}
                    renderPlugin={action.renderPlugin}
                  />
                )
              ) : (
                <PagePrototypePlugin
                  pluginSlug={action.plugin}
                  onSetActiveTab={() => {}}
                />
              )}
            </div>
          </DaDialog>
        )
      })}
      <PrototypeRightActionButtons
        tabs={actions}
        onClick={(action) => void handleActionClick(action)}
        onCopyClick={onCopyClick}
        stagingDisabled={stagingDisabled}
        stagingDisabledTitle={stagingDisabledTitle}
      />
    </>
  )
}

export default PrototypeRightAction
