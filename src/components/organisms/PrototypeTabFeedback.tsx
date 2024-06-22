import { useState, useEffect } from 'react'
import FeedbackForm from '../molecules/forms/FormFeedback'
import { DaText } from '@/components/atoms/DaText'
import DaStarsRating from '@/components/atoms/DaStarsRating'
import { Prototype } from '@/types/model.type'
import DaPopup from '../atoms/DaPopup'
import { DaButton } from '../atoms/DaButton'
import useListPrototypeFeedback from '@/hooks/useListPrototypeFeedback'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { TbChartDots, TbTrash } from 'react-icons/tb'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { deleteFeedback } from '@/services/feedback.service'
import DaConfirmPopup from '../molecules/DaConfirmPopup'
import DaLoading from '../atoms/DaLoading'
import {
  DaPaging,
  DaPaginationContent,
  DaPaginationItem,
  DaPaginationLink,
  DaPaginationPrevious,
  DaPaginationNext,
} from '../atoms/DaPaging'
import { Link, useParams } from 'react-router-dom'

const PrototypeTabFeedback = () => {
  const [isOpenPopup, setIsOpenPopup] = useState(false)
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.substring(1)
    return hash ? parseInt(hash, 10) : 1
  })
  const { data: profile } = useSelfProfileQuery()
  const { data: prototype } = useCurrentPrototype()
  const { model_id } = useParams()
  const {
    data: prototypeFeedbacks,
    refetch,
    isLoading,
  } = useListPrototypeFeedback(prototype?.id || '', currentPage)

  useEffect(() => {
    window.location.hash = currentPage.toString()
    const newPage = parseInt(window.location.hash.substring(1), 10) // in case of coping the link with the page number
    setCurrentPage(newPage)
    refetch()
  }, [currentPage])

  const handleDeleteFeedback = async (id: string) => {
    await deleteFeedback(id)
    await refetch()
  }

  return (
    <div className="container h-full mt-6">
      <div className="flex w-full justify-between">
        <div>
          <DaText variant="title" className="text-da-primary-500">
            End-User Feedback
          </DaText>
          <div className="items-center flex">
            <DaText variant="regular">Overall:</DaText>
            <DaStarsRating
              readonly={true}
              initialRating={(prototype as Prototype)?.avg_score ?? 0}
            />
            ({(prototype as Prototype)?.avg_score?.toFixed(2) ?? 0})
          </div>
        </div>
        <div className="flex">
          <Link to={`/model/${model_id}/library/portfolio`}>
            <DaButton size="sm" variant="outline-nocolor" className="mr-2">
              <TbChartDots className="w-4 h-4 mr-1" />
              View Portfolio
            </DaButton>
          </Link>
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
            <FeedbackForm
              onClose={() => {
                setIsOpenPopup(false)
              }}
            />
          </DaPopup>
        </div>
      </div>
      {isLoading ? (
        <DaLoading
          text="Loading feedbacks..."
          timeout={20}
          timeoutText="Failed to load feedbacks. Please try again."
          fullScreen={true}
        />
      ) : prototypeFeedbacks &&
        prototypeFeedbacks.results &&
        prototypeFeedbacks.results.length > 0 ? (
        <div className="mt-8">
          {prototypeFeedbacks.results.map((feedback) => (
            <div key={feedback.id} className="border p-4 mb-4  rounded-lg">
              <div className="flex w-full">
                <div className="space-x-6">
                  <DaText variant="sub-title" className="text-da-primary-500">
                    {feedback.interviewee.name}
                  </DaText>
                  <DaText variant="small" className="ml-auto">
                    Organization: {feedback.interviewee.organization}
                  </DaText>
                </div>
                {profile && profile?.id === feedback.created_by && (
                  <DaConfirmPopup
                    onConfirm={() => handleDeleteFeedback(feedback.id)}
                    label="Are you sure you want to delete this feedback?"
                  >
                    <DaButton
                      variant="destructive"
                      size="sm"
                      className="ml-auto"
                    >
                      <TbTrash className="w-4 h-4 mr-1" /> Delete Your Feedback
                    </DaButton>
                  </DaConfirmPopup>
                )}
              </div>
              <div className="flex w-full">
                <div className="flex-1">
                  <div className="mt-2 flex items-center">
                    <DaText variant="regular-bold">Needs addressed:</DaText>
                    <DaStarsRating
                      readonly
                      initialRating={feedback.score.need_address || 0}
                    />
                  </div>
                  <div className="mt-2 flex items-center">
                    <DaText variant="regular-bold">Relevance:</DaText>
                    <DaStarsRating
                      readonly
                      initialRating={feedback.score.relevance || 0}
                    />
                  </div>
                  <div className="mt-2 flex items-center">
                    <DaText variant="regular-bold">Ease of use:</DaText>
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
          <DaPaging className="pt-3 pb-6">
            <DaPaginationContent>
              <DaPaginationItem>
                <DaPaginationPrevious
                  href={`#${currentPage - 1}`}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage == 1}
                />
              </DaPaginationItem>
              {[...Array(prototypeFeedbacks.totalPages)].map((_, index) => (
                <DaPaginationItem key={index}>
                  <DaPaginationLink
                    href={`#${index + 1}`}
                    isActive={currentPage === index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </DaPaginationLink>
                </DaPaginationItem>
              ))}
              <DaPaginationItem>
                <DaPaginationNext
                  href={`#${currentPage + 1}`}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage == prototypeFeedbacks.totalPages}
                />
              </DaPaginationItem>
            </DaPaginationContent>
          </DaPaging>
        </div>
      ) : (
        <div className="flex w-full h-full items-center justify-center">
          <DaText variant="title" className="">
            No feedback found.
          </DaText>
        </div>
      )}
    </div>
  )
}

export default PrototypeTabFeedback
