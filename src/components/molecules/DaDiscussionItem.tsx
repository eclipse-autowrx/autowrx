// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState } from 'react'
import FormCreateDiscussion from './forms/FormCreateDiscussion'
import DaDiscussionContent from './DaDiscussionContent'
import useDiscussionIdentifier from '@/stores/useDiscussionIdentifer'
import { Discussion } from '@/types/discussion.type'

type DaDiscussionItemProps = {
  data: Discussion
  refetch: () => Promise<unknown>
}

const DaDiscussionItem = ({ data, refetch }: DaDiscussionItemProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [isReplying, setIsReplying] = useState<boolean>(false)
  const discussionIdentifier = useDiscussionIdentifier(
    (state) => state.identifier,
  )

  return (
    <div className="flex flex-col w-full h-full">
      {/* Discussion content */}
      <DaDiscussionContent
        refetch={refetch}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        setIsReplying={setIsReplying}
        data={data}
      />

      {/* Replies  */}
      {!collapsed && data.replies && data.replies.length > 0 && (
        <div className="ml-12 space-y-3">
          {data.replies.map((child: any, index: number) => (
            <DaDiscussionItem refetch={refetch} key={index} data={child} />
          ))}
        </div>
      )}

      {/* Reply form */}
      {isReplying && discussionIdentifier && (
        <div className="ml-12 mt-2 mb-6">
          <FormCreateDiscussion
            refetch={refetch}
            refId={discussionIdentifier.refId}
            refType={discussionIdentifier.refType}
            replyingId={data.id}
            onCancel={() => setIsReplying(false)}
          />
        </div>
      )}
    </div>
  )
}

export default DaDiscussionItem
