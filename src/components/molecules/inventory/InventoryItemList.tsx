import { DaAvatar } from '@/components/atoms/DaAvatar'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import DaText from '@/components/atoms/DaText'
import DaTooltip from '@/components/atoms/DaTooltip'
import { InventoryItem as InventorItemType } from '@/types/inventory.type'
import { TbClock, TbPlus, TbSearch, TbX } from 'react-icons/tb'

const MOCK_DATA: InventorItemType[] = [
  {
    name: 'ADAS System',
    visibility: 'public',
    type: {
      createdAt: '2021-09-01T00:00:00.000Z',
      updatedAt: '2021-09-01T00:00:00.000Z',
      id: '1rfwe1',
      name: 'System Interface',
      description: 'System Interface',
      schema: {},
    },
    details: {
      name: 'Vehicle.ADAS',
      description: 'Advanced Driver Assistance System',
    },
    image:
      'https://www.bmwgroup.com/en/company/_jcr_content/main/layoutcontainer_1988/columncontrol/columncontrolparsys/globalimage.coreimg.jpeg/1701354503044/720x720-i5er.jpeg',
    created_by: {
      id: '1',
      name: 'Tuan Hoang Dinh Anh',
      image_file: 'https://i.redd.it/3z3lk8ouwjjc1.jpeg',
    },
    createdAt: '2021-09-01T00:00:00.000Z',
    updatedAt: '2021-09-01T00:00:00.000Z',
  },
  {
    name: 'Autonomous Navigation',
    visibility: 'public',
    type: {
      createdAt: '2021-09-01T00:00:00.000Z',
      updatedAt: '2021-09-01T00:00:00.000Z',
      id: '2xyzt9',
      name: 'System Interface',
      description: 'System Interface',
      schema: {},
    },
    details: {
      name: 'Vehicle.Autonomous',
      description: 'Autonomous Driving and Navigation System',
    },
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Tesla_Autopilot_Drive.jpg/640px-Tesla_Autopilot_Drive.jpg',
    created_by: {
      id: '2',
      name: 'John Doe',
      image_file: 'https://i.pravatar.cc/300',
    },
    createdAt: '2022-05-10T00:00:00.000Z',
    updatedAt: '2022-06-15T00:00:00.000Z',
  },
  {
    name: 'Vehicle Connectivity',
    visibility: 'public',
    type: {
      createdAt: '2021-09-01T00:00:00.000Z',
      updatedAt: '2021-09-01T00:00:00.000Z',
      id: '3abcu4',
      name: 'System Activity',
      description: 'System Interface',
      schema: {},
    },
    details: {
      name: 'Vehicle.Connectivity',
      description: 'Connected Vehicle and IoT System',
    },
    image:
      'https://www.volkswagen-newsroom.com/en/media-resize/06ddfd69-e847-4c62-82f9-363f50e85829.jpg',
    created_by: {
      id: '3',
      name: 'Alice Nguyen',
      image_file: 'https://i.pravatar.cc/301',
    },
    createdAt: '2023-01-20T00:00:00.000Z',
    updatedAt: '2023-02-01T00:00:00.000Z',
  },
  {
    name: 'Electric Powertrain',
    visibility: 'public',
    type: {
      createdAt: '2021-09-01T00:00:00.000Z',
      updatedAt: '2021-09-01T00:00:00.000Z',
      id: '4defv6',
      name: 'System Interface',
      description: 'System Interface',
      schema: {},
    },
    details: {
      name: 'Vehicle.ElectricPowertrain',
      description: 'Battery and Electric Drive System',
    },
    image:
      'https://media.autoexpress.co.uk/image/private/s--5Gn2mjgH--/v1698854376/autoexpress/2023/10/BMW%20Vision%20Neue%20Klasse%20concept%20%2807%29.jpg',
    created_by: {
      id: '4',
      name: 'Michael Smith',
      image_file: 'https://i.pravatar.cc/302',
    },
    createdAt: '2024-02-10T00:00:00.000Z',
    updatedAt: '2024-02-12T00:00:00.000Z',
  },
  {
    name: 'Infotainment System',
    visibility: 'public',
    type: {
      createdAt: '2021-09-01T00:00:00.000Z',
      updatedAt: '2021-09-01T00:00:00.000Z',
      id: '5ghij7',
      name: 'Flow Headers',
      description: 'System Interface',
      schema: {},
    },
    details: {
      name: 'Vehicle.Infotainment',
      description: 'Multimedia and In-Car Entertainment System',
    },
    image:
      'https://cdn.motor1.com/images/mgl/q0zpqX/s3/2023-mercedes-eqs-450-4matic-infotainment-system.jpg',
    created_by: {
      id: '5',
      name: 'Sophie Tran',
      image_file: 'https://i.pravatar.cc/303',
    },
    createdAt: '2023-08-14T00:00:00.000Z',
    updatedAt: '2023-09-01T00:00:00.000Z',
  },
]

const InventoryItemList = () => {
  return (
    <div className="container flex gap-14">
      <Filter />
      <div className="flex-1 min-w-0">
        <DaText variant="title" className="text-da-primary-500">
          Inventory
        </DaText>
        <p className="text-xs text-da-gray-dark mt-4 mb-1">
          1-10 of 100 results
        </p>
        {MOCK_DATA.map((item, index) => (
          <>
            <InventoryItem key={index} data={item} />
            {index < MOCK_DATA.length - 1 && (
              <div className="border-b border-da-gray-light/30" />
            )}
          </>
        ))}
      </div>
    </div>
  )
}

