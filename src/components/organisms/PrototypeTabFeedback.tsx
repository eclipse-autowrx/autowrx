import React, { useState, useEffect } from 'react'
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
import DaLoadingWrapper from '../molecules/DaLoadingWrapper'

import {
  DaPaging,
  DaPaginationContent,
  DaPaginationItem,
  DaPaginationLink,
  DaPaginationPrevious,
  DaPaginationNext,
} from '../atoms/DaPaging'
import { Link, useParams } from 'react-router-dom'
import { addLog } from '@/services/log.service'

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
    const newPage = parseInt(window.location.hash.substring(1), 10) // in case of copying the link with the page number
    setCurrentPage(newPage)
    refetch()
  }, [currentPage])

  const handleDeleteFeedback = async (id: string) => {
    await deleteFeedback(id)
    await refetch()
    addLog({
      name: `User ${profile?.name} deleted feedback`,
      description: `User ${profile?.name} with id ${profile?.id} deleted feedback with id ${id} from prototype ${prototype?.name}`,
      type: 'delete-feedback',
      create_by: profile?.id!,
      ref_id: id,
      ref_type: 'feedback',
      parent_id: prototype?.id,
    })
  }

  return (
    <div className="flex flex-col w-full h-full bg-slate-200 p-2">
      <div className="flex flex-col w-full h-full bg-white rounded-lg  overflow-y-auto">
        <div className="flex flex-col container h-full mt-6">
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
          <DaLoadingWrapper
            isLoading={isLoading}
            data={prototypeFeedbacks?.results}
            loadingMessage="Loading feedbacks..."
            emptyMessage="No feedback found."
            timeoutMessage="Failed to load feedbacks. Please try again."
            timeout={20}
          >
            {prototypeFeedbacks && prototypeFeedbacks.results.length > 0 && (
              <div className="mt-8 w-full">
                {prototypeFeedbacks.results.map((feedback) => (
                  <div key={feedback.id} className="border p-4 mb-4 rounded-lg">
                    <div className="flex w-full">
                      <div className="space-x-6">
                        <DaText
                          variant="sub-title"
                          className="text-da-primary-500"
                        >
                          {feedback.interviewee.name}
                        </DaText>
                        <DaText variant="small" className="ml-auto">
                          Organization: {feedback.interviewee.organization}
                        </DaText>
                      </div>
                      {profile && profile?.id === feedback.created_by && (
                        <DaConfirmPopup
                          title="Delete Feedback"
                          onConfirm={() => handleDeleteFeedback(feedback.id)}
                          label="Are you sure you want to delete this feedback?"
                        >
                          <DaButton
                            variant="destructive"
                            size="sm"
                            className="ml-auto"
                          >
                            <TbTrash className="w-4 h-4 mr-1" /> Delete Your
                            Feedback
                          </DaButton>
                        </DaConfirmPopup>
                      )}
                    </div>
                    <div className="flex w-full">
                      <div className="flex-1">
                        <div className="mt-2 flex items-center">
                          <DaText variant="regular-bold">
                            Needs addressed:
                          </DaText>
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
                          <DaText variant="regular">
                            {feedback.recommendation}
                          </DaText>
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
                    {[...Array(prototypeFeedbacks.totalPages)].map(
                      (_, index) => (
                        <DaPaginationItem key={index}>
                          <DaPaginationLink
                            href={`#${index + 1}`}
                            isActive={currentPage === index + 1}
                            onClick={() => setCurrentPage(index + 1)}
                          >
                            {index + 1}
                          </DaPaginationLink>
                        </DaPaginationItem>
                      ),
                    )}
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
            )}
          </DaLoadingWrapper>
        </div>
      </div>
    </div>
  )
}

export default PrototypeTabFeedback
