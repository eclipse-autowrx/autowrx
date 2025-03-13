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
  TbHierarchy,
  TbPlus,
  TbSearch,
  TbSitemap,
} from 'react-icons/tb'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Fragment } from 'react/jsx-runtime'
import DaTreeBrowser, { Node } from '../DaTreeBrowser'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  joinCreatedByData,
  joinTypeData as joinTypeData,
  roles,
  rolesTypeMap,
  typeToImage,
} from './data'
import useInventoryItems from '@/hooks/useInventoryItems'
import DaLoading from '@/components/atoms/DaLoading'
import useCurrentInventoryData from '@/hooks/useCurrentInventoryData'
import { useListUsers } from '@/hooks/useListUsers'
import { debounce } from 'lodash'

const MOCK_TREE_DATA: Node[] = [
  {
    id: 'artefact',
    name: 'Artefact',
    children: [
      {
        id: 'tool_artefact',
        name: 'Tool Artefact',
      },
      {
        id: 'sdv_system_artefact',
        name: 'SDV System Artefact',
        children: [
          {
            id: 'asw_domain',
            name: 'ASW Domain',
          },
          {
            id: 'asw_component',
            name: 'ASW Component',
          },
          {
            id: 'asw_service',
            name: 'ASW Service',
          },
          {
            id: 'asw_layer',
            name: 'ASW Layer',
          },
          {
            id: 'api_layer',
            name: 'API Layer',
          },
          {
            id: 'system',
            name: 'System',
          },
          {
            id: 'sub_system',
            name: 'Sub System',
          },
          {
            id: 'sw_stack_item',
            name: 'SW Stack Item',
          },
          {
            id: 'compute_node',
            name: 'Compute Node',
          },
          {
            id: 'network',
            name: 'Network',
          },
          {
            id: 'peripheral',
            name: 'Peripheral',
          },
        ],
      },
      {
        id: 'sdv_engineering_artefact',
        name: 'SDV Engineering Artefact',

        children: [
          {
            id: 'stage',
            name: 'Stage',
          },
          {
            id: 'hara',
            name: 'HARA',
          },
          {
            id: 'test_plan',
            name: 'Test Plan',
          },
          {
            id: 'test_case',
            name: 'Test Case',
          },
          {
            id: 'test_run',
            name: 'Test Run',
          },
          {
            id: 'country',
            name: 'Country',
          },
          {
            id: 'regulation',
            name: 'Regulation',
          },
          {
            id: 'requirements_group',
            name: 'Requirements Group',
          },
          {
            id: 'requirement',
            name: 'Requirement',
          },
        ],
      },
    ],
  },
]

