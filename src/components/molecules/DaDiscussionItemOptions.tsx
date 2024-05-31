import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Discussion } from '@/types/discussion.type'
import { DaButton } from '../atoms/DaButton'
import { TbDots, TbTrash } from 'react-icons/tb'
import DaMenu from '../atoms/DaMenu'
import DaPopup from '../atoms/DaPopup'
import FormAlert from './forms/FormAlert'
import { DaText } from '../atoms/DaText'
import { useState } from 'react'
import { deleteDiscussionService } from '@/services/discussion.service'

interface DaDiscussionItemOptionsProps {
  data: Discussion
  refetch: () => Promise<unknown>
}

const DaDiscussionItemOptions = ({
  data,
  refetch,
}: DaDiscussionItemOptionsProps) => {
  const { data: self } = useSelfProfileQuery()
  const [openDelete, setOpenDelete] = useState(false)
  const [loading, setLoading] = useState(false)

  const deleteDiscussion = async () => {
    try {
      setLoading(true)
      // Delete discussion
      await deleteDiscussionService(data.id)
      await refetch()
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
          <div className="-my-2">
            <DaButton
              onClick={() => setOpenDelete(true)}
              variant="plain"
              className="block"
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
