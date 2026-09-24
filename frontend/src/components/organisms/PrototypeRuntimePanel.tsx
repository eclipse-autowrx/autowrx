// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useMemo } from 'react'
import PluginPageRender from '@/components/organisms/PluginPageRender'
import useCurrentModel from '@/hooks/useCurrentModel'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import usePermissionHook from '@/hooks/usePermissionHook'
import { useUsedVehicleApis } from '@/hooks/useUsedVehicleApis'
import { useSystemUI } from '@/hooks/useSystemUI'
import useModelStore from '@/stores/modelStore'
import { shallow } from 'zustand/shallow'
import { PERMISSIONS } from '@/data/permission'
import { cn } from '@/lib/utils'

interface PrototypeRuntimePanelProps {
  pluginSlug: string
  className?: string
}

/**
 * Slot that replaces the built-in DaRuntimeControl with a plugin
 * (`custom_template.prototype_runtime_plugin`). The plugin owns its own width:
 * collapsed it must be 3.5rem wide, which the main content area reserves.
 */
const PrototypeRuntimePanel: FC<PrototypeRuntimePanelProps> = ({
  pluginSlug,
  className,
}) => {
  const { data: model } = useCurrentModel()
  const { data: queriedPrototype } = useCurrentPrototype()
  // Like DaRuntimeControl, prefer the store: the Code tab saves into it without
  // refreshing the prototype query, and a runtime must run the latest code.
  const [storePrototype, activeModelV2CApis] = useModelStore(
    (state) => [state.prototype, state.activeModelV2CApis],
    shallow,
  )
  const prototype =
    storePrototype?.id && storePrototype.id === queriedPrototype?.id
      ? storePrototype
      : queriedPrototype
  const { data: currentUser } = useSelfProfileQuery()
  const [canRun] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const { showPrototypeDashboardFullScreen } = useSystemUI()

  const usedApis = useUsedVehicleApis(prototype?.code || '')

  const usedV2CApis = useMemo(() => {
    const code = prototype?.code || ''
    if (!code || !activeModelV2CApis || activeModelV2CApis.length === 0) {
      return []
    }
    return activeModelV2CApis.filter((item: any) => code.includes(item.path))
  }, [prototype?.code, activeModelV2CApis])

  const data = useMemo(
    () => ({
      model: model || null,
      prototype: prototype
        ? { ...prototype, apis: { V2C: usedV2CApis, VSS: usedApis } }
        : null,
      currentUser: currentUser
        ? { id: currentUser.id, name: currentUser.name }
        : null,
      canRun: !!canRun,
    }),
    [model, prototype, usedV2CApis, usedApis, currentUser, canRun],
  )

  return (
    <div
      data-id="runtime-control-panel"
      data-runtime-plugin={pluginSlug}
      className={cn(
        'right-0 z-10 flex flex-col min-w-14 max-w-full',
        showPrototypeDashboardFullScreen
          ? 'fixed top-[58px] bottom-[22.55px]'
          : 'absolute top-0 bottom-0',
        className,
      )}
    >
      <PluginPageRender plugin_id={pluginSlug} data={data} />
    </div>
  )
}

export default PrototypeRuntimePanel
