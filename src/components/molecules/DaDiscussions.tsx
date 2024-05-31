import useListDiscussions from '@/hooks/useListDiscussions'
import { DaText } from '../atoms/DaText'
import FormCreateDiscussion from './forms/FormCreateDiscussion'
import DaDiscussionItem from './DaDiscussionItem'

const DaDiscussions = () => {
  const { data } = useListDiscussions('', '')

  return (
    <div className="px-2 md:px-6 py-4 w-[600px] min-w-[500px] ">
      <DaText variant="title" className="text-da-primary-500">
        Discussions
      </DaText>
      {data?.results && (
        <div className="my-4 space-y-10">
          {data.results.map((discussion) => (
            <DaDiscussionItem key={discussion.id} data={discussion} />
          ))}
        </div>
      )}
      <FormCreateDiscussion />
    </div>
  )
}

export default DaDiscussions
