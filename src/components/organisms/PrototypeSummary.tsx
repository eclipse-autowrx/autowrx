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
  prototype: Prototype
}

const PrototypeSummary = ({ prototype }: PrototypeSummaryProps) => {
  return (
    <div className="rounded-lg w-full">
      <DaImage
        src={prototype.image_file}
        className="w-full object-cover max-h-[400px]"
      />
      <div className="p-5">
        <div className="flex justify-between items-center">
          <DaText variant="title" className="text-gray-600">
            {prototype.name}
          </DaText>
          <Link
            to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/view`}
          >
            <DaButton variant="solid" className="text-sm">
              Open
              <TbArrowRight className="w-5 h-5 ml-1" />
            </DaButton>
          </Link>
        </div>
        <div className="flex items-center pt-2">
          <DaAvatar
            src={'/imgs/1.jpg'}
            alt="Jame Bond"
            className="mr-2 w-7 h-7"
          />
          <DaText>John Doe</DaText>
        </div>

        {prototype.tags && (
          <div className="flex flex-wrap mt-4">
            {prototype.tags.map((tag) => (
              <DaTag variant={'secondary'} className="mr-2 mb-2">
                {tag.tag}
              </DaTag>
            ))}
          </div>
        )}

        <DaTableProperty
          properties={[
            {
              property: 'Problem',
              value: prototype.description.problems,
            },
            {
              property: 'Says who?',
              value: prototype.description.says_who,
            },
            {
              property: 'Solution',
              value: prototype.description.solution,
            },
            {
              property: 'Status',
              value: prototype.description.status,
            },
            { property: 'Complexity', value: prototype.complexity_level },
          ]}
          maxWidth="500px"
          className="mt-4"
        />
      </div>
    </div>
  )
}

export default PrototypeSummary
