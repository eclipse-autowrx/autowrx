import useListDiscussions from '@/hooks/useListDiscussions'
import { DaText } from '../atoms/DaText'
import FormCreateDiscussion from './forms/FormCreateDiscussion'
import DaDiscussionItem from './DaDiscussionItem'
import { Fragment } from 'react'

const DaDiscussions = () => {
  const { data } = useListDiscussions('', '')

  return (
    <div className="px-2 md:px-6 py-4 w-[600px] min-w-[500px] ">
      <DaText variant="title" className="text-da-primary-500">
        Discussions
      </DaText>
      {data?.results && (
        <div className="my-4">
          {data.results.map((discussion, index) => (
            <Fragment key={discussion.id}>
              <DaDiscussionItem data={discussion} />
              {index < data.results.length - 1 && (
                <div className="my-4 border-t border-da-gray-light" />
              )}
            </Fragment>
          ))}
        </div>
      )}
      <FormCreateDiscussion />
    </div>
  )
}

export default DaDiscussions
