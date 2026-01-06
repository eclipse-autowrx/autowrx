// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useMemo } from 'react'
import DaTabItem from '@/components/atoms/DaTabItem'
import { useParams } from 'react-router-dom'
import { TbApi, TbPlus } from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import { useQuery } from '@tanstack/react-query'
import { getCustomApiSetById } from '@/services/customApiSet.service'

interface ModelApiTabsProps {
  customApiSetIds?: string[]
  onAddInstance?: () => void
  isModelOwner?: boolean
}

const ModelApiTabs: FC<ModelApiTabsProps> = ({
  customApiSetIds = [],
  onAddInstance,
  isModelOwner = false,
}) => {
  const { model_id, instance_id } = useParams<{ model_id: string; instance_id?: string }>()

  // Normalize IDs to strings (handle MongoDB ObjectIds that might be objects)
  // Use useMemo to ensure stable reference and prevent unnecessary re-renders
  const normalizedIds = useMemo(() => {
    return customApiSetIds
      .map((id) => {
        if (typeof id === 'string') return id
        if (id && typeof id === 'object' && 'toString' in id) return id.toString()
        return String(id)
      })
      .filter((id): id is string => {
        return !!id && typeof id === 'string' && id !== '[object Object]' && id !== 'undefined' && id !== 'null'
      })
  }, [customApiSetIds])

  // Fetch set data for tabs
  const setQueries = useQuery({
    queryKey: ['custom-api-sets', normalizedIds.join(',')], // Use string for query key
    queryFn: async () => {
      const sets = await Promise.all(
        normalizedIds.map((id) => getCustomApiSetById(id))
      )
      return sets
    },
    enabled: normalizedIds.length > 0,
  })

  const sets = setQueries.data || []

  // Determine active tab
  const isCovesaActive = !instance_id || instance_id === 'covesa'

  return (
    <>
      {/* Default COVESA API tab */}
      <DaTabItem
        active={isCovesaActive}
        to={`/model/${model_id}/api`}
        dataId="tab-covesa-api"
      >
        <TbApi className="w-5 h-5 mr-2" />
        COVESA API
      </DaTabItem>

      {/* Dynamic set tabs */}
      {sets.map((set) => {
        // Ensure set.id is a string for comparison and navigation
        const setIdString = typeof set.id === 'string' 
          ? set.id 
          : (set.id && typeof set.id === 'object' && 'toString' in set.id)
          ? set.id.toString()
          : String(set.id)
        
        const isActive = instance_id === setIdString
        return (
          <DaTabItem
            key={`set-${setIdString}`}
            active={isActive}
            to={`/model/${model_id}/api/${setIdString}`}
          >
            {set.name}
          </DaTabItem>
        )
      })}

      {/* Plus button to add new instance */}
      {isModelOwner && onAddInstance && (
        <div className="flex w-fit h-full items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddInstance}
            className="h-full w-12 rounded-none hover:bg-accent"
          >
            <TbPlus className="w-5 h-5" />
          </Button>
        </div>
      )}
    </>
  )
}

export default ModelApiTabs

