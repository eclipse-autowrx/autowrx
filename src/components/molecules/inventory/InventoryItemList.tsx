import { DaAvatar } from '@/components/atoms/DaAvatar'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import DaText from '@/components/atoms/DaText'
import DaTooltip from '@/components/atoms/DaTooltip'
import { InventoryItem as InventorItemType } from '@/types/inventory.type'
import clsx from 'clsx'
import {
  TbChevronLeft,
  TbFileExport,
  TbFileImport,
  TbPlus,
  TbSearch,
} from 'react-icons/tb'
import { Link, useSearchParams } from 'react-router-dom'
import { Fragment } from 'react/jsx-runtime'
import DaTreeBrowser, { Node } from '../DaTreeBrowser'
import { useEffect, useMemo, useState } from 'react'
import { instances, joinData, roles, rolesTypeMap, types } from './data'

// const MOCK_ITEM_DATA: InventorItemType[] = [
//   {
//     id: 'asw_component_1',
//     name: 'ADAS Perception Module',
//     type: 'asw_component',
//     framework: 'ROS',
//     dependencies: ['grpc', 'protobuf', 'tensorflow-serving-api'],
//     image: 'https://example.com/images/asw_component_1.png',
//     createdAt: '2025-02-26T07:15:08.836260',
//     updatedAt: '2025-03-03T07:15:08.836260',
//     created_by: {
//       name: 'Slama Dirk (G7/PJ-DO-SPP)',
//       image_file:
//         'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
//       id: '6724a8cb3e09ac00279ed6f5',
//     },
//   },
//   {
//     id: 'asw_component_2',
//     name: 'Autonomous Driving Planner',
//     type: 'asw_component',
//     framework: 'ROS',
//     dependencies: ['boost', 'gtest', 'qt'],
//     image: 'https://example.com/images/asw_component_2.png',
//     createdAt: '2025-01-11T07:15:08.836303',
//     updatedAt: '2025-01-19T07:15:08.836303',
//     created_by: {
//       name: 'Slama Dirk (G7/PJ-DO-SPP)',
//       image_file:
//         'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
//       id: '6724a8cb3e09ac00279ed6f5',
//     },
//   },
//   {
//     id: 'asw_component_3',
//     name: 'Battery Management System',
//     type: 'asw_component',
//     framework: 'TensorFlow',
//     dependencies: ['grpc', 'protobuf', 'tensorflow-serving-api'],
//     image: 'https://example.com/images/asw_component_3.png',
//     createdAt: '2025-01-04T07:15:08.836317',
//     updatedAt: '2025-01-06T07:15:08.836317',
//     created_by: {
//       name: 'Slama Dirk (G7/PJ-DO-SPP)',
//       image_file:
//         'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
//       id: '6724a8cb3e09ac00279ed6f5',
//     },
//   },
//   {
//     id: 'asw_component_4',
//     name: 'Vehicle Dynamics Controller',
//     type: 'asw_component',
//     framework: 'TensorFlow',
//     dependencies: ['numpy', 'scipy', 'pandas'],
//     image: 'https://example.com/images/asw_component_4.png',
//     createdAt: '2024-12-01T07:15:08.836327',
//     updatedAt: '2024-12-02T07:15:08.836327',
//     created_by: {
//       name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
//       image_file:
//         'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
//       id: '6699fa83964f3f002f35ea03',
//     },
//   },
//   {
//     id: 'asw_component_5',
//     name: 'Infotainment Media Processor',
//     type: 'asw_component',
//     framework: 'TensorFlow',
//     dependencies: ['opencv-python', 'matplotlib', 'pillow'],
//     image: 'https://example.com/images/asw_component_5.png',
//     createdAt: '2025-02-27T07:15:08.836339',
//     updatedAt: '2025-03-03T07:15:08.836339',
//     created_by: {
//       name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
//       image_file:
//         'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
//       id: '6714fe1a9c8a740026eb7f97',
//     },
//   },
// ]

