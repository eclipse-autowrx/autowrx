import { useEffect, useState } from 'react'
import { DaItemVerticalStandard } from '../molecules/DaItemVerticalStandard'
import { Link } from 'react-router-dom'
import { Prototype } from '@/types/model.type'
import { listPopularPrototypes } from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaLoading from '../atoms/DaLoading'
import DaText from '../atoms/DaText'
import { TbChevronDown, TbChevronRight } from 'react-icons/tb' // Import icons
import { DaButton } from '../atoms/DaButton'

type HomePrototypePopularProps = {
  requiredLogin?: boolean
  title?: string
}

const HomePrototypePopular = ({
  requiredLogin,
  title,
}: HomePrototypePopularProps) => {
  const { data: user } = useSelfProfileQuery()
  const [popularPrototypes, setPopularPrototypes] = useState<
    Prototype[] | undefined
  >(undefined)
  const [showMore, setShowMore] = useState(false) // State for toggling view

  useEffect(() => {
    const fetchProposalPrototypes = async () => {
      const popularPrototypes = await listPopularPrototypes()
      setPopularPrototypes(popularPrototypes)
    }
    fetchProposalPrototypes()
  }, [user])

  if (requiredLogin && !user) {
    return null
  }

  if (popularPrototypes && popularPrototypes.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col w-full container ">
      {popularPrototypes ? (
        <>
          <div className="flex items-center justify-between">
            <DaText variant="sub-title" className="text-da-primary-500">
              {title || 'Popular Prototypes'}
            </DaText>
            {popularPrototypes.length > 4 && (
              <div className="flex justify-center">
                <DaButton
                  size="sm"
                  variant="plain"
                  onClick={() => setShowMore(!showMore)}
                  className="flex items-center !text-da-primary-500"
                >
                  {showMore ? (
                    <>
                      Show Less
                      <TbChevronRight className="ml-1" />
                    </>
                  ) : (
                    <>
                      Show More
                      <TbChevronDown className="ml-1" />
                    </>
                  )}
                </DaButton>
              </div>
            )}
          </div>
          <div className="mt-2 w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {popularPrototypes &&
              popularPrototypes
                .slice(0, showMore ? popularPrototypes.length : 4) // Limit items based on showMore
                .map((prototype, pIndex) => (
                  <Link
                    to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/view`}
                    key={pIndex}
                  >
                    <DaItemVerticalStandard
                      title={prototype.name}
                      content={prototype.description?.solution}
                      imageUrl={prototype.image_file}
                      maxWidth="400px"
                    />
                  </Link>
                ))}
          </div>
        </>
      ) : (
        <div className="flex min-h-[200px] items-center">
          <DaLoading
            text="Loading prototypes..."
            showRetry={false}
            timeout={20}
            timeoutText={'There are no prototypes available yet'}
            stopLoading={popularPrototypes !== undefined}
          />
        </div>
      )}
    </div>
  )
}

export default HomePrototypePopular
