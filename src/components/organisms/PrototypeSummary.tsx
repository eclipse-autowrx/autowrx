import { DaText } from '../atoms/DaText'
import { DaImage } from '../atoms/DaImage'
import { DaTag } from '../atoms/DaTag'
import { DaTableProperty } from '../molecules/DaTableProperty'
import { DaAvatar } from '../atoms/DaAvatar'
import { DaButton } from '../atoms/DaButton'
import { TbArrowRight } from 'react-icons/tb'
import { Link } from 'react-router-dom'
import { Prototype } from '@/types/model.type'
import DaUserProfile from '../molecules/DaUserProfile'

interface PrototypeSummaryProps {
  prototype: Prototype
}

const PrototypeSummary = ({ prototype }: PrototypeSummaryProps) => {
  return (
    <div className="rounded-lg w-full">
      <DaImage
        src={
          prototype.image_file
            ? prototype.image_file
            : 'https://placehold.co/600x400'
        }
        className="w-full object-cover max-h-[400px]"
      />
      <div className="p-5">
        <div className="flex justify-between items-center">
          <DaText variant="title" className="text-da-primary-500">
            {prototype.name}
          </DaText>
          <Link
            to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/view`}
          >
            <DaButton variant="solid" size="sm">
              Open
              <TbArrowRight className="w-5 h-5 ml-2" />
            </DaButton>
          </Link>
        </div>
        <DaUserProfile className="mt-2" userId={prototype.created_by} />

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
              name: 'Problem',
              value: prototype.description.problem,
            },
            {
              name: 'Says who?',
              value: prototype.description.says_who,
            },
            {
              name: 'Solution',
              value: prototype.description.solution,
            },
            {
              name: 'Status',
              value:
                prototype.state === 'Released' ||
                prototype.state === 'Developing'
                  ? prototype.state
                  : 'Developing',
            },
            { name: 'Complexity', value: prototype.complexity_level },
          ]}
          maxWidth="500px"
          className="mt-4"
        />
      </div>
    </div>
  )
}

export default PrototypeSummary