const MOCK_TREE_DATA: Node[] = [
  {
    id: 'artefact',
    name: 'Artefact',
    color: '#2C3E50',
    children: [
      {
        id: 'tool_artefact',
        name: 'Tool Artefact',
        color: '#0F766E',
      },
      {
        id: 'sdv_system_artefact',
        name: 'SDV System Artefact',
        color: '#2980B9',
        children: [
          {
            id: 'asw_component',
            name: 'ASW Component',
            color: '#3498DB',
          },
          {
            id: 'compute_note',
            name: 'Compute Node',
            color: '#8E44AD',
          },
          {
            id: 'network',
            name: 'Network',
            color: '#27AE60',
          },
          {
            id: 'system',
            name: 'System',
            color: '#16A085',
          },
          {
            id: 'sub_system',
            name: 'Sub System',
            color: '#F39C12',
          },
          {
            id: 'sw_stack_item',
            name: 'SW Stack Item',
            color: '#D35400',
          },
          {
            id: 'asw_service',
            name: 'ASW Service',
            color: '#C0392B',
          },
          {
            id: 'asw_domain',
            name: 'ASW Domain',
            color: '#7F8C8D',
          },
        ],
      },
      {
        id: 'sdv_engineering_artefact',
        name: 'SDV Engineering Artefact',
        color: '#E67E22',
        children: [
          {
            id: 'stage',
            name: 'Stage',
            color: '#745e07',
          },
          {
            id: 'hara',
            name: 'HARA',
            color: '#E74C3C',
          },
          {
            id: 'requirement',
            name: 'Requirement',
            color: '#9B59B6',
          },
          {
            id: 'test_plan',
            name: 'Test Plan',
            color: '#95A5A6',
          },
        ],
      },
    ],
  },
]

type InventoryItemListProps = {
  mode?: 'view' | 'select'
}

