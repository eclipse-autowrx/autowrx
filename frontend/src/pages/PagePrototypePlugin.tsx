// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { useSearchParams } from 'react-router-dom'
import PluginPageRender from '@/components/organisms/PluginPageRender'
import useCurrentModel from '@/hooks/useCurrentModel'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { Spinner } from '@/components/atoms/spinner'

interface PagePrototypePluginProps {}

const PagePrototypePlugin: FC<PagePrototypePluginProps> = () => {
  const { data: model, isLoading: isModelLoading } = useCurrentModel()
  const { data: prototype, isLoading: isPrototypeLoading } = useCurrentPrototype()
  const [searchParams] = useSearchParams()
  const pluginId = searchParams.get('plugid')

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
          prototype: prototype || null,
        }}
      />
    </div>
  )
}

export default PagePrototypePlugin
