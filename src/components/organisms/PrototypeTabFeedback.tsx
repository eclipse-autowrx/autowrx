import { useState } from 'react'
import mockFeedbackData from '@/data/feedback_mock'
import FeedbackForm from '../molecules/forms/FormFeedback'
import { DaText } from '@/components/atoms/DaText'
import DaStarsRating from '@/components/atoms/DaStarsRating'
import { Feedback } from '@/types/model.type'
import DaPopup from '../atoms/DaPopup'
import { DaButton } from '../atoms/DaButton'

const PrototypeTabFeedback = () => {
  const [feedbackData, setFeedbackData] = useState<Feedback[]>(mockFeedbackData)
  const [isOpenPopup, setIsOpenPopup] = useState(false)

  const addFeedback = (newFeedback: Feedback) => {
    setFeedbackData([...feedbackData, newFeedback])
  }

  return (
    <div className="container mt-6">
      <div className="flex w-full justify-between">
        <div>
          <DaText variant="title" className="text-da-primary-500">
            END-USER FEEDBACK
          </DaText>
          <div className="items-center flex">
            <DaText variant="regular">Overall:</DaText>
            <DaStarsRating
              readonly
              initialRating={
                feedbackData.reduce(
                  (sum, item) => sum + (item.score.needAddress || 0),
                  0,
                ) / feedbackData.length
              }
            />
          </div>
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
      <div className="mt-8">
        {feedbackData.map((feedback) => (
          <div key={feedback.id} className="border p-4 mb-4  rounded-lg">
            <DaText variant="regular-bold" className="text-da-primary-500">
              {feedback.interviewee.name} ({feedback.interviewee.org})
            </DaText>
            <div className="flex w-full">
              <div className="flex-1">
                <div className="mt-2 flex items-center">
                  <DaText variant="regular">Needs addressed:</DaText>
                  <DaStarsRating
                    readonly
                    initialRating={feedback.score.needAddress || 0}
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
                    initialRating={feedback.score.easyToUse || 0}
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
    </div>
  )
}

export default PrototypeTabFeedback
