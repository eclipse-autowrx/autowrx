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
import { hasPrototypeCode } from '@/lib/prototypeCodeUtils'
import PagePrototypePlugin from '@/pages/PagePrototypePlugin'
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
  const stagingDisabled = !hasPrototypeCode(prototype?.code)
  const stagingDisabledTitle = stagingDisabled
    ? 'Generate code first to enable staging'
    : undefined
  return (
    <>
      {actions?.map((action) => {
        if (action.openMode === 'page' || action.builtin === 'copy')
          return null
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
                <PrototypeTabStaging
                  prototype={prototype}
                  renderPlugin={action.renderPlugin}
                />
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
        onClick={(action) => setOpenDialog(JSON.stringify(action))}
        onCopyClick={onCopyClick}
        stagingDisabled={stagingDisabled}
        stagingDisabledTitle={stagingDisabledTitle}
      />
    </>
  )
}

export default PrototypeRightAction
