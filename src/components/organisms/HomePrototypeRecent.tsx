import { useEffect, useState } from 'react'
import { DaItemVerticalStandard } from '../molecules/DaItemVerticalStandard'
import { Link } from 'react-router-dom'
import { Prototype } from '@/types/model.type'
import { listRecentPrototypes } from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaLoading from '../atoms/DaLoading'
import DaText from '../atoms/DaText'
import { TbChevronDown, TbChevronLeft, TbChevronRight } from 'react-icons/tb' // Import icons
import { DaButton } from '../atoms/DaButton'
import { DaPrototypeItem } from '../molecules/DaPrototypeItem'

type HomePrototypeRecentProps = {
  title?: string
}

const HomePrototypeRecent = ({ title }: HomePrototypeRecentProps) => {
  const { data: user } = useSelfProfileQuery()
  const [recentPrototypes, setRecentPrototypes] = useState<
    Prototype[] | undefined
  >(undefined)
  const [showMore, setShowMore] = useState(false) // State for toggling view

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
      <div className="flex flex-col w-full container ">
        {recentPrototypes ? (
          <>
            <div className="flex items-center justify-between">
              <DaText variant="sub-title" className="text-da-primary-500">
                {title || 'Recent Prototypes'}
              </DaText>
              {recentPrototypes.length > 4 && ( // Show button only if there are more than 4 items
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
              {recentPrototypes &&
                recentPrototypes
                  .slice(0, showMore ? recentPrototypes.length : 4) // Limit items based on showMore
                  .map((prototype, pIndex) => (
                    <Link
                      to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/view`}
                      key={pIndex}
                    >
                      <DaPrototypeItem prototype={prototype} />
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
              stopLoading={recentPrototypes !== undefined}
            />
          </div>
        )}
      </div>
    )
  )
}

export default HomePrototypeRecent
