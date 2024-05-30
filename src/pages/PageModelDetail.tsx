import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DaText } from '@/components/atoms/DaText'
import { DaCardIntro } from '@/components/molecules/DaCardIntro'
import useModelStore from '@/stores/modelStore'
import { Model } from '@/types/model.type'
import DaVehicleProperties from '@/components/molecules/DaVehicleProperties'
import DaContributorList from '@/components/molecules/DaContributorList'
import { DaButton } from '@/components/atoms/DaButton'

interface VisibilityControlProps {
  initialVisibility: string
  onVisibilityChange: (newVisibility: string) => void
}

const DaVisibilityControl: React.FC<VisibilityControlProps> = ({
  initialVisibility,
  onVisibilityChange,
}) => {
  const [visibility, setVisibility] = useState(initialVisibility)

  const toggleVisibility = () => {
    const newVisibility = visibility === 'public' ? 'private' : 'public'
    setVisibility(newVisibility)
    onVisibilityChange(newVisibility)
  }

  return (
    <div className="flex justify-between items-center border px-4 py-2.5 mt-3 rounded-lg">
      <DaText variant="sub-title" className="text-da-gray-medium">
        Visibility:{' '}
        <DaText className="text-da-accent-500 capitalize ">{visibility}</DaText>
      </DaText>
      <DaButton
        onClick={toggleVisibility}
        variant="outline-nocolor"
        size="sm"
        className="text-da-primary-500"
      >
        Change to {visibility === 'public' ? 'private' : 'public'}
      </DaButton>
    </div>
  )
}

const initialContributors = [
  { name: 'Dirk Slama', email: 'xxxxxxlama@bosch.com' },
  { name: 'Chris', email: 'xxxxxx17@gmail.com' },
  { name: 'Dennis Meister', email: 'xxxxxx.Meister@etas.com' },
  { name: 'Hoang Phan', email: 'xxxxxxphanthanh@vn.bosch.com' },
  { name: 'Phan Thanh Hoang', email: 'xxxxxxphanthanh@vn.bosch.com' },
  { name: 'Louis Jackman', email: 'xxxxxxackman00@gmail.com' },
]

const initialMembers = [
  { name: 'Member One', email: 'member.one@example.com' },
  { name: 'Member Two', email: 'member.two@example.com' },
]

const cardIntro = [
  {
    title: 'Architecture',
    content: 'Provide the big picture of the vehicle model',
    path: 'architecture',
  },
  {
    title: 'Prototype Library',
    content:
      'Build up, evaluate and prioritize your portfolio of connected vehicle applications',
    path: 'library',
  },
  {
    title: 'Vehicle APIs',
    content:
      'Browse, explore and enhance the catalogue of Connected Vehicle Interfaces',
    path: 'api',
  },
]

const PageModelDetail = () => {
  const [model] = useModelStore((state) => [state.model as Model])
  const [contributors, setContributors] = useState(initialContributors)
  const [members, setMembers] = useState(initialMembers)

  if (!model) {
    return (
      <div className="container grid place-items-center">
        <div className="p-8 text-da-gray-dark da-label-huge">
          Model not found
        </div>
      </div>
    )
  }

  const handleAddUser = () => {
    // Logic to add user
    const newUser = { name: 'New User', email: 'new.user@example.com' }
    setContributors([...contributors, newUser])
  }

  const handleRemoveUser = (email: string) => {
    setContributors(contributors.filter((user) => user.email !== email))
  }

  return (
    <div className="col-span-12 gap-4 grid grid-cols-12 h-full px-2 py-4 container space-y-2">
      <div className="col-span-6">
        <DaText variant="title" className="text-da-primary-500">
          {model.name}
        </DaText>

        {cardIntro.map((card, index) => (
          <Link key={index} to={card.path}>
            <div className="space-y-3 mt-3 da-clickable">
              <DaCardIntro
                key={index}
                title={card.title}
                content={card.content}
                maxWidth={'1000px'}
              />
            </div>
          </Link>
        ))}

        <DaVehicleProperties
          key={model.id}
          category={model.vehicle_category ? model.vehicle_category : ''}
          properties={model.property ? model.property : {}}
          className="mt-3"
        />

        <DaVisibilityControl
          initialVisibility={model.visibility}
          onVisibilityChange={() => {}}
        />

        <DaContributorList
          className="mt-3"
          contributors={contributors}
          members={members}
          onAddUser={handleAddUser}
          onRemoveUser={handleRemoveUser}
        />
      </div>
      <div className="col-span-6">
        <img src={model.model_home_image_file} alt={model.name} />
      </div>
    </div>
  )
}

export default PageModelDetail
