import { FC, useState } from 'react'
import { TbStarFilled } from 'react-icons/tb'
import { DaButton } from '@/components/atoms/DaButton'

interface Review {
  id: string
  rating: number
  content: string
  images: string[]
  createdBy: {
    _id: string
    fullName: string
  }
  createdAt: string
}

interface RatingProps {
  rating: number
  outOf?: number
}

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
  return new Date(dateString).toLocaleDateString('en-GB', options)
}

const Rating: FC<RatingProps> = ({ rating, outOf = 5 }) => {
  return (
    <div className="flex">
      {[...Array(outOf)].map((_, index) => (
        <TbStarFilled
          key={index}
          className={`h-4 w-4 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  )
}

interface WidgetReviewProps {
  reviews: Review[]
}

const DaWidgetReview: React.FC<WidgetReviewProps> = ({ reviews }) => {
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(3)

  const handleSeeMore = () => {
    setVisibleReviewsCount((prevCount) => prevCount + 5)
  }
  return (
    <div className="flex flex-col w-full overflow-y-auto">
      {reviews.slice(0, visibleReviewsCount).map((review) => (
        <div
          key={review.id}
          className="flex flex-col p-3 my-2 bg-da-gray-light rounded"
        >
          <div className="flex flex-col mb-2 w-full">
            <div className="flex w-full items-center mb-3">
              <img
                src="/imgs/profile.png"
                alt="profile"
                className="flex w-5 h-5 rounded-full"
              />
              <div className="ml-2 text-sm text-da-gray-medium">
                {review.createdBy.fullName}
              </div>
            </div>
            <div className="flex items-center">
              <Rating rating={review.rating} />
              <div className="da-label-small text-da-gray-dark ml-2">
                {formatDate(review.createdAt)}
              </div>
            </div>
          </div>
          <div className="text-da-gray-medium">{review.content}</div>
        </div>
      ))}
      {visibleReviewsCount < reviews.length && (
        <DaButton variant="plain" onClick={handleSeeMore}>
          See all reviews
        </DaButton>
      )}
    </div>
  )
}

export default DaWidgetReview
