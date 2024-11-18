import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Prototype } from '@/types/model.type'
import { listRecentPrototypes } from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaText from '../atoms/DaText'
import { TbChevronDown, TbChevronRight } from 'react-icons/tb'
import { DaButton } from '../atoms/DaButton'
import { DaPrototypeItem } from '../molecules/DaPrototypeItem'
import DaSkeletonGrid from '../molecules/DaSkeletonGrid'

type HomePrototypeRecentProps = {
  title?: string
}

const HomePrototypeRecent = ({ title }: HomePrototypeRecentProps) => {
  const { data: user } = useSelfProfileQuery()
  const [recentPrototypes, setRecentPrototypes] = useState<
    Prototype[] | undefined
  >(undefined)
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    const fetchProposalPrototypes = async () => {
      if (user) {
        const recentPrototypes = await listRecentPrototypes()
        setRecentPrototypes(recentPrototypes)
      }
    }
    fetchProposalPrototypes()
  }, [user])

  if (recentPrototypes && recentPrototypes.length === 0) {
    return null
  }

  return (
    user && (
      <div className="flex flex-col w-full container">
        <div className="flex items-center justify-between">
          <DaText variant="sub-title" className="text-da-primary-500">
            {title || 'Recent Prototypes'}
          </DaText>
          {recentPrototypes && recentPrototypes.length > 4 && (
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

        {recentPrototypes ? (
          <div className="mt-2 w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recentPrototypes
              .slice(0, showMore ? recentPrototypes.length : 4)
              .map((prototype, pIndex) => (
                <Link
                  to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/view`}
                  key={pIndex}
                >
                  <DaPrototypeItem prototype={prototype} />
                </Link>
              ))}
          </div>
        ) : (
          <div className="mt-2">
            <DaSkeletonGrid
              timeout={15}
              timeoutText="There are no recent prototypes available yet"
              maxItems={{
                sm: 1,
                md: 2,
                lg: 3,
                xl: 4,
              }}
              containerHeight="min-h-[200px]"
            />
          </div>
        )}
      </div>
    )
  )
}

export default HomePrototypeRecent
