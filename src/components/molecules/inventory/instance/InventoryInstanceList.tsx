// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// InventoryInstanceList.tsx
import { DaAvatar } from '@/components/atoms/DaAvatar'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import DaText from '@/components/atoms/DaText'
import DaTooltip from '@/components/atoms/DaTooltip'
import { InventoryInstance } from '@/types/inventory.type'
import clsx from 'clsx'
import { TbPlus, TbSearch, TbX } from 'react-icons/tb'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import DaLoading from '@/components/atoms/DaLoading'
import { debounce } from 'lodash'
import DaTreeBrowser, { Node } from '../../DaTreeBrowser'
import useListInventoryInstances from '@/hooks/useListInventoryInstances'
import dayjs from 'dayjs'
import useListInventorySchemas from '@/hooks/useListInventorySchemas'

import {
  DaPaging,
  DaPaginationContent,
  DaPaginationItem,
  DaPaginationLink,
  DaPaginationNext,
  DaPaginationPrevious,
} from '@/components/atoms/DaPaging'

type InventoryInstanceListProps = {}

const ITEMS_PER_PAGE = 10 // Define how many items per page

const InventoryInstanceList = ({}: InventoryInstanceListProps) => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Get filters and page from search params
  const querySearch = searchParams.get('search') || ''
  const querySchema = searchParams.get('schema') || ''
  const currentPage = parseInt(searchParams.get('page') || '1', 10) || 1 // Ensure it's a valid number >= 1

  const {
    data: instanceListData,
    isLoading,
    error: fetchingInstanceListError,
    isPlaceholderData,
  } = useListInventoryInstances({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: querySearch,
    schema: querySchema,
  })

  // Helper function to update search params for page changes
  const handlePageChange = useCallback(
    (newPage: number) => {
      // Ensure newPage is valid
      if (newPage < 1) newPage = 1

      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.set('page', newPage.toString())
      setSearchParams(newSearchParams)
    },
    [searchParams, setSearchParams],
  )

  if (isLoading && !isPlaceholderData) {
    // Show loading only on initial load, not page changes with placeholder data
    return (
      <div className="w-full h-[calc(100vh-200px)]">
        <DaLoading />
      </div>
    )
  }

  if (fetchingInstanceListError || !instanceListData) {
    // Check instanceListData here
    return (
      <div className="text-center p-4 text-red-600">
        Error:{' '}
        {fetchingInstanceListError?.message ||
          'Failed to fetch inventory instance list'}
      </div>
    )
  }

  // Extract pagination info (provide defaults)
  const results = instanceListData?.results || []
  const totalPages = instanceListData?.totalPages ?? 1
  const totalResults = instanceListData?.totalResults ?? 0

  return (
    <div className="flex">
      <div className="m-auto w-full p-6">
        <div className="flex gap-14">
          {/* Pass filters down to Filter component */}
          <Filter querySearch={querySearch} querySchema={querySchema} />

          <div className="flex-1 min-w-0">
            <DaText variant="title" className="text-da-primary-500">
              {querySearch ? `Results for '${querySearch}'` : 'Inventory'}
            </DaText>

            <div className="flex gap-2 mt-2">
              <Link to="/inventory/instance/new">
                <DaButton className="" size="sm">
                  <TbPlus className="h-4 w-4 mr-1" /> Add Inventory Instance
                </DaButton>
              </Link>
            </div>
            {/* Use totalResults from API */}
            <p className="text-xs text-da-gray-dark mt-4 mb-1">
              {totalResults} result{totalResults !== 1 ? 's' : ''}
              {totalPages > 1 ? ` (Page ${currentPage} of ${totalPages})` : ''}
            </p>

            {/* Render items for the current page */}
            {results.map((item, index) => (
              <Fragment key={item.id}>
                <InventoryInstanceItem data={item} />
                {index < results.length - 1 && (
                  <div className="border-b border-da-gray-light" />
                )}
              </Fragment>
            ))}

            {/* Display message if no results found */}
            {results.length === 0 && !isLoading && (
              <div className="text-center p-6 text-da-gray-dark">
                No inventory items found matching your criteria.
              </div>
            )}

            {/* === Pagination Component  === */}
            {totalPages > 1 && (
              <DaPaging className="pt-3 pb-6 flex justify-center">
                <DaPaginationContent>
                  <DaPaginationItem>
                    <DaPaginationPrevious
                      className="cursor-pointer h-8"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    />
                  </DaPaginationItem>
                  {/* Generate page number links */}
                  {[...Array(totalPages)].map((_, index) => (
                    <DaPaginationItem key={index}>
                      <DaPaginationLink
                        className="cursor-pointer h-8 w-8 flex items-center justify-center"
                        isActive={currentPage === index + 1}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </DaPaginationLink>
                    </DaPaginationItem>
                  ))}
                  <DaPaginationItem>
                    <DaPaginationNext
                      className="cursor-pointer h-8"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    />
                  </DaPaginationItem>
                </DaPaginationContent>
              </DaPaging>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

type InventoryInstanceProps = {
  data: InventoryInstance
}

const InventoryInstanceItem = ({ data: item }: InventoryInstanceProps) => {
  return (
    <div className="p-4 -mx-4 rounded-lg h-[144px] flex gap-8 hover:bg-da-gray-light focus-within:outline focus-within:outline-2 focus-within:outline-da-primary-500 focus-within:outline-offset-2">
      <div className="h-full aspect-square">
        <object
          data={item.data?.image_url || '/imgs/default_photo.jpg'} // Use actual image URL if available
          type="image/png"
          className="h-full w-full object-cover border rounded select-none"
        >
          {/* Fallback Image */}
          <img
            src="/imgs/default_photo.jpg"
            alt={item.name || 'Inventory Instance'}
            className="h-full rounded text-sm w-full object-cover"
          />
        </object>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Link to={`/inventory/instance/${item.id}`}>
          <DaText
            variant="regular-bold"
            className="hover:underline truncate text-da-gray-darkest !block focus:outline-none"
          >
            {item.name}
          </DaText>
        </Link>
        <div className="flex mt-1 flex-wrap gap-2">
          <div className="rounded-full bg-da-gray-darkest text-white text-xs px-2 py-1">
            {item.schema.name || '-'}
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            {/* Provide default name if created_by or name is missing */}
            {item.created_by && (
              <>
                <DaAvatar
                  className="h-6 w-6"
                  src={item.created_by?.image_file}
                />
                <p className="text-xs text-da-gray-dark">
                  {item.created_by?.name || 'Unknown User'}
                </p>
              </>
            )}
          </div>
          {/* Render date only if valid */}
          {item.created_at && dayjs(item.created_at).isValid() && (
            <DaTooltip content={`Created At`}>
              <p className="cursor-pointer hover:underline text-xs">
                {dayjs(item.created_at).format('DD MMM YYYY - HH:mm')}{' '}
              </p>
            </DaTooltip>
          )}
        </div>
      </div>
    </div>
  )
}

type FilterProps = {
  querySearch: string // Receive current filters
  querySchema: string
}

const Filter = ({ querySearch, querySchema }: FilterProps) => {
  const [searchString, setSearchString] = useState(querySearch)
  const [searchParams, setSearchParams] = useSearchParams()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const nodeElementsRef = useRef<{ [key: string]: HTMLDivElement }>({})
  const { data: inventorySchemaList } = useListInventorySchemas()

  // Update local state if search param changes externally
  useEffect(() => {
    setSearchString(querySearch)
  }, [querySearch])

  const modeConfig = useMemo(() => {
    const treeData =
      inventorySchemaList?.results.map((schema) => {
        return {
          id: schema?.id,
          name: schema?.name,
        }
      }) || []

    return {
      selected: querySchema, // Use querySchema from props/searchParams
      setSelected: (node: Node) => {
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.set('schema', node.id)
        newSearchParams.set('page', '1') // Reset page on filter change
        setSearchParams(newSearchParams)
      },
      clear: () => {
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.delete('schema')
        newSearchParams.set('page', '1') // Reset page on filter change
        setSearchParams(newSearchParams)
      },
      treeData,
    }
  }, [querySchema, searchParams, setSearchParams, inventorySchemaList])

  useEffect(() => {
    modeConfig?.selected &&
      nodeElementsRef.current[modeConfig.selected]?.scrollIntoView({})
  }, [modeConfig?.selected])

  const debounceUpdateSearchQuery = useMemo(() => {
    return debounce((keyword: string) => {
      const newSearchParams = new URLSearchParams(searchParams) // Use current searchParams

      if (keyword) newSearchParams.set('search', keyword)
      else newSearchParams.delete('search')

      newSearchParams.set('page', '1') // Reset page on search change
      setSearchParams(newSearchParams)
    }, 300)
  }, [searchParams, setSearchParams]) // Updated dependencies

  const handleSearchChange = (value: string) => {
    setSearchString(value) // Update local input state immediately
    debounceUpdateSearchQuery(value) // Debounce the update to searchParams
  }

  const handleClearSearch = () => {
    setSearchString('') // Clear local input
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.delete('search')
    newSearchParams.set('page', '1') // Reset page
    setSearchParams(newSearchParams)
  }

  return (
    <div className="sticky top-4 self-start h-fit w-[400px] max-w-[30vw]">
      <div className="relative">
        <DaInput
          value={searchString}
          iconBefore
          inputClassName="text-sm !rounded-lg"
          wrapperClassName="!rounded-lg"
          Icon={TbSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search Inventory Item"
        />
        {/* Show clear button only if there is text in the input */}
        {searchString && (
          <button
            onClick={handleClearSearch}
            className="hover:bg-da-gray-light rounded-full absolute right-2 top-1/2 -translate-y-1/2 p-1 text-da-gray-dark focus:outline-none focus:ring-2 focus:ring-da-primary-300"
            aria-label="Clear search"
          >
            <TbX className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className={clsx(
          'rounded-lg mt-4 mb-6 overflow-y-auto max-h-[calc(100vh-200px)] text-sm text-da-gray-dark shadow-sm border p-5',
        )}
      >
        <div className="flex items-center justify-between gap-3 -mt-1">
          <DaText variant="small-bold" className="!block text-da-gray-darkest">
            Tree Browser
          </DaText>
          {/* Show clear button only if a schema filter is active */}
          {modeConfig.selected && (
            <DaButton
              onClick={() => modeConfig.clear()}
              variant="plain"
              size="sm"
            >
              Clear filter
            </DaButton>
          )}
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

export default InventoryInstanceList
