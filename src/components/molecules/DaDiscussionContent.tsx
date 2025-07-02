// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react'
import { DaAvatar } from '../atoms/DaAvatar'
import { Discussion } from '@/types/discussion.type'
import dayjs from 'dayjs'
import DaDiscussionItemOptions from './DaDiscussionItemOptions'
import { DaButton } from '../atoms/DaButton'
import { TbArrowBack, TbChevronDown, TbChevronUp } from 'react-icons/tb'
import FormCreateDiscussion from './forms/FormCreateDiscussion'
import useDiscussionIdentifier from '@/stores/useDiscussionIdentifer'

interface DaDiscussionContentProps {
  data: Discussion
  refetch: () => Promise<unknown>
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  setIsReplying: (isReplying: boolean) => void
}

const DaDiscussionContent = ({
  data,
  refetch,
  collapsed,
  setCollapsed,
  setIsReplying,
}: DaDiscussionContentProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const discussionIdentifier = useDiscussionIdentifier(
    (state) => state.identifier,
  )

  if (isEditing && discussionIdentifier) {
    return (
      <FormCreateDiscussion
        {...discussionIdentifier}
        refetch={refetch}
        updatingData={data}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div className="flex flex-col w-full">
      <div className="da-label-small flex items-center">
        <DaAvatar
          src={data?.created_by.image_file || '/imgs/user.png'}
          alt={data?.created_by.name}
          fallback={<img src="/imgs/user.png" className="p-1" alt="User" />}
          className="select-none w-6 h-6 overflow-hidden"
        />

        <div className="pl-2 da-label-regular-bold text-da-gray-dark">
          {data?.created_by.name || 'Anonymous'}
        </div>
        <div className="ml-4 da-label-tiny">
          {dayjs(data.created_at).format('DD MMM YYYY, HH:mm')}
        </div>

        <div className="grow" />

        {/* Options */}
        <DaDiscussionItemOptions
          triggerEdit={() => setIsEditing(true)}
          refetch={refetch}
          data={data}
        />
      </div>

      {/* The content */}
      <div className="w-full mt-1 py-2 px-4 text-left bg-da-gray-light/50 text-da-gray-dark rounded">
        <div
          className="whitespace-pre-wrap da-label-small max-h-[200px] overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: data.content }}
        ></div>
      </div>

      {/* Action buttons */}
      <div className="flex w-full items-center mt-2">
        <div className="grow"></div>

        {data.replies && data.replies.length > 0 && (
          <div className="flex items-center">
            <div className="da-label-small-bold text-da-primary-500 mr-4">
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
          <DaButton
            variant="plain"
            size="sm"
            className="flex items-center px-2 mb-1 da-label-small rounded"
            onClick={() => setIsReplying(true)}
          >
            <TbArrowBack size={18} className="mr-1" />
            Reply
          </DaButton>
        )}
      </div>
    </div>
  )
}

export default DaDiscussionContent
