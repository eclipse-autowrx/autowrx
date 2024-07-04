import { useEffect, useState } from 'react'
import { DaItemVerticalStandard } from '../molecules/DaItemVerticalStandard'
import { Link } from 'react-router-dom'
import { Prototype } from '@/types/model.type'
import DaTabItem from '../atoms/DaTabItem'
import {
  listRecentPrototypes,
  listPopularPrototypes,
} from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaLoading from '../atoms/DaLoading'

const HomePrototypeProposal = () => {
  const { data: user } = useSelfProfileQuery()
  const [popularPrototypes, setPopularPrototypes] = useState<Prototype[]>([])
  const [recentPrototypes, setRecentPrototypes] = useState<Prototype[]>([])
  const [renderedPrototypes, setRenderedPrototypes] = useState<Prototype[]>([])
  const [activeTab, setActiveTab] = useState<'popular' | 'recent'>('recent')

  useEffect(() => {
    const fetchProposalPrototypes = async () => {
      if (user) {
        const recentPrototypes = await listRecentPrototypes(user)
        setRecentPrototypes(recentPrototypes.data)
        const popularPrototypes = await listPopularPrototypes()
        setPopularPrototypes(popularPrototypes.results)
      }
    }
    fetchProposalPrototypes()
  }, [user])

  useEffect(() => {
    if (activeTab === 'popular') {
      setRenderedPrototypes(popularPrototypes)
    } else {
      setRenderedPrototypes(recentPrototypes)
    }
  }, [activeTab, popularPrototypes, recentPrototypes])

  return (
    user && (
      <div className="flex flex-col w-full container mt-12">
        <div className="flex justify-center space-x-2 w-full ">
          <DaTabItem
            active={activeTab === 'recent'}
            onClick={() => setActiveTab('recent')}
          >
            Recent Prototypes
          </DaTabItem>
          <DaTabItem
            active={activeTab === 'popular'}
            onClick={() => setActiveTab('popular')}
          >
            Popular Prototypes
          </DaTabItem>
        </div>
        {renderedPrototypes.length > 0 ? (
          <div className="flex  flex-col w-full items-center mt-6">
            <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {renderedPrototypes.map((prototype, pIndex) => (
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
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center">
            <DaLoading
              text="Loading prototypes..."
              showRetry={false}
              timeout={20}
              timeoutText={
                activeTab === 'popular'
                  ? 'There are no popular prototypes available yet.'
                  : 'Your recently accessed prototypes will be shown here.'
              }
            />
          </div>
        )}
      </div>
    )
  )
}

export { HomePrototypeProposal }
