// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useMemo, useState } from 'react'
import PrototypeLibraryList from '@/components/organisms/PrototypeLibraryList'
import PrototypeLibraryPortfolio from '@/components/organisms/PrototypeLibraryPortfolio'
import { useParams } from 'react-router-dom'
import {
  TbChartScatter,
  TbListDetails,
  TbPlus,
  TbSearch,
} from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useAuthStore from '@/stores/authStore'
import DaDialog from '@/components/molecules/DaDialog'
import { useNavigate } from 'react-router-dom'
import DaFilter from '@/components/atoms/DaFilter'
import { Input } from '@/components/atoms/input'
import { Skeleton } from '@/components/atoms/skeleton'
import { cn } from '@/lib/utils'
import FormCreatePrototype from '@/components/molecules/forms/FormCreatePrototype'
import FormImportPrototype from '@/components/molecules/forms/FormImportPrototype'
import { useSiteConfig } from '@/utils/siteConfig'
import useCurrentModel from '@/hooks/useCurrentModel'
import { canCreatePrototypeOnModel } from '@/utils/modelVisibility'

const PagePrototypeLibrary = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'portfolio'>('list')
  const { model_id, tab } = useParams<{ model_id: string; tab?: string }>()
  const { data: user, isLoading, isFetching } = useSelfProfileQuery()
  const authBootstrapped = useAuthStore((state) => state.authBootstrapped)
  const isResolvingAuth =
    !authBootstrapped || (!user && (isLoading || isFetching))
  const { data: model } = useCurrentModel()
  const [hasWritePermission] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model_id])
  const canCreatePrototype = useMemo(
    () => canCreatePrototypeOnModel(model, user?.id, hasWritePermission),
    [model, user?.id, hasWritePermission],
  )
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const enableNewPrototypePage = useSiteConfig('ENABLE_NEW_PROTOTYPE_PAGE', false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>(() =>
    JSON.parse(
      localStorage.getItem('prototypeLibrary-selectedFilter') || '["Newest"]',
    ),
  )
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    if (tab) {
      setActiveTab(tab as 'list' | 'portfolio')
    }
  }, [tab])

  const handleTabChange = () => {
    const newTab = activeTab === 'list' ? 'portfolio' : 'list'
    setActiveTab(newTab)
    navigate(`/model/${model_id}/library/${newTab}`)
  }

  const handleFilterChange = (option: string[]) => {
    if (option.length === 0) {
      option = ['Newest']
    }
    setSelectedFilters(option)
    localStorage.setItem(
      'prototypeLibrary-selectedFilter',
      JSON.stringify(option),
    )
  }

  return (
    <div className="flex flex-col w-full h-full rounded-md overflow-y-auto bg-background da-page-prototype-library">
      <div className="flex flex-col w-full h-full px-6 lg:container">
        <div className="flex w-full items-center">
          {isResolvingAuth ? (
            <div className="flex w-full py-6 items-center">
              <Skeleton className="w-[210px] h-[32px]" />
              <div className="flex-grow" />
              <Skeleton className="w-[125px] h-[32px] mr-2" />
              <Skeleton className="w-[157px] h-[32px]" />
            </div>
          ) : (
            <div className="flex py-6 h-full w-full items-center">
              {activeTab === 'list' && (
                <p className="text-sm font-medium text-primary flex-shrink-0 hidden xl:flex">
                  Select a prototype to start
                </p>
              )}
              <div className="xl:grow"></div>
              <div className="flex w-full items-center justify-end space-x-2">
                <div className="relative w-full xl:max-w-[200px]">
                  <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search prototypes"
                    className="w-full h-8 pl-10 text-sm shadow bg-white"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="!hidden lg:!flex items-center"
                  onClick={handleTabChange}
                >
                  {activeTab === 'list' ? (
                    <>
                      <TbChartScatter className="w-5 h-5" />
                      Portfolio View
                    </>
                  ) : (
                    <>
                      <TbListDetails className="w-5 h-5" />
                      List View
                    </>
                  )}
                </Button>
                <DaFilter
                  categories={{
                    'Sort By': [
                      'Last view',
                      'First view',
                      'Newest',
                      'Oldest',
                      'Name A-Z',
                      'Name Z-A',
                      'Rating',
                    ],
                  }}
                  onChange={handleFilterChange}
                  className="w-fit mr-0 h-8 shadow px-2 text-sm"
                  singleSelect={true}
                  defaultValue={selectedFilters}
                  label={selectedFilters.length > 0 ? selectedFilters[0] : 'Newest'}
                />
                <div
                  className={cn(
                    'flex h-fit opacity-50 pointer-events-none',
                    canCreatePrototype && 'opacity-100 pointer-events-auto',
                  )}
                >
                  <FormImportPrototype />
                  {enableNewPrototypePage ? (
                    <Button
                      data-id="btn-create-new-prototype"
                      variant="default"
                      size="sm"
                      className="flex ml-2"
                      onClick={() =>
                        navigate(`/new-prototype?model_id=${model_id}`)
                      }
                    >
                      <TbPlus className="w-5 h-5" />
                      Create New Prototype
                    </Button>
                  ) : (
                    <DaDialog
                      open={open}
                      onOpenChange={setOpen}
                      dialogTitle="New Prototype"
                      trigger={
                        <Button
                          data-id="btn-create-new-prototype"
                          variant="default"
                          size="sm"
                          className="flex ml-2"
                        >
                          <TbPlus className="w-5 h-5" />
                          Create New Prototype
                        </Button>
                      }
                    >
                      <FormCreatePrototype onClose={() => setOpen(false)} />
                    </DaDialog>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex h-full w-full">
          {activeTab === 'list' && (
            <PrototypeLibraryList
              selectedFilters={selectedFilters}
              searchInput={searchInput}
            />
          )}
          {activeTab === 'portfolio' && <PrototypeLibraryPortfolio />}
        </div>
      </div>
    </div>
  )
}

export default PagePrototypeLibrary
