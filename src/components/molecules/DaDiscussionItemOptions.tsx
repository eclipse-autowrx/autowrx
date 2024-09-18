import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Discussion } from '@/types/discussion.type'
import { DaButton } from '../atoms/DaButton'
import { TbDots, TbPencil, TbTrash } from 'react-icons/tb'
import DaMenu from '../atoms/DaMenu'
import DaPopup from '../atoms/DaPopup'
import FormAlert from './forms/FormAlert'
import { DaText } from '../atoms/DaText'
import React, { useState } from 'react'
import { deleteDiscussionService } from '@/services/discussion.service'
import { addLog } from '@/services/log.service'

interface DaDiscussionItemOptionsProps {
  data: Discussion
  refetch: () => Promise<unknown>
  triggerEdit?: () => void
}

const DaDiscussionItemOptions = ({
  data,
  refetch,
  ...props
}: DaDiscussionItemOptionsProps) => {
  const { data: self } = useSelfProfileQuery()
  const [openDelete, setOpenDelete] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data: user } = useSelfProfileQuery()

  const deleteDiscussion = async () => {
    try {
      setLoading(true)
      // Delete discussion
      await deleteDiscussionService(data.id)
      await refetch()
      addLog({
        name: `User ${user?.id} deleted discussion`,
        description: `User ${user?.id} deleted discussion with id: ${data.id}`,
        type: 'delete-dicussion',
        create_by: user?.id!,
        parent_id: data?.ref,
        ref_id: data?.id,
        ref_type: 'discussion',
      })
      setOpenDelete(false)
    } catch (error) {
      console.error('Delete discussion failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DaPopup state={[openDelete, setOpenDelete]} trigger={<span></span>}>
        <FormAlert
          loading={loading}
          onConfirm={deleteDiscussion}
          onCancel={() => setOpenDelete(false)}
        >
          <DaText>
            Are you sure you want to delete discussion with content: '
            {data.content}'. The replies will be deleted as well.
          </DaText>
        </FormAlert>
      </DaPopup>

      {self && self.id === data.created_by.id && (
        <DaMenu
          trigger={
            <DaButton variant="plain" size="sm">
              <TbDots />
            </DaButton>
          }
        >
          <div className="flex flex-col">
            <DaButton
              onClick={props.triggerEdit}
              variant="plain"
              className="da-menu-item "
            >
              <div className="flex w-full items-center">
                <TbPencil className="mr-2" /> Edit
              </div>
            </DaButton>
            <DaButton
              onClick={() => setOpenDelete(true)}
              variant="destructive"
              className="!text-sm !h-fit !px-2 !mx-1"
            >
              <TbTrash className="mr-2" /> Delete
            </DaButton>
          </div>
        </DaMenu>
      )}
    </>
  )
}

export default DaDiscussionItemOptions
