import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Prototype } from '@/types/model.type'
import { listPopularPrototypes } from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaText from '../atoms/DaText'
import { TbChevronDown, TbChevronRight } from 'react-icons/tb'
import { DaButton } from '../atoms/DaButton'
import DaPopup from '../atoms/DaPopup'
import useAuthStore from '@/stores/authStore'
import { DaPrototypeItem } from '../molecules/DaPrototypeItem'
import DaSkeletonGrid from '../molecules/DaSkeletonGrid'

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
  const [showMore, setShowMore] = useState(false)
  const navigate = useNavigate()

  const [openRemindDialog, setOpenRemindDialog] = useState(false)
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype | null>(
    null,
  )
  const { setOpenLoginDialog } = useAuthStore()

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

  const handlePrototypeClick = (prototype: Prototype) => {
    if (!user) {
      setSelectedPrototype(prototype)
      setOpenRemindDialog(true)
    } else {
      navigate(
        `/model/${prototype.model_id}/library/prototype/${prototype.id}/view`,
      )
    }
  }

  return (
    <div className="flex flex-col w-full container">
      <div className="flex items-center justify-between">
        <DaText variant="sub-title" className="text-da-primary-500">
          {title || 'Popular Prototypes'}
        </DaText>
        {popularPrototypes && popularPrototypes.length > 4 && (
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

      {popularPrototypes ? (
        <div className="mt-2 w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {popularPrototypes
            .slice(0, showMore ? popularPrototypes.length : 4)
            .map((prototype, pIndex) => (
              <div
                key={pIndex}
                onClick={() => handlePrototypeClick(prototype)}
                className="cursor-pointer"
              >
                <DaPrototypeItem prototype={prototype} />
              </div>
            ))}
        </div>
      ) : (
        <div className="mt-2">
          <DaSkeletonGrid
            timeout={15}
            timeoutText="There are no popular prototypes available yet"
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

      {/* Popup Dialog */}
      <DaPopup
        state={[openRemindDialog, setOpenRemindDialog]}
        trigger={<span></span>}
      >
        <div className="flex flex-col max-w-xl">
          <DaText variant="sub-title" className="text-da-primary-500">
            Sign In Required
          </DaText>
          <DaText className="mt-4">
            You must first sign in to explore SDV idea about
            <span className="text-da-gray-dark px-1 font-bold">
              {selectedPrototype?.name}
            </span>
          </DaText>
          <div className="flex justify-end mt-6">
            <DaButton
              variant="solid"
              size="sm"
              onClick={() => {
                setOpenRemindDialog(false)
                setOpenLoginDialog(true)
              }}
              className="w-20"
            >
              Sign In
            </DaButton>
          </div>
        </div>
      </DaPopup>
    </div>
  )
}

export default HomePrototypePopular
