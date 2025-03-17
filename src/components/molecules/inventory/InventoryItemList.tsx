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
  instanceRelations,
  instances,
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

const SYSTEM_ARTEFACTS = [
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
]

const ENGINEERING_ARTEFACTS = [
  'stage',
  'hara',
  'test_plan',
  'test_case',
  'test_run',
  'country',
  'regulation',
  'requirements_group',
  'requirement',
]

const MOCK_TREE_COMPOSITION_DATA: Node[] = (() => {
  joinTypeData(instances)

  const traveled = new Set<string>()

  const buildNode: (id: string) => Node | null = (id: string) => {
    if (traveled.has(id)) return null
    const inst = instances.find((i) => i.id === id)
    if (!inst) return null

    traveled.add(id)

    const children = instanceRelations
      .filter((ir) => ir.source === id && ir.type === 'composition')
      .map((ir) => buildNode(ir.target))
      .filter((child): child is Node => child != null)

    return {
      id,
      name: inst.data?.name,
      tooltip: inst.typeData?.title,
      children,
    }
  }

  const root = buildNode('inst_vehicle_model')
  const result = root ? [root] : []

  const engineeringArtefact: Node = {
    id: 'sdv_engineering_artefact',
    name: 'SDV Engineering Artefact',
    children: [],
  }

  ENGINEERING_ARTEFACTS.forEach((ar) => {
    const instIds = instances.filter((i) => i.type === ar).map((i) => i.id)
    instIds.forEach((id) => {
      const node = buildNode(id)
      if (node) engineeringArtefact.children?.push(node)
    })
  })

  result.push(engineeringArtefact)
  return result
})()

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
      SYSTEM_ARTEFACTS.includes(itemType)
    )
      return true

    if (
      queryType === 'sdv_engineering_artefact' &&
      ENGINEERING_ARTEFACTS.includes(itemType)
    )
      return true

    if (queryType === 'artefact') return true

    return queryType == itemType
  }

  const checkComposition = (queryId: string | null, itemId: string) => {
    if (!queryId) return true
    const isChild = instanceRelations.find(
      (ir) =>
        ir.source === queryId &&
        ir.target === itemId &&
        ir.type === 'composition',
    )
    return isChild || queryId === itemId
  }

  const checkSearch = (querySearch: string, itemName: string) => {
    if (!querySearch) return true
    const lcQuerySearch = querySearch.toLowerCase()
    return itemName.toLowerCase().includes(lcQuerySearch)
  }

  const filteredData = useMemo(() => {
    const browserMode = searchParams.get('mode') || 'inheritance'

    return refinedMockData.filter((item) => {
      return (
        (browserMode === 'inheritance'
          ? checkType(searchParams.get('type') || '', item.type)
          : checkComposition(searchParams.get('id'), item.id)) &&
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

  const browserMode = searchParams.get('mode') || 'inheritance'
  const setBrowserMode = (mode: 'inheritance' | 'composition') => {
    searchParams.set('mode', mode)
    setSearchParams(searchParams)
  }

  const modeConfig = useMemo(() => {
    return {
      inheritance: {
        selected: searchParams.get('type'),
        setSelected: (node: Node) => {
          searchParams.set('type', node.id)
          setSearchParams(searchParams)
        },
        treeData: MOCK_TREE_DATA,
      },
      composition: {
        selected: searchParams.get('id'),
        setSelected: (node: Node) => {
          searchParams.set('id', node.id)
          setSearchParams(searchParams)
        },
        treeData: MOCK_TREE_COMPOSITION_DATA,
      },
    }[browserMode]
  }, [browserMode, searchParams])

  const roleData = roles.find((r) => r.name === inventory_role)

  useEffect(() => {
    modeConfig?.selected &&
      nodeElementsRef.current[modeConfig.selected].scrollIntoView({
        behavior: 'smooth',
      })
  }, [modeConfig?.selected])

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
          selected={modeConfig?.selected || ''}
          onSelected={modeConfig?.setSelected}
          data={modeConfig?.treeData || []}
          nodeElementsRef={nodeElementsRef}
        />
      </div>
    </div>
  )
}

export default InventoryItemList
