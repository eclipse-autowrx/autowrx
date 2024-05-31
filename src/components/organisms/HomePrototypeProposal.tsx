import { FC, useEffect, useState } from 'react'
import { DaItemVerticalStandard } from '../molecules/DaItemVerticalStandard'
import { DaText } from '../atoms/DaText'
import { Link } from 'react-router-dom'
import { listProposalPrototype } from '@/services/prototype.service'

const HomePrototypeProposal: FC = () => {
  const [prototypes, setPrototypes] = useState<any[]>([])

  const getPrototypes = async () => {
    try {
      let protosData = await listProposalPrototype()
      if (protosData && protosData.results) {
        setPrototypes(protosData.results)
      }
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    getPrototypes()
  }, [])

  return (
    <div className="flex container flex-col w-full items-center">
      <DaText variant="sub-title" className="text-da-primary-500 pt-6 pb-10">
        Popular Prototypes
      </DaText>
      <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {prototypes.map((prototype, pIndex) => (
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
  )
}

export { HomePrototypeProposal }
