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

  const [activeModelApis, activeModelV2CApis] = useModelStore((state) => [
    state.activeModelApis,
    state.activeModelV2CApis,
  ])

  const { useApis, usedV2CApis } = useMemo(() => {
    const code = prototype?.code || ''
    let useList: any[] = []
    let useV2CList: any[] = []

    if (code && activeModelApis && activeModelApis.length > 0) {
      activeModelApis.forEach((item: any) => {
        if (code.includes(item.shortName)) {
          useList.push(item)
        }
      })
    }

    if (code && activeModelV2CApis && activeModelV2CApis.length > 0) {
      activeModelV2CApis.forEach((item: any) => {
        if (code.includes(item.path)) {
          useV2CList.push(item)
        }
      })
    }

    return {
      useApis: useList,
      usedV2CApis: useV2CList,
    }
  }, [prototype?.code, activeModelApis, activeModelV2CApis])

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
