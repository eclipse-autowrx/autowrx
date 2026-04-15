// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Discussion, DISCUSSION_REF_TYPE } from '@/types/discussion.type'
import useListDiscussions from '@/hooks/useListDiscussions'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { deleteDiscussionService } from '@/services/discussion.service'
import FormCreateDiscussion from '@/components/molecules/forms/FormCreateDiscussion'
import DaConfirmPopup from '@/components/molecules/DaConfirmPopup'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar'
import { Button } from '@/components/atoms/button'
import { DaButton } from '@/components/atoms/DaButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import {
  TbLoader,
  TbMessage,
  TbArrowBack,
  TbPencil,
  TbTrash,
  TbChevronDown,
  TbChevronUp,
  TbBubble,
  TbDotsVertical,
  TbUser,
} from 'react-icons/tb'

interface DaDiscussionsProps {
  refId: string
  refType: DISCUSSION_REF_TYPE
  className?: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const day = d.getDate()
  const mon = MONTHS[d.getMonth()]
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${mon} ${year}, ${hours}:${mins}`
}

function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const DiscussionItem = ({
  discussion,
  currentUserId,
  refId,
  refType,
  refetch,
  isReply = false,
}: {
  discussion: Discussion
  currentUserId?: string
  refId: string
  refType: DISCUSSION_REF_TYPE
  refetch: () => Promise<unknown>
  isReply?: boolean
}) => {
  const [replyOpen, setReplyOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [repliesExpanded, setRepliesExpanded] = useState(false)

  const isOwner = currentUserId === discussion.created_by?.id

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteDiscussionService(discussion.id)
      await refetch()
    } finally {
      setDeleting(false)
    }
  }

  const replies = discussion.replies ?? []
  const hasReplies = replies.length > 0

  return (
    <div className={cn('flex flex-col', isReply && 'ml-10')}>
      {/* Header row: avatar + name + date + menu */}
      <div className="flex items-center gap-3">
        <Avatar className="size-8 shrink-0">
          {discussion.created_by?.image_file && (
            <AvatarImage src={discussion.created_by.image_file} alt={discussion.created_by?.name} />
          )}
          <AvatarFallback className="bg-muted-foreground text-white">
            <TbUser className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <span className="text-base font-semibold truncate">
          {discussion.created_by?.name ?? 'Unknown'}
        </span>
        <span className="text-sm text-muted-foreground shrink-0">
          {formatDate(discussion.created_at)}
        </span>
        <div className="ml-auto shrink-0">
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <TbDotsVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <TbPencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTimeout(() => setConfirmDeleteOpen(true), 100)}
                  disabled={deleting}
                  className="text-destructive focus:text-destructive"
                >
                  {deleting ? (
                    <TbLoader className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <TbTrash className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DaConfirmPopup
            onConfirm={handleDelete}
            state={[confirmDeleteOpen, setConfirmDeleteOpen]}
            label={`Are you sure you want to delete discussion with content: '${discussion.content}'${replies.length > 0 ? '. The replies will be deleted as well.' : '?'}`}
          >
            <></>
          </DaConfirmPopup>
        </div>
      </div>

      {/* Content: full width below header */}
      {editing ? (
        <div className="mt-2">
          <FormCreateDiscussion
            refId={refId}
            refType={refType}
            refetch={refetch}
            updatingData={discussion}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <div className="mt-2 rounded-lg bg-muted p-3">
          <p className="text-sm whitespace-pre-wrap break-words">{discussion.content}</p>
        </div>
      )}

      {/* Actions row */}
      {!editing && !isReply && (
        <div className="flex items-center justify-end gap-1 mt-2">
          {hasReplies && (
            <>
              <DaButton
                variant="plain"
                className="flex items-center text-sm text-primary font-semibold rounded-md px-2 py-1 transition-colors"
                onClick={() => setRepliesExpanded(!repliesExpanded)}
              >
                Reply ({replies.length})
              </DaButton>
              <DaButton
                variant="plain"
                className="flex hover:bg-primary/20 items-center text-sm text-foreground rounded-md px-2 py-1 transition-colors"
                onClick={() => setRepliesExpanded(!repliesExpanded)}
              >
                {repliesExpanded ? (
                  <>Collapse <TbChevronUp className="ml-1" /></>
                ) : (
                  <>Expand <TbChevronDown className="ml-1" /></>
                )}
              </DaButton>
            </>
          )}
          <DaButton
            variant="plain"
            className="flex hover:bg-primary/20 items-center text-sm text-foreground rounded-md px-2 py-1 transition-colors"
            onClick={() => setReplyOpen(!replyOpen)}
          >
            <TbArrowBack className="mr-1" />
            Reply
          </DaButton>
        </div>
      )}

      {/* Replies */}
      {repliesExpanded &&
        replies.map((reply) => (
          <div key={reply.id} className="mt-3">
            <DiscussionItem
              discussion={reply}
              currentUserId={currentUserId}
              refId={refId}
              refType={refType}
              refetch={refetch}
              isReply
            />
          </div>
        ))}

      {replyOpen && !isReply && (
        <div className="mt-3 ml-10">
          <FormCreateDiscussion
            refId={refId}
            refType={refType}
            refetch={refetch}
            replyingId={discussion.id}
            onCancel={() => setReplyOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

const DaDiscussions = ({ refId, refType, className }: DaDiscussionsProps) => {
  const { data, isLoading, refetch } = useListDiscussions(refId, refType)
  const { data: user } = useSelfProfileQuery()

  const discussions = data?.results ?? []
  const hasDiscussions = discussions.length > 0

  return (
    <div className={cn('flex flex-col w-full', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <TbMessage className="text-xl text-primary" />
        <h3 className="text-lg font-semibold">Discussions</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <TbLoader className="animate-spin text-2xl text-muted-foreground" />
          </div>
        )}

        {!isLoading && !hasDiscussions && (
          <div className="flex flex-col items-center justify-center p-6 bg-primary/10 rounded-lg">
            <TbBubble className="text-2xl text-primary mb-3" />
            <p className="text-sm text-muted-foreground">
              No discussion yet. Be the first one to start a discussion!
            </p>
          </div>
        )}

        {!isLoading && hasDiscussions && (
          <div className="flex flex-col gap-5">
            {discussions.map((discussion) => (
              <DiscussionItem
                key={discussion.id}
                discussion={discussion}
                currentUserId={user?.id}
                refId={refId}
                refType={refType}
                refetch={refetch}
              />
            ))}
          </div>
        )}
      </div>

      {/* New discussion form */}
      <div className="px-4 pt-4 pb-4 mt-auto">
        <FormCreateDiscussion refId={refId} refType={refType} refetch={refetch} />
      </div>
    </div>
  )
}

export default DaDiscussions
