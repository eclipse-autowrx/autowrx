// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useRef, useEffect, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/components/atoms/dialog'
import { Input } from '@/components/atoms/input'
import { Button } from '@/components/atoms/button'
import { Spinner } from '@/components/atoms/spinner'
import { TbSearch, TbSortDescending } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import { searchService } from '@/services/search.service'
import { toast } from 'react-toastify'
import type { Prototype, ModelLite } from '@/types/model.type'

interface DaGlobalSearchProps {
  trigger: ReactNode
}

type FilterType = 'Prototypes' | 'Models'

interface SearchResult {
  id: string
  name: string
  image_file: string
  type: 'Prototype' | 'Model'
  parent?: { model_id: string }
}

const FILTER_OPTIONS: { category: string; options: FilterType[] }[] = [
  { category: 'Type', options: ['Prototypes', 'Models'] },
]

const DaGlobalSearch = ({ trigger }: DaGlobalSearchProps) => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const [selectedFilters, setSelectedFilters] = useState<FilterType[]>([
    'Prototypes',
    'Models',
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleFilter = (filter: FilterType) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter],
    )
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setFilteredResults([])
    setHasSearched(false)
  }

  const performSearch = async () => {
    if (searchTerm.length === 0) return

    setIsSearching(true)
    try {
      const searchResults = await searchService(searchTerm)
      const prototypes = searchResults.top10prototypes
      const models = searchResults.top10models

      if (prototypes && models) {
        let results: SearchResult[] = []

        if (selectedFilters.includes('Prototypes')) {
          const filteredPrototypes: SearchResult[] = prototypes
            .map((prototype: Prototype) => ({
              id: prototype.id,
              name: prototype.name,
              image_file: prototype.image_file,
              type: 'Prototype' as const,
              parent: { model_id: prototype.model_id },
            }))
          results = [...results, ...filteredPrototypes]
        }

        if (selectedFilters.includes('Models')) {
          const filteredModels: SearchResult[] = models
            .map((model: ModelLite) => ({
              id: model.id,
              name: model.name,
              image_file: model.model_home_image_file,
              type: 'Model' as const,
            }))
          results = [...results, ...filteredModels]
        }

        setFilteredResults(results)
      } else {
        setFilteredResults([])
      }
      setHasSearched(true)
    } catch {
      toast.error('Search failed. Please try again later.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setOpen(false)
    if (result.type === 'Prototype') {
      navigate(
        `/model/${result.parent?.model_id}/library/prototype/${result.id}/view`,
      )
    } else if (result.type === 'Model') {
      navigate(`/model/${result.id}`)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setSearchTerm('')
          setFilteredResults([])
          setHasSearched(false)
          setFilterOpen(false)
          setSelectedFilters(['Prototypes', 'Models'])
        }
        setOpen(v)
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="w-[70vw] lg:w-[35vw] h-[70vh] max-w-none flex flex-col border-none p-5 rounded-[10px]"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search for prototypes and models
        </DialogDescription>

        <div className="flex flex-col h-full">
          <div className="flex items-center">
            <div className="relative mr-2 w-full">
              <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search Model or Prototype"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') performSearch()
                }}
              />
            </div>
            <div className="relative" ref={filterRef}>
              <Button
                variant="outline"
                size="sm"
                className="mr-2 shadow-sm"
                onClick={() => setFilterOpen((prev) => !prev)}
              >
                <TbSortDescending className="size-4 mr-1.5" />
                Filter
              </Button>
              {filterOpen && (
                <ul className="absolute right-0 z-10 bg-background border rounded-md shadow-lg mt-2 max-w-fit p-1 select-none min-w-[140px]">
                  {FILTER_OPTIONS.map(({ category, options }) => (
                    <li key={category}>
                      <div className="ml-2 text-xs font-bold text-muted-foreground mt-2 mb-1">
                        {category}
                      </div>
                      {options.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-muted rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters.includes(option)}
                            onChange={() => toggleFilter(option)}
                            className="accent-primary"
                          />
                          {option}
                        </label>
                      ))}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {isSearching ? (
            <div className="flex w-full h-full items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Spinner size={48} />
                <span className="text-base font-semibold text-muted-foreground">
                  Searching...
                </span>
              </div>
            </div>
          ) : (
            <div>
              {searchTerm.length === 0 && (
                <p className="text-sm font-semibold flex justify-center mt-6">
                  Type something and press enter to search
                </p>
              )}
              {searchTerm.length > 0 && !hasSearched && (
                <p className="text-sm font-semibold flex justify-center mt-6">
                  Press enter to search
                </p>
              )}
              {hasSearched && filteredResults.length === 0 && (
                <p className="text-sm font-semibold flex justify-center mt-6">
                  No results found
                </p>
              )}

              {filteredResults.length > 0 && (
                <div className="flex flex-col space-y-1 max-h-[50vh] overflow-y-auto mt-4">
                  <p className="text-sm font-light mb-2">
                    Search{' '}
                    <span className="font-semibold"> '{searchTerm}' </span>
                    for{' '}
                    <span className="font-semibold">
                      {selectedFilters
                        .map((filter) => filter.slice(0, -1))
                        .join(', ')}{' '}
                    </span>
                    :{' '}
                    {`${filteredResults.length} ${filteredResults.length > 1 ? 'results' : 'result'}`}
                  </p>
                  {filteredResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center p-2 mr-2 cursor-pointer hover:bg-muted border border-border rounded-lg hover:border-primary transition-colors"
                      onClick={() => handleResultClick(result)}
                    >
                      <img
                        src={result.image_file || (result.type === 'Prototype' ? '/imgs/default_prototype_cover.jpg' : '/imgs/default-model-image.png')}
                        alt={result.name}
                        className="w-16 h-16 mr-4 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = result.type === 'Prototype'
                            ? '/imgs/default_prototype_cover.jpg'
                            : '/imgs/default-model-image.png'
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          {result.name}
                        </span>
                        <span className="text-sm font-light">
                          {result.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DaGlobalSearch
