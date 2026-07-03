import DaDialog from '@/components/molecules/DaDialog'
import PrototypeRightActionButtons from '@/components/molecules/PrototypeRightActionButtons'
import { TabConfig } from '@/components/organisms/CustomTabEditor'
import PrototypeTabStaging from '@/components/organisms/PrototypeTabStaging'
import PagePrototypePlugin from '@/pages/PagePrototypePlugin'
import { Prototype } from '@/types/model.type'
import { useState } from 'react'

export interface PrototypeRightActionProps {
  prototype: Prototype
  actions?: TabConfig[]
}

const PrototypeRightAction = ({
  prototype,
  actions,
}: PrototypeRightActionProps) => {
  const [openDialog, setOpenDialog] = useState('')
  return (
    <>
      {actions?.map((action) => {
        if (action.openMode === 'page') return null
        const dialogKey = JSON.stringify(action)
        return (
          <DaDialog
            key={`prototype-right-action-dialog-${dialogKey}`}
            open={openDialog === dialogKey}
            onOpenChange={(open) => setOpenDialog(open ? dialogKey : '')}
            dialogTitle={
              action.builtin ? action.label || 'Staging' : action.label
            }
            className="max-w-[95vw] w-[1200px]"
          >
            <div className="flex overflow-y-auto max-h-[80vh]  min-h-[20vh] [&>div]:p-0!">
              {action.builtin ? (
                <PrototypeTabStaging prototype={prototype} />
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
      />
    </>
  )
}

export default PrototypeRightAction