type InventoryItemProps = {
  data: InventorItemType
}

const InventoryItem = ({ data }: InventoryItemProps) => {
  return (
    <div className="p-4 -mx-4 rounded-lg h-[144px] flex gap-8 hover:bg-da-gray-light/20">
      <div className="h-full aspect-square">
        <object
          data={data.image}
          type="image/png"
          className="h-full w-full rounded select-none"
        >
          <img
            src="/imgs/default_photo.jpg"
            alt={data.name}
            className="h-full rounded text-sm w-full object-cover"
          />
        </object>
      </div>
      <div className="flex-1 flex flex-col min-w-0 truncate">
        <DaText
          variant="regular-bold"
          className="!cursor-pointer hover:underline text-da-gray-darkest !block"
        >
          {data.name}
        </DaText>

        <div className="flex mt-1 flex-wrap gap-2">
          <button className="rounded-full bg-da-gray-darkest text-white text-xs px-2 py-1">
            {data.type?.name}
          </button>
          <button className="rounded-full text-da-gray-darkest text-xs px-2 py-1 border">
            {data.visibility.at(0)?.toUpperCase() + data.visibility.slice(1)}
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex justify-between items-center gap-8">
          <button className="flex cursor-pointer items-center gap-2">
            <DaAvatar className="h-6 w-6" src={data.created_by?.image_file} />
            <p className="text-xs text-da-gray-dark">{data.created_by?.name}</p>
          </button>
          <DaTooltip content="Last Updated">
            <p className="cursor-pointer hover:underline text-xs">
              31 Dec 2024 - 16:04:39
            </p>
          </DaTooltip>
        </div>
      </div>
    </div>
  )
}

const Filter = () => {
  return (
    <div className="h-fit self-start sticky top-6 rounded-lg text-sm text-da-gray-dark shadow-sm border p-5 w-[320px]">
      <div className="flex justify-between items-baseline">
        <DaText variant="regular-bold" className="text-da-gray-darkest">
          Filters
        </DaText>
        <DaButton size="sm" variant="text" className="-mx-2 !text-xs">
          Clear all
        </DaButton>
      </div>
      <div className="border-b -mx-5 mt-4"></div>
      <DaInput
        className="mt-4"
        iconBefore
        inputClassName="text-sm !rounded-lg"
        wrapperClassName="!rounded-lg"
        Icon={TbSearch}
        placeholder="Search Inventory Item"
      />

      <div className="border-t border-da-gray-light/50 mt-4" />

      <DaText variant="small-bold" className="!block mt-4 text-da-gray-darkest">
        Latest Search
      </DaText>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex -m-2 p-2 cursor-default hover:bg-da-gray-light/50 rounded-lg items-center gap-2">
          <TbClock />
          <DaText variant="small" className="text-da-gray-dark">
            ADAS System
          </DaText>
          <TbX className="w-4 h-4 ml-auto text-da-gray-dark cursor-pointer" />
        </div>
        <div className="flex -m-2 p-2 cursor-default hover:bg-da-gray-light/50 rounded-lg items-center gap-2">
          <TbClock />
          <DaText variant="small" className="text-da-gray-dark">
            Passenger Welcome
          </DaText>
          <TbX className="w-4 h-4 ml-auto text-da-gray-dark cursor-pointer" />
        </div>
      </div>

      <div className="border-t border-da-gray-light/50 mt-4" />

      <DaText variant="small-bold" className="!block mt-4 text-da-gray-darkest">
        Inventory Type
      </DaText>
      <div className="flex flex-wrap text-xs text-da-gray-darkest gap-2 mt-3">
        <button className="rounded-full px-2 py-1 border">
          System Interface
        </button>
        <button className="rounded-full px-2 py-1 border">
          System Activity
        </button>
        <button className="rounded-full px-2 py-1 border">Flow Headers</button>
      </div>

      <DaButton
        size="sm"
        variant="text"
        className="-mx-2 -mb-2 mt-1 !p-2 !text-xs"
      >
        <TbPlus className="mr-1" /> View all inventory types
      </DaButton>

      <div className="border-t border-da-gray-light/50 mt-4" />

      <DaText variant="small-bold" className="!block mt-4 text-da-gray-darkest">
        Visibility
      </DaText>
      <div className="flex flex-wrap text-xs text-da-gray-darkest gap-2 mt-3">
        <button className="rounded-full px-2 py-1 border">Public</button>
        <button className="rounded-full px-2 py-1 border">Private</button>
      </div>

      <div className="border-t border-da-gray-light/50 mt-4" />

      <DaText variant="small-bold" className="!block mt-4 text-da-gray-darkest">
        Sort By
      </DaText>
      <div className="flex flex-wrap text-xs text-da-gray-darkest gap-2 mt-3">
        <button className="rounded-full px-2 py-1 border">Created Time</button>
        <button className="rounded-full px-2 py-1 border">Updated Time</button>
      </div>
    </div>
  )
}

export default InventoryItemList