const MOCK_TREE_COMPOSITION_DATA: Node[] = [
  {
    id: 'artefact',
    name: 'Artefact',
    children: [
      {
        id: 'tool_artefact',
        name: 'Tool Artefact',
      },
      {
        id: 'vehicle_model',
        name: 'Vehicle Model',

        children: [
          {
            id: 'asw_domain',
            name: 'ASW Domain',

            children: [
              {
                id: 'asw_component',
                name: 'ASW Component',

                children: [
                  {
                    id: 'asw_service',
                    name: 'ASW Service',
                  },
                ],
              },
            ],
          },
          {
            id: 'asw_layer',
            name: 'ASW Layer',
          },
          {
            id: 'api_layer',
            name: 'API Layer',
          },
          {
            id: 'stage',
            name: 'Stage',
          },
          {
            id: 'system',
            name: 'System',

            children: [
              {
                id: 'sub_system',
                name: 'Sub System',

                children: [
                  {
                    id: 'compute_node',
                    name: 'Compute Node',

                    children: [
                      {
                        id: 'sw_stack_item',
                        name: 'SW Stack Item',
                      },
                    ],
                  },
                  {
                    id: 'network',
                    name: 'Network',
                  },
                  {
                    id: 'peripheral',
                    name: 'Peripheral',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sdv_engineering_artefact',
        name: 'SDV Engineering Artefact',

        children: [
          {
            id: 'test_plan',
            name: 'Test Plan',

            children: [
              {
                id: 'test_case',
                name: 'Test Case',

                children: [
                  {
                    id: 'test_run',
                    name: 'Test Run',
                  },
                ],
              },
            ],
          },
          {
            id: 'requirements_group',
            name: 'Requirements Group',

            children: [
              {
                id: 'requirement',
                name: 'Requirement',
              },
            ],
          },
          {
            id: 'hara',
            name: 'HARA',
          },
          {
            id: 'country',
            name: 'Country',
          },
          {
            id: 'regulation',
            name: 'Regulation',
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
  const { data, isLoading } = useInventoryItems()
  const { inventory_role } = useParams()
  const { data: users } = useListUsers({
    id: '6724a8cb3e09ac00279ed6f5,6714fe1a9c8a740026eb7f97,6699fa83964f3f002f35ea03',
  })
  const querySearch = searchParams.get('search') || ''

  useEffect(() => {
    if (!inventory_role) return
    const type = rolesTypeMap[inventory_role]
    if (type && new URLSearchParams(searchParams).get('type') !== type) {
      searchParams.set('type', type)
      setSearchParams(searchParams)
    }
  }, [inventory_role])

  const refinedMockData = useMemo(() => {
    return data ? joinCreatedByData(joinTypeData(data as any[]), users) : []
  }, [data])

  const checkType = (queryType: string, itemType: string) => {
    if (
      queryType === 'sdv_system_artefact' &&
      [
        'asw_domain',
        'asw_component',
        'asw_service',
        'asw_layer',
        'api_layer',
        'system',
        'sub_system',
        'sw_stack_item',
        'compute_node',
        'network',
        'peripheral',
      ].includes(itemType)
    )
      return true

    if (
      queryType === 'sdv_engineering_artefact' &&
      [
        'stage',
        'hara',
        'test_plan',
        'test_case',
        'test_run',
        'country',
        'regulation',
        'requirements_group',
        'requirement',
      ].includes(itemType)
    )
      return true

    if (queryType === 'artefact') return true

    return queryType == itemType
  }

  const checkSearch = (querySearch: string, itemName: string) => {
    if (!querySearch) return true
    const lcQuerySearch = querySearch.toLowerCase()
    return itemName.toLowerCase().includes(lcQuerySearch)
  }

  const filteredData = useMemo(() => {
    return refinedMockData.filter((item) => {
      return (
        checkType(searchParams.get('type') || '', item.type) &&
        checkSearch(searchParams.get('search') || '', item.data?.name || '')
      )
    })
  }, [refinedMockData, searchParams])

  if (!data || isLoading)
    return (
      <div className="w-full h-[calc(100vh-200px)]">
        <DaLoading />
      </div>
    )

  return (
    <div className="flex gap-14">
      <Filter mode={mode} />

      <div className="flex-1 min-w-0">
        <DaText variant="title" className="text-da-primary-500">
          {querySearch ? `Results for '${querySearch}'` : 'Inventory'}
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
          <Fragment key={item.id}>
            <InventoryItem data={item} />
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

const InventoryItem = ({ data: item }: InventoryItemProps) => {
  const { data: inventoryData } = useCurrentInventoryData()

  return (
    <div className="p-4 -mx-4 rounded-lg h-[144px] flex gap-8 hover:bg-da-gray-light">
      <div className="h-full aspect-square">
        <object
          data={
            typeToImage[item.type as keyof typeof typeToImage] ??
            'https://example.com/not-found'
          }
          type="image/png"
          className="h-full w-full object-cover border rounded select-none"
        >
          <img
            src="/imgs/default_photo.jpg"
            alt={item.data?.name}
            className="h-full rounded text-sm w-full object-cover"
          />
        </object>
      </div>
      <div className="flex-1 flex flex-col min-w-0 truncate">
        <Link
          to={`/inventory/role/${inventoryData.roleData?.name}/item/${item.id}`}
          className="w-fit"
        >
          <DaText
            variant="regular-bold"
            className="hover:underline text-da-gray-darkest !block"
          >
            {item.data?.name}
          </DaText>
        </Link>

        <div className="flex mt-1 flex-wrap gap-2">
          <button className="rounded-full bg-da-gray-darkest text-white text-xs px-2 py-1">
            {item.typeData?.title}
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex justify-between items-center gap-8">
          <button className="hover:underline flex cursor-pointer items-center gap-2">
            <DaAvatar
              className="h-6 w-6"
              src={item.data?.createdBy?.image_file}
            />
            <p className="text-xs text-da-gray-dark">
              {item.data?.createdBy?.name}
            </p>
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
  const { inventory_role } = useParams()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const nodeElementsRef = useRef<{ [key: string]: HTMLDivElement }>({})

  const [browserMode, setBrowserMode] = useState<'inheritance' | 'composition'>(
    'inheritance',
  )

  const roleData = roles.find((r) => r.name === inventory_role)
  const selected = searchParams.get('type')
  const setSelected = (type: string) => {
    searchParams.set('type', type)
    setSearchParams(searchParams)
  }

  useEffect(() => {
    selected && nodeElementsRef.current[selected]?.scrollIntoView()
  }, [selected])

  const debounceUpdateSearchQuery = useMemo(() => {
    return debounce((keyword: string) => {
      const _searchParams = new URLSearchParams(window.location.search)

      if (keyword) _searchParams.set('search', keyword)
      else _searchParams.delete('search')

      setSearchParams(_searchParams)
    }, 300)
  }, [])

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
        onChange={(e) => debounceUpdateSearchQuery(e.target.value)}
        placeholder="Search Inventory Item"
      />

      {roleData && (
        <div className="flex mt-4 rounded-md h-[96px] border overflow-hidden items-center">
          <img src={roleData.image} className="h-full aspect-square" />
          <div className="h-full flex flex-1 flex-col justify-between pt-3 pb-4 px-5">
            <p className="text-da-gray-darkest font-bold">{roleData.name}</p>
            <Link to="/inventory" className="w-full">
              <DaButton variant="outline-nocolor" size="sm" className="w-full">
                <TbChevronLeft className="mr-2" size={16} /> Select Role
              </DaButton>
            </Link>
          </div>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className={clsx(
          'rounded-lg mt-4 mb-6 overflow-y-auto max-h-[calc(100vh-320px)] text-sm text-da-gray-dark shadow-sm border p-5',
        )}
      >
        <div className="flex items-center justify-between gap-3 -mt-1">
          <DaText variant="small-bold" className="!block text-da-gray-darkest">
            Tree Browser
          </DaText>
          <div className="rounded-full flex min-w-0 h-8 border text-xs">
            <DaTooltip content="Inheritance View">
              <button
                onClick={() => setBrowserMode('inheritance')}
                className={clsx(
                  browserMode === 'inheritance'
                    ? 'bg-da-primary-500 text-white'
                    : 'hover:bg-da-gray-light',
                  'h-full flex-1 rounded-full px-4 flex items-center gap-1',
                )}
              >
                <TbHierarchy size={14} />
              </button>
            </DaTooltip>
            <DaTooltip content="Composition View">
              <button
                onClick={() => setBrowserMode('composition')}
                className={clsx(
                  browserMode === 'composition'
                    ? 'bg-da-primary-500 text-white'
                    : 'hover:bg-da-gray-light',
                  'h-full flex-1 rounded-full px-4 flex items-center gap-1',
                )}
              >
                <TbSitemap size={14} />
              </button>
            </DaTooltip>
          </div>
        </div>
        <div className="mt-3" />
        <DaTreeBrowser
          selected={selected || ''}
          onSelected={(node) => {
            setSelected(node.id)
          }}
          data={
            browserMode === 'inheritance'
              ? MOCK_TREE_DATA
              : MOCK_TREE_COMPOSITION_DATA
          }
          nodeElementsRef={nodeElementsRef}
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
