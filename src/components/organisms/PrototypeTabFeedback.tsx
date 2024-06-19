import { useState } from 'react'
import FeedbackForm from '../molecules/forms/FormFeedback'
import { DaText } from '@/components/atoms/DaText'
import DaStarsRating from '@/components/atoms/DaStarsRating'
import { Feedback } from '@/types/model.type'
import DaPopup from '../atoms/DaPopup'
import { DaButton } from '../atoms/DaButton'
import useListPrototypeFeedback from '@/hooks/useListPrototypeFeedback'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { TbTrash } from 'react-icons/tb'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { deleteFeedback } from '@/services/feedback.service'

const PrototypeTabFeedback = () => {
  const [isOpenPopup, setIsOpenPopup] = useState(false)
  const { data: profile } = useSelfProfileQuery()
  const { data: prototype } = useCurrentPrototype()
  const { data: prototypeFeedbacks, refetch } = useListPrototypeFeedback(
    prototype?.id || '',
  )

  const handleDeleteFeedback = async (id: string) => {
    await deleteFeedback(id)
    await refetch()
  }

  return (
    <div className="container mt-6">
      <div className="flex w-full justify-between">
        <div>
          <DaText variant="title" className="text-da-primary-500">
            END-USER FEEDBACK
          </DaText>
          {/* <div className="items-center flex">
            <DaText variant="regular">Overall:</DaText>
            <DaStarsRating
              readonly
              initialRating={
                prototypeFeedbacks.reduce(
                  (sum, item) => sum + (item.score.needAddress || 0),
                  0,
                ) / prototypeFeedbacks.length
              }
            />
          </div> */}
        </div>
        <DaPopup
          state={[isOpenPopup, setIsOpenPopup]}
          trigger={
            <DaButton
              size="sm"
              onClick={() =>
                document
                  .getElementById('feedbackForm')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              + Add Feedback
            </DaButton>
          }
        >
          <FeedbackForm />
        </DaPopup>
      </div>
      {prototypeFeedbacks && prototypeFeedbacks.length > 0 && (
        <div className="mt-8">
          {prototypeFeedbacks.map((feedback) => (
            <div key={feedback.id} className="border p-4 mb-4  rounded-lg">
              <div className="flex w-full">
                <DaText variant="regular-bold" className="text-da-primary-500">
                  {feedback.interviewee.name} (
                  {feedback.interviewee.organization})
                </DaText>
                {profile && profile?.id === feedback.created_by && (
                  <DaButton
                    variant="destructive"
                    size="sm"
                    className="ml-auto"
                    onClick={() => handleDeleteFeedback(feedback.id)}
                  >
                    <TbTrash className="w-4 h-4 mr-1" /> Delete Feedback
                  </DaButton>
                )}
              </div>
              <div className="flex w-full">
                <div className="flex-1">
                  <div className="mt-2 flex items-center">
                    <DaText variant="regular">Needs addressed:</DaText>
                    <DaStarsRating
                      readonly
                      initialRating={feedback.score.need_address || 0}
                    />
                  </div>
                  <div className="mt-2 flex items-center">
                    <DaText variant="regular">Relevance:</DaText>
                    <DaStarsRating
                      readonly
                      initialRating={feedback.score.relevance || 0}
                    />
                  </div>
                  <div className="mt-2 flex items-center">
                    <DaText variant="regular">Ease of use:</DaText>
                    <DaStarsRating
                      readonly
                      initialRating={feedback.score.easy_to_use || 0}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mt-2">
                    <DaText variant="regular-bold" className="mr-2">
                      Questions:
                    </DaText>
                    <DaText variant="regular">{feedback.question}</DaText>
                  </div>
                  <div className="mt-2">
                    <DaText variant="regular-bold" className="mr-2">
                      Recommendations:
                    </DaText>
                    <DaText variant="regular">{feedback.recommendation}</DaText>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PrototypeTabFeedback
