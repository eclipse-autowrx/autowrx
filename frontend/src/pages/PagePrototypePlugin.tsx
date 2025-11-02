// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import PluginPageRender from '@/components/organisms/PluginPageRender'

interface PagePrototypePluginProps {}

const PagePrototypePlugin: FC<PagePrototypePluginProps> = () => {
  const { model_id, prototype_id } = useParams()
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

  return (
    <div className="w-full h-full">
      <PluginPageRender
        plugin_id={pluginId}
        data={{
          model_id,
          prototype_id,
        }}
      />
    </div>
  )
}

export default PagePrototypePlugin
