// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModelLite } from '@/types/model.type'
import {
  listAllModels,
  listModelsLite,
  updateModelService,
  deleteModelService,
} from '@/services/model.service'
import { listModelPrototypes } from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useImportModel from '@/hooks/useImportModel'
import { useUrlQueryParam } from '@/hooks/useUrlQueryParam'
import { HiPlus } from 'react-icons/hi'
import {
  TbChevronDown,
  TbSortDescending,
  TbInfoCircle,
  TbLoader,
  TbUpload,
} from 'react-icons/tb'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../atoms/tooltip'
import { Button } from '../atoms/button'
import { Input } from '../atoms/input'
import { DaModelCard } from '../molecules/DaModelCard'
import DaSkeletonGrid from '../molecules/DaSkeletonGrid'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../atoms/dropdown-menu'
import DaImportFile from '../atoms/DaImportFile'
import DaDialog from '../molecules/DaDialog'
import DaConfirmPopup from '../molecules/DaConfirmPopup'
import FormCreateModel from '../molecules/forms/FormCreateModel'

import { getLastViewedMap } from '@/utils/modelLastViewed'
import { cn } from '@/lib/utils'

type SortOption =
  | 'last-viewed'
  | 'first-viewed'
  | 'newest'
  | 'oldest'
  | 'name-az'
  | 'name-za'
type ModelCategory = 'all' | 'myModel' | 'myContribution' | 'public'

const MODEL_CATEGORIES: readonly ModelCategory[] = [
  'all',
  'myModel',
  'myContribution',
  'public',
]
const MODEL_SORT_OPTIONS: readonly SortOption[] = [
  'last-viewed',
  'first-viewed',
  'newest',
  'oldest',
  'name-az',
  'name-za',
]

const SORT_LABELS: Record<SortOption, string> = {
  'last-viewed': 'Last viewed',
  'first-viewed': 'First viewed',
  newest: 'Newest',
  oldest: 'Oldest',
  'name-az': 'Name A-Z',
  'name-za': 'Name Z-A',
}

type HomeModelListProps = {
  title?: string
}

const BREAKPOINT_COLS: { query: string; cols: number }[] = [
  { query: '(min-width: 1280px)', cols: 5 },
  { query: '(min-width: 1024px)', cols: 3 },
  { query: '(min-width: 768px)', cols: 2 },
  { query: '(min-width: 640px)', cols: 2 },
]

function getColsPerRow(): number {
  if (typeof window === 'undefined' || !window.matchMedia) return 1
  for (const bp of BREAKPOINT_COLS) {
    if (window.matchMedia(bp.query).matches) return bp.cols
  }
  return 1
}

function useColsPerRow(): number {
  const [cols, setCols] = useState<number>(() => getColsPerRow())

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mqls = BREAKPOINT_COLS.map((bp) => window.matchMedia(bp.query))
    const handler = () => setCols(getColsPerRow())
    mqls.forEach((mql) => mql.addEventListener('change', handler))
    return () => {
      mqls.forEach((mql) => mql.removeEventListener('change', handler))
    }
  }, [])

  return cols
}

function sortModels(models: ModelLite[], sort: SortOption): ModelLite[] {
  const copy = [...models]
  if (sort === 'name-az') {
    copy.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sort === 'name-za') {
    copy.sort((a, b) => b.name.localeCompare(a.name))
  } else if (sort === 'newest') {
    copy.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      if (ta !== tb) return tb - ta
      return b.id.localeCompare(a.id)
    })
  } else if (sort === 'oldest') {
    copy.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      if (ta !== tb) return ta - tb
      return a.id.localeCompare(b.id)
    })
  } else if (sort === 'last-viewed') {
    const viewedMap = getLastViewedMap()
    copy.sort((a, b) => {
      const diff = (viewedMap[b.id] ?? 0) - (viewedMap[a.id] ?? 0)
      return diff !== 0 ? diff : b.id.localeCompare(a.id)
    })
  } else if (sort === 'first-viewed') {
    const viewedMap = getLastViewedMap()
    copy.sort((a, b) => {
      const diff = (viewedMap[a.id] ?? 0) - (viewedMap[b.id] ?? 0)
      return diff !== 0 ? diff : a.id.localeCompare(b.id)
    })
  }
  return copy
}

