import useListDiscussions from '@/hooks/useListDiscussions'
import { DaText } from '../atoms/DaText'
import FormCreateDiscussion from './forms/FormCreateDiscussion'
import DaDiscussionItem from './DaDiscussionItem'
import { Fragment, useEffect, useRef, useState } from 'react'
import { TbBubble, TbMessage } from 'react-icons/tb'
import DaLoader from '../atoms/DaLoader'
import { DISCUSSION_REF_TYPE } from '@/types/discussion.type'
import useDiscussionIdentifier from '@/stores/useDiscussionIdentifer'
import { cn } from '@/lib/utils'

interface DaDiscussionsProps {
  refId: string
  refType: DISCUSSION_REF_TYPE
  className?: string
}

const DaDiscussions = ({ refId, refType, className }: DaDiscussionsProps) => {
  const { data, isLoading, refetch } = useListDiscussions(
    refId,
    refType,
    'created_by',
  )
  const ref = useRef<HTMLDivElement>(null)
  const setIdentifier = useDiscussionIdentifier((state) => state.setIdentifier)

  useEffect(() => {
    setIdentifier(refId, refType)
  }, [refId, refType])

  return (
    <div className={cn('px-2 w-full min-w-[500px] ', className)}>
      <DaText
        variant="sub-title"
        className="flex items-center text-da-primary-500"
      >
        <TbMessage className="w-5 h-5 mr-2" /> Discussions
      </DaText>

      {isLoading ? (
        <div className="min-h-[200px] w-full flex">
          <DaLoader className="m-auto" />
        </div>
      ) : (
        <>
          {/* Empty state */}
          {!data ||
            (data.results.length === 0 && (
              <div className="p-5 rounded-mb my-4 bg-da-gray-light/50 flex flex-col items-center gap-2 rounded-md">
                <TbBubble className="text-da-primary-500 da-label-huge" />
                <DaText variant="small" className="text-da-gray-medium">
                  No discussion yet. Be the first one to start a discussion!
                </DaText>
              </div>
            ))}

          {/* List */}
          {data && (
            <div className="my-4">
              {data.results.map((discussion, index) => (
                <Fragment key={discussion.id}>
                  <DaDiscussionItem refetch={refetch} data={discussion} />
                  {index < data.results.length - 1 && (
                    <div className="my-4 border-t border-da-gray-light" />
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </>
      )}

      <div ref={ref} />
      <FormCreateDiscussion refId={refId} refType={refType} refetch={refetch} />
    </div>
  )
}

export default DaDiscussions
