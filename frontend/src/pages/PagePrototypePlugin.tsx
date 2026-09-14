// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import PluginPageRender from '@/components/organisms/PluginPageRender'
import useCurrentModel from '@/hooks/useCurrentModel'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { Spinner } from '@/components/atoms/spinner'
import useModelStore from '@/stores/modelStore'
import { useUsedVehicleApis } from '@/hooks/useUsedVehicleApis'

interface PagePrototypePluginProps {
  pluginSlug?: string // If provided, use this instead of reading from URL
  onSetActiveTab?: (tab: string, pluginSlug?: string) => void
}

const PagePrototypePlugin: FC<PagePrototypePluginProps> = ({ pluginSlug, onSetActiveTab }) => {
  const { data: model, isLoading: isModelLoading } = useCurrentModel()
  const { data: prototype, isLoading: isPrototypeLoading } = useCurrentPrototype()
  const [searchParams] = useSearchParams()
  // Use pluginSlug prop if provided, otherwise fall back to URL param (for backward compatibility)
  const pluginId = pluginSlug || searchParams.get('plugid')

  const [activeModelV2CApis] = useModelStore((state) => [
    state.activeModelV2CApis,
  ])

  const useApis = useUsedVehicleApis(prototype?.code || '')

  const usedV2CApis = useMemo(() => {
    const code = prototype?.code || ''
    if (!code || !activeModelV2CApis || activeModelV2CApis.length === 0) {
      return []
    }
    return activeModelV2CApis.filter((item: any) => code.includes(item.path))
  }, [prototype?.code, activeModelV2CApis])

  const prototypeWithApis = useMemo(() => {
    if (!prototype) return null
    return {
      ...prototype,
      apis: {
        V2C: usedV2CApis,
        VSS: useApis,
      },
    }
  }, [prototype, useApis, usedV2CApis])

  if (!pluginId) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4">
        <p className="text-base text-muted-foreground">
          No plugin ID specified
        </p>
      </div>
    )
  }

  if (isModelLoading || isPrototypeLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4">
        <Spinner size={32} />
        <p className="text-base text-muted-foreground">Loading data...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <PluginPageRender
        key={pluginId}
        plugin_id={pluginId}
        data={{
          model: model || null,
          prototype: prototypeWithApis,
        }}
        onSetActiveTab={onSetActiveTab}
      />
    </div>
  )
}

export default PagePrototypePlugin