interface ModelGroups {
  owned: ModelLite[]
  contributed: ModelLite[]
  publicReleased: ModelLite[]
}

const HomeModelList = ({ title }: HomeModelListProps) => {
  const { data: user, isLoading: userLoading } = useSelfProfileQuery()
  const [groups, setGroups] = useState<ModelGroups | undefined>(undefined)
  const [rowsShown, setRowsShown] = useState<number>(1)
  const [sortBy, setSortBy] = useUrlQueryParam(
    'model-sort',
    MODEL_SORT_OPTIONS,
    'last-viewed',
  )
  const colsPerRow = useColsPerRow()
  const [activeCategory, setActiveCategory] = useUrlQueryParam(
    'model-category',
    MODEL_CATEGORIES,
    'all',
  )
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [renameModelId, setRenameModelId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [deleteModelId, setDeleteModelId] = useState<string | null>(null)
  const [isDeletingModel, setIsDeletingModel] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!userLoading && !user && activeCategory !== 'all') {
      setActiveCategory('all')
    }
  }, [userLoading, user, activeCategory, setActiveCategory])

  const refetchModels = useCallback(async () => {
    if (!user) return
    const res = await listAllModels()
    setGroups({
      owned: res.ownedModels.results,
      contributed: res.contributedModels.results,
      publicReleased: res.publicReleasedModels.results,
    })
  }, [user])

  const { isImporting, handleImportModelZip } = useImportModel({
    onSuccess: refetchModels,
  })

  const handleRenameModel = useCallback(async () => {
    if (!renameModelId || !renameValue.trim()) return
    setIsRenaming(true)
    try {
      await updateModelService(renameModelId, {
        name: renameValue.trim(),
      } as any)
      await refetchModels()
      setRenameModelId(null)
      setTimeout(() => {
        document.body.style.removeProperty('pointer-events')
      }, 100)
    } catch (error) {
      console.error('Failed to rename model:', error)
    } finally {
      setIsRenaming(false)
    }
  }, [renameModelId, renameValue, refetchModels])

  const handleDeleteModel = useCallback(async () => {
    if (!deleteModelId) return
    setIsDeletingModel(true)
    try {
      await deleteModelService(deleteModelId)
      await refetchModels()
      window.dispatchEvent(new CustomEvent('model:list-changed'))
    } catch (error) {
      console.error('Failed to delete model:', error)
    } finally {
      setIsDeletingModel(false)
      setDeleteModelId(null)
    }
  }, [deleteModelId, refetchModels])

  useEffect(() => {
    if (userLoading) return

    const fetchModels = async () => {
      if (user) {
        await refetchModels()
      } else {
        const res = await listModelsLite({
          visibility: 'public',
          state: 'released',
        })
        setGroups({
          owned: [],
          contributed: [],
          publicReleased: res.results.slice(0, 20),
        })
      }
    }

    fetchModels()
  }, [user, userLoading, refetchModels])

  const filteredModels = useMemo(() => {
    if (!groups) return undefined
    let models: ModelLite[]
    if (activeCategory === 'myModel') {
      models = groups.owned
    } else if (activeCategory === 'myContribution') {
      models = groups.contributed
    } else if (activeCategory === 'public') {
      models = groups.publicReleased
    } else {
      const seen = new Set<string>()
      models = []
      for (const m of [
        ...groups.owned,
        ...groups.contributed,
        ...groups.publicReleased,
      ]) {
        if (!seen.has(m.id)) {
          seen.add(m.id)
          models.push(m)
        }
      }
    }
    return sortModels(models, sortBy)
  }, [groups, activeCategory, sortBy])

  const allEmpty =
    groups &&
    groups.owned.length === 0 &&
    groups.contributed.length === 0 &&
    groups.publicReleased.length === 0

  const visibleCount = colsPerRow * rowsShown
  const visible = filteredModels
    ? filteredModels.slice(0, visibleCount)
    : undefined

  const categoryButtons: { label: string; value: ModelCategory }[] = user
    ? [
        { label: 'All', value: 'all' },
        { label: 'My Models', value: 'myModel' },
        { label: 'My Contributions', value: 'myContribution' },
        { label: 'Public', value: 'public' },
      ]
    : []

  return (
    <div className="flex flex-col w-full container">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-primary">
            {title || 'Vehicle Models'}
            <TooltipProvider>
              <Tooltip open={infoOpen} onOpenChange={setInfoOpen}>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex"
                    onPointerDown={(e) => {
                      e.preventDefault()
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setInfoOpen(!infoOpen)
                    }}
                  >
                    <TbInfoCircle className="size-5 shrink-0 cursor-pointer text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm text-xs">
                  Based on COVESA's Vehicle Signal Specification (VSS) syntax
                  the vehicle interface can be quickly defined via the available
                  VSS catalogue or by extending specific signals. This
                  abstraction conveniently allows the reuse of vehicle
                  applications on different vehicle models and types.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h2>
          {categoryButtons.length > 0 && (
            <>
              <div className="min-[1080px]:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={allEmpty}
                      className="border text-base"
                    >
                      {categoryButtons.find((c) => c.value === activeCategory)
                        ?.label ?? 'All'}
                      <TbChevronDown className="ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {categoryButtons.map((cat) => (
                      <DropdownMenuItem
                        key={cat.value}
                        onClick={() => {
                          setActiveCategory(cat.value)
                          setRowsShown(1)
                        }}
                        className={
                          activeCategory === cat.value
                            ? 'font-semibold bg-accent'
                            : ''
                        }
                      >
                        {cat.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex max-[1080px]:hidden flex-wrap items-center gap-2">
                {categoryButtons.map((cat) => (
                  <Button
                    key={cat.value}
                    variant="ghost"
                    disabled={allEmpty}
                    className={cn(
                      activeCategory === cat.value
                        ? 'border-[#7B838B]'
                        : 'border-transparent hover:border-[#7B838B]',
                      'border hover:border text-base bg-transparent!',
                    )}
                    size="sm"
                    onClick={() => {
                      setActiveCategory(cat.value)
                      setRowsShown(1)
                    }}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={allEmpty}>
                <TbSortDescending className="min-[1080px]:mr-1 text-base" />
                <span className="inline max-[1080px]:hidden text-base">
                  {SORT_LABELS[sortBy]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setSortBy('last-viewed')}
                className={
                  sortBy === 'last-viewed' ? 'font-semibold bg-accent' : ''
                }
              >
                Last viewed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('first-viewed')}
                className={
                  sortBy === 'first-viewed' ? 'font-semibold bg-accent' : ''
                }
              >
                First viewed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('newest')}
                className={sortBy === 'newest' ? 'font-semibold bg-accent' : ''}
              >
                Newest
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('oldest')}
                className={sortBy === 'oldest' ? 'font-semibold bg-accent' : ''}
              >
                Oldest
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('name-az')}
                className={
                  sortBy === 'name-az' ? 'font-semibold bg-accent' : ''
                }
              >
                Name A-Z
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('name-za')}
                className={
                  sortBy === 'name-za' ? 'font-semibold bg-accent' : ''
                }
              >
                Name Z-A
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {user && (
            <>
              {!isImporting ? (
                <DaImportFile accept=".zip" onFileChange={handleImportModelZip}>
                  <Button variant="ghost" size="sm">
                    <TbUpload className="min-[1080px]:mr-1 text-base" />
                    <span className="inline max-[1080px]:hidden text-base">
                      Import Model
                    </span>
                  </Button>
                </DaImportFile>
              ) : (
                <p className="flex items-center text-base text-muted-foreground">
                  <TbLoader className="animate-spin text-lg mr-2" />
                  Importing model ...
                </p>
              )}
              <DaDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary bg-transparent text-primary max-[1080px]:px-[7px]!"
                  >
                    <HiPlus className="text-base" />
                    <span className="inline max-[1080px]:hidden">
                      Add Model
                    </span>
                  </Button>
                }
              >
                <FormCreateModel />
              </DaDialog>
            </>
          )}
        </div>
      </div>

      {allEmpty && visible?.length === 0 ? (
        <div className="flex items-center justify-center min-h-[200px] text-sm text-muted-foreground mt-2">
          No vehicle models available yet
        </div>
      ) : visible ? (
        <div className="mt-2 mx-12 min-[1440px]:mx-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {visible.map((model) => (
            <div
              key={model.id}
              className="cursor-pointer"
              onClick={() => navigate(`/model/${model.id}`)}
            >
              <DaModelCard
                model={model}
                variant="home"
                isDeleting={isDeletingModel && deleteModelId === model.id}
                onAction={async (action, modelId) => {
                  if (action === 'add') {
                    navigate(`/new-prototype?model_id=${modelId}`)
                  }
                  if (action === 'rename') {
                    const m = visible?.find((v) => v.id === modelId)
                    setTimeout(() => {
                      setRenameValue(m?.name ?? '')
                      setRenameModelId(modelId)
                    }, 100)
                  }
                  if (action === 'imageUpdated') {
                    await refetchModels()
                  }
                  if (action === 'delete') {
                    setTimeout(() => {
                      setDeleteModelId(modelId)
                      setConfirmDeleteOpen(true)
                    }, 100)
                  }
                  if (action === 'history') {
                    const prototypes = await listModelPrototypes(modelId)
                    if (prototypes.length > 0) {
                      const latestTime = (p: any) => {
                        const created = p.created_at
                          ? new Date(p.created_at).getTime()
                          : 0
                        const updated = p.updated_at
                          ? new Date(p.updated_at).getTime()
                          : 0
                        return Math.max(created, updated)
                      }
                      const recent = prototypes.sort(
                        (a, b) => latestTime(b) - latestTime(a),
                      )[0]
                      navigate(
                        `/model/${modelId}/library/prototype/${recent.id}/view`,
                      )
                    } else {
                      navigate(`/model/${modelId}/library/list`)
                    }
                  }
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 mx-12 min-[1440px]:mx-0">
          <DaSkeletonGrid
            timeout={15}
            timeoutText="No vehicle models available yet"
            maxItems={{ sm: 1, md: 2, lg: 3, xl: 5 }}
            itemWrapperClassName="grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            containerHeight="min-h-[200px]"
          />
        </div>
      )}

      {filteredModels && filteredModels.length > visibleCount && (
        <div className="flex justify-center mt-4">
          <Button
            variant="default"
            size="sm"
            onClick={() => setRowsShown((r) => r + 1)}
          >
            Load More Models
            <TbChevronDown className="ml-1" />
          </Button>
        </div>
      )}

      <DaDialog
        open={!!renameModelId}
        onOpenChange={(open) => {
          if (!open) {
            setRenameModelId(null)
            setTimeout(() => {
              document.body.style.removeProperty('pointer-events')
            }, 100)
          }
        }}
        dialogTitle="Rename Model"
      >
        <div className="flex flex-col gap-4">
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameModel()}
            placeholder="Model name"
            className="!rounded-md"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenameModelId(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRenameModel}
              disabled={isRenaming || !renameValue.trim()}
            >
              {isRenaming ? (
                <TbLoader className="mr-1 size-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </div>
        </div>
      </DaDialog>

      <DaConfirmPopup
        onConfirm={handleDeleteModel}
        title="Delete Model"
        label="This action cannot be undone and will delete all of your model and prototypes data. Please proceed with caution."
        confirmText={visible?.find((m) => m.id === deleteModelId)?.name}
        state={[confirmDeleteOpen, setConfirmDeleteOpen]}
      >
        <></>
      </DaConfirmPopup>
    </div>
  )
}

export default HomeModelList
