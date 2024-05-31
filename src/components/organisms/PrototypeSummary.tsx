import { DaText } from '../atoms/DaText'
import { DaImage } from '../atoms/DaImage'
import { DaTag } from '../atoms/DaTag'
import { DaTableProperty } from '../molecules/DaTableProperty'
import { DaAvatar } from '../atoms/DaAvatar'
import { DaButton } from '../atoms/DaButton'
import { TbArrowRight } from 'react-icons/tb'
import { Link } from 'react-router-dom'
import { Prototype } from '@/types/model.type'

interface PrototypeSummaryProps {
  prototype: Prototype,
  prototypeAuthorName: string
  prototypeTags: string[]
  prototypeProperties: { property: string; value: string }[]
  prototypeImageUrl: string
  prototypeAuthorAvatarUrl: string
}

const PrototypeSummary = ({
  prototype,
  prototypeAuthorName,
  prototypeTags,
  prototypeProperties,
  prototypeImageUrl,
  prototypeAuthorAvatarUrl,
}: PrototypeSummaryProps) => {
  return (
    <div className="rounded-lg w-full">
      <DaImage
        src={prototypeImageUrl}
        className="w-full object-cover max-h-[400px]"
      />
      <div className="p-5">
        <div className="flex justify-between items-center">
          <DaText variant="title" className="text-gray-600">
            {prototype.name}
          </DaText>
          <Link to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/view`}>
            <DaButton variant="solid" className="text-sm">
              Open
              <TbArrowRight className="w-5 h-5 ml-1" />
            </DaButton>
          </Link>
        </div>
        <div className="flex items-center pt-2">
          <DaAvatar
            src={prototypeAuthorAvatarUrl}
            alt="Jame Bond"
            className="mr-2 w-7 h-7"
          />
          <DaText>{prototypeAuthorName}</DaText>
        </div>

        <div className="flex flex-wrap mt-4">
          {prototypeTags.map((tag) => (
            <DaTag variant={'secondary'} className="mr-2 mb-2">
              {tag}
            </DaTag>
          ))}
        </div>

        <DaTableProperty
          properties={prototypeProperties}
          maxWidth="500px"
          className="mt-4"
        />
      </div>
    </div>
  )
}

export default PrototypeSummary
