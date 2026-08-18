// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect } from 'react'
import { shallow } from 'zustand/shallow'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import DaDashboardEditor from '../molecules/dashboard/DaDashboardEditor'
import useCanEditPrototype from '@/hooks/useCanEditPrototype'
import { updatePrototypeService } from '@/services/prototype.service'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'

const PrototypeTabCodeDashboardCfg: FC = ({}) => {
  const [prototype, setActivePrototype] = useModelStore(
    (state) => [state.prototype as Prototype, state.setActivePrototype],
    shallow,
  )
  const [dashboardCfg, setDashboardCfg] = useState<string>('')
  const [ticker, setTicker] = useState(0)
  const editable = useCanEditPrototype(prototype)

  useEffect(() => {
    let timer = setInterval(() => {
      setTicker((oldTicker) => oldTicker + 1)
    }, 3000)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [ticker])

  useEffect(() => {
    setDashboardCfg(prototype?.widget_config || '')
  }, [prototype?.widget_config])

  useEffect(() => {
    if (dashboardCfg == prototype.widget_config) return
    saveDashboardCfgToDb(dashboardCfg || '')
  }, [ticker])

  const saveDashboardCfgToDb = async (dashboardConfig: string) => {
    if (!dashboardConfig) {
      return
    }

    let updateConfig = dashboardConfig

    try {
      let configObj = JSON.parse(updateConfig)
      if (Array.isArray(configObj)) {
        let revisedObj = {
          autorun: false,
          widgets: configObj,
        }
        updateConfig = JSON.stringify(revisedObj, null, 4)
      }
    } catch (parseErr) {
      console.error('JSON parsing error:', parseErr, 'Input:', updateConfig)
      return
    }

    if (updateConfig === prototype.widget_config || updateConfig === '') {
      return
    }

    setDashboardCfg(updateConfig)
    let newPrototype = { ...prototype, widget_config: updateConfig }
    setActivePrototype(newPrototype)

    if (prototype && prototype.id) {
      try {
        await updatePrototypeService(prototype.id, {
          widget_config: updateConfig,
        })
      } catch (error) {
        console.error('Error updating prototype service:', error)
      }
    }
  }

  return (
    <>
      <DaDashboardEditor
        entireWidgetConfig={prototype.widget_config}
        editable={editable}
        onDashboardConfigChanged={saveDashboardCfgToDb}
      />
    </>
  )
}

export default PrototypeTabCodeDashboardCfg