const InventoryItemList = ({ mode = 'view' }: InventoryItemListProps) => {
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const role = searchParams.get('role')
    if (role) {
      const type = rolesTypeMap[role]
      if (type && new URLSearchParams(searchParams).get('type') !== type) {
        searchParams.set('type', type)
        setSearchParams(searchParams)
      }
    }
  }, [])

  const refinedMockData = useMemo(() => {
    return joinData(instances)
  }, [])

  const filteredData = useMemo(() => {
    return refinedMockData.filter((item) => {
      if (
        searchParams.get('type') === 'sdv_system_artefact' &&
        [
          'asw_component',
          'compute_node',
          'network',
          'system',
          'sub_system',
          'sw_stack_item',
          'asw_service',
          'asw_domain',
        ].includes(item.type)
      )
        return true

      if (
        searchParams.get('type') === 'sdv_engineering_artefact' &&
        ['stage', 'hara', 'requirement', 'test_plan'].includes(item.type)
      )
        return true

      if (searchParams.get('type') === 'artefact') return true
      if (searchParams.has('type')) {
        return item.type === searchParams.get('type')
      }
      return true
    })
  }, [refinedMockData, searchParams])

  return (
    <div className="flex gap-14">
      <Filter mode={mode} />

      <div className="flex-1 min-w-0">
        <DaText variant="title" className="text-da-primary-500">
          Inventory
        </DaText>

        {mode === 'view' && (
          <div className="flex gap-2 mt-2">
            {/* <Link to="/inventory/new"> */}
            <DaButton className="" size="sm">
              <TbPlus className="h-4 w-4 mr-1" /> Add Inventory Item
            </DaButton>
            {/* </Link> */}

            <DaButton
              className=" !text-da-gray-dark"
              size="sm"
              variant="outline-nocolor"
            >
              <TbFileImport className="h-4 w-4 mr-1" /> Import
            </DaButton>
            <DaButton
              className=" !text-da-gray-dark"
              size="sm"
              variant="outline-nocolor"
            >
              <TbFileExport className="h-4 w-4 mr-1" /> Export
            </DaButton>
          </div>
        )}
        <p className="text-xs text-da-gray-dark mt-4 mb-1">
          {filteredData.length} results
        </p>
        {filteredData.map((item, index) => (
          <Fragment key={index}>
            <InventoryItem key={index} data={item} />
            {index < filteredData.length - 1 && (
              <div className="border-b border-da-gray-light" />
            )}
          </Fragment>
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
    <div className="p-4 -mx-4 rounded-lg h-[144px] flex gap-8 hover:bg-da-gray-light">
      <div className="h-full aspect-square">
        <object
          data="/imgs/default_photo.jpg"
          type="image/png"
          className="h-full w-full object-cover border rounded select-none"
        >
          <img
            src="/imgs/default_photo.jpg"
            alt={data.name}
            className="h-full rounded text-sm w-full object-cover"
          />
        </object>
      </div>
      <div className="flex-1 flex flex-col min-w-0 truncate">
        <Link to={`/inventory/${data.id}`} className="w-fit">
          <DaText
            variant="regular-bold"
            className="hover:underline text-da-gray-darkest !block"
          >
            {data.name}
          </DaText>
        </Link>

        <div className="flex mt-1 flex-wrap gap-2">
          <button className="rounded-full bg-da-gray-darkest text-white text-xs px-2 py-1">
            {data.typeData?.name}
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex justify-between items-center gap-8">
          <button className="hover:underline flex cursor-pointer items-center gap-2">
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

type FilterProps = {
  mode: 'view' | 'select'
}

const Filter = ({ mode }: FilterProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const role = searchParams.get('role')
  const roleData = roles.find((r) => r.name === role)
  const selected = searchParams.get('type')
  const setSelected = (type: string) => {
    searchParams.set('type', type)
    setSearchParams(searchParams)
  }

  return (
    <div
      className={clsx(
        'sticky self-start h-fit w-[400px] max-w-[30vw]',
        mode === 'view' ? 'top-6' : 'top-0',
      )}
    >
      <DaInput
        iconBefore
        inputClassName="text-sm !rounded-lg"
        wrapperClassName="!rounded-lg"
        Icon={TbSearch}
        placeholder="Search Inventory Item"
      />

      {roleData && (
        <div className="flex mt-4 rounded-md h-[96px] border overflow-hidden items-center">
          <img src={roleData.image} className="h-full aspect-square" />
          <div className="h-full flex flex-1 flex-col justify-between pt-3 pb-4 px-5">
            <p className="text-da-gray-darkest font-bold">{roleData.name}</p>
            <DaButton
              variant="outline-nocolor"
              onClick={() => setSearchParams({})}
              size="sm"
            >
              <TbChevronLeft className="mr-2" size={16} /> Select Role
            </DaButton>
          </div>
        </div>
      )}

      <div
        className={clsx(
          'rounded-lg mt-4 mb-6 text-sm text-da-gray-dark shadow-sm border p-5',
        )}
      >
        <DaText variant="small-bold" className="!block text-da-gray-darkest">
          Tree Browser
        </DaText>
        <div className="mt-3" />
        <DaTreeBrowser
          selected={selected || ''}
          onSelected={(node) => {
            console.log(node)
            setSelected(node.id)
          }}
          data={MOCK_TREE_DATA}
        />

        {/* <div className="border-t border-da-gray-light/50 mt-4" />

        <DaText
          variant="small-bold"
          className="!block mt-4 text-da-gray-darkest"
        >
          Visibility
        </DaText>
        <div className="flex flex-wrap text-xs text-da-gray-darkest gap-2 mt-3">
          <button className="rounded-full px-2 py-1 border">Public</button>
          <button className="rounded-full px-2 py-1 border">Private</button>
        </div>

        <div className="border-t border-da-gray-light/50 mt-4" />

        <DaText
          variant="small-bold"
          className="!block mt-4 text-da-gray-darkest"
        >
          Sort By
        </DaText>
        <div className="flex flex-wrap text-xs text-da-gray-darkest gap-2 mt-3">
          <button className="rounded-full px-2 py-1 border">
            Created Time
          </button>
          <button className="rounded-full px-2 py-1 border">
            Updated Time
          </button>
        </div> */}
      </div>
    </div>
  )
}

export default InventoryItemList
