import { Discussion } from '@/types/discussion.type'
import { useState } from 'react'
import { TbArrowBack, TbChevronDown, TbChevronUp } from 'react-icons/tb'
import { DaAvatar } from '../atoms/DaAvatar'
import { DaButton } from '../atoms/DaButton'

type DaDiscussionItemProps = {
  data: Discussion
}

const DaDiscussionItem = ({ data }: DaDiscussionItemProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(false)

  return (
    <div>
      <div className="pr-2 da-label-small flex items-center">
        <DaAvatar
          src={data?.created_by.image_file || '/imgs/user.png'}
          alt={data?.created_by.name}
          fallback={<img src="/imgs/user.png" alt="User" />}
          className="select-none w-8 h-8 rounded-md overflow-hidden "
        />

        <div className="pl-2 da-label-regular-bold text-da-gray-dark font-bold">
          {data?.created_by.name || 'Anonymous'}
        </div>
        <div className="ml-4 da-label-tiny">
          {data.created_at.toLocaleDateString()}
        </div>
      </div>
      <div className="w-full mt-1 py-2 px-4 text-left bg-da-gray-light/50 text-da-gray-dark rounded">
        <div
          className="whitespace-pre-wrap da-label-small max-h-[200px] overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: data.content }}
        ></div>
      </div>

      <div className="flex items-center mt-2">
        <div className="grow"></div>

        {data.children && data.children.length > 0 && (
          <div className="flex items-center">
            <div className="text-da-gray-dark da-label-small mr-4">
              Reply ({data.children.length})
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
            // onClick={() => {
            //   if (showReplyForm) showReplyForm()
            // }}
          >
            <TbArrowBack className="mr-1" size={18} />
            Reply
          </div>
        )}
      </div>

      {!collapsed && data.children && data.children.length > 0 && (
        <div className="ml-12 space-y-7">
          {data.children.map((child: any, index: number) => (
            <DaDiscussionItem key={index} data={child} />
          ))}
        </div>
      )}
    </div>
  )
}

export default DaDiscussionItem
