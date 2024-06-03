import useListDiscussions from '@/hooks/useListDiscussions'
import { DaText } from '../atoms/DaText'
import FormCreateDiscussion from './forms/FormCreateDiscussion'
import DaDiscussionItem from './DaDiscussionItem'
import { Fragment, useEffect, useRef, useState } from 'react'
import { TbBubble } from 'react-icons/tb'
import DaLoader from '../atoms/DaLoader'
import { DISCUSSION_REF_TYPE } from '@/types/discussion.type'
import useDiscussionIdentifier from '@/stores/useDiscussionIdentifer'

interface DaDiscussionsProps {
  refId: string
  refType: DISCUSSION_REF_TYPE
}

const DaDiscussions = ({ refId, refType }: DaDiscussionsProps) => {
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
    <div className="px-2 md:px-6 py-4 w-[600px] min-w-[500px] ">
      <DaText variant="title" className="text-da-primary-500">
        Discussions
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
