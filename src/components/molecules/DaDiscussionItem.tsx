import { DISCUSSION_REF_TYPE, Discussion } from '@/types/discussion.type'
import { useState } from 'react'
import {
  TbArrowBack,
  TbChevronDown,
  TbChevronUp,
  TbDots,
  TbTrash,
} from 'react-icons/tb'
import { DaAvatar } from '../atoms/DaAvatar'
import { DaButton } from '../atoms/DaButton'
import dayjs from 'dayjs'
import FormCreateDiscussion from './forms/FormCreateDiscussion'
import DaDiscussionItemOptions from './DaDiscussionItemOptions'

type DaDiscussionItemProps = {
  data: Discussion
  refetch: () => Promise<unknown>
  replyData?: {
    refId: string
    refType: DISCUSSION_REF_TYPE
  }
}

const DaDiscussionItem = ({
  data,
  replyData,
  refetch,
}: DaDiscussionItemProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [isReplying, setIsReplying] = useState<boolean>(false)

  return (
    <div>
      {/* Information of user */}
      <div className="da-label-small flex items-center">
        <DaAvatar
          src={data?.created_by.image_file || '/imgs/user.png'}
          alt={data?.created_by.name}
          fallback={<img src="/imgs/user.png" className="p-1" alt="User" />}
          className="select-none w-8 h-8 overflow-hidden "
        />

        <div className="pl-2 da-label-regular-bold text-da-gray-dark font-bold">
          {data?.created_by.name || 'Anonymous'}
        </div>
        <div className="ml-4 da-label-tiny">
          {dayjs(data.created_at).format('DD MMM YYYY, HH:mm')}
        </div>

        <div className="grow" />

        {/* Options */}
        <DaDiscussionItemOptions refetch={refetch} data={data} />
      </div>

      {/* The content */}
      <div className="w-full mt-1 py-2 px-4 text-left bg-da-gray-light/50 text-da-gray-dark rounded">
        <div
          className="whitespace-pre-wrap da-label-small max-h-[200px] overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: data.content }}
        ></div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center mt-2">
        <div className="grow"></div>

        {data.replies && data.replies.length > 0 && (
          <div className="flex items-center">
            <div className="text-da-gray-dark da-label-small mr-4">
              Reply ({data.replies.length})
            </div>
            {collapsed && (
              <DaButton
                variant="plain"
                size="sm"
                className="flex items-center px-2 py-1 da-label-small rounded"
                onClick={() => {
                  setCollapsed(false)
                }}
              >
                Expand
                <TbChevronDown size={18} className="ml-0.5" />
              </DaButton>
            )}
            {!collapsed && (
              <DaButton
                variant="plain"
                size="sm"
                className="flex items-center px-2 py-1 da-label-small rounded"
                onClick={() => {
                  setCollapsed(true)
                }}
              >
                Collapse
                <TbChevronUp size={18} className="ml-0.5" />
              </DaButton>
            )}
          </div>
        )}

        {!data.parent && (
          <div
            className="ml-1 flex items-center text-da-gray-medium px-2 py-1 cursor-pointer hover:bg-slate-200 da-label-small rounded"
            onClick={() => setIsReplying(true)}
          >
            <TbArrowBack className="mr-1" size={18} />
            Reply
          </div>
        )}
      </div>

      {/* Replies  */}
      {!collapsed && data.replies && data.replies.length > 0 && (
        <div className="ml-12 space-y-3">
          {data.replies.map((child: any, index: number) => (
            <DaDiscussionItem refetch={refetch} key={index} data={child} />
          ))}
        </div>
      )}

      {/* Reply form */}
      {isReplying && replyData && (
        <div className="ml-12 mt-2 mb-6">
          <FormCreateDiscussion
            refetch={refetch}
            refId={replyData.refId}
            refType={replyData.refType}
            replying={{
              id: data.id,
              onCancel: () => setIsReplying(false),
            }}
          />
        </div>
      )}
    </div>
  )
}

export default DaDiscussionItem
