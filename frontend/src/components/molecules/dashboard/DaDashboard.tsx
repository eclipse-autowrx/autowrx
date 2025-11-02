// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useEffect, useState, useRef } from 'react'
import DaDashboardGrid from './DaDashboardGrid'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import PrototypeTabCodeDashboardCfg from '@/components/organisms/PrototypeTabCodeDashboardCfg'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import {
  TbArrowsMaximize,
  TbArrowsMinimize,
  TbEdit,
  TbTrash,
} from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
const MODE_RUN = 'run'
const MODE_EDIT = 'edit'
import { useSystemUI } from '@/hooks/useSystemUI'
import { cn } from '@/lib/utils'
import { DaImage } from '@/components/atoms/DaImage'
import { Link } from 'react-router-dom'
import { updatePrototypeService } from '@/services/prototype.service'
import useGetPrototype from '@/hooks/useGetPrototype'

const DaDashboard = () => {
  const { data: model } = useCurrentModel()
  const [
    prototype,
    setActivePrototype,
    prototypeHasUnsavedChanges,
    setPrototypeHasUnsavedChanges,
  ] = useModelStore((state) => [
    state.prototype as Prototype,
    state.setActivePrototype,
    state.prototypeHasUnsavedChanges,
    state.setPrototypeHasUnsavedChanges,
  ])
  const [widgetItems, setWidgetItems] = useState<any>([])
  const [mode, setMode] = useState<string>(MODE_RUN)
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const {
    showPrototypeDashboardFullScreen,
    setShowPrototypeDashboardFullScreen,
  } = useSystemUI()

  const originalWidgetConfigRef = useRef<string>('')
  const [pendingChanges, setPendingChanges] = useState(false)
  const { refetch } = useGetPrototype(prototype?.id || '')

  useEffect(() => {
    if (prototypeHasUnsavedChanges && prototype?.id) {
      refetch()
        .then((response) => {
          if (response.data) {
            setActivePrototype(response.data)
            setPrototypeHasUnsavedChanges(false)
          }
        })
        .catch((error) => {
          console.error('Error refreshing prototype data:', error)
        })
    }
  }, [])

  useEffect(() => {
    let widgetItems = []
    // prototype.widget_config: JSON string
    if (prototype?.widget_config) {
      try {
        let dashboard_config = JSON.parse(prototype.widget_config) // prototype.dashboard_config: JSON object
        if (Array.isArray(dashboard_config)) {
          widgetItems = dashboard_config
        } else {
          if (
            dashboard_config?.widgets &&
            Array.isArray(dashboard_config.widgets)
          ) {
            widgetItems = dashboard_config.widgets
          }
        }
      } catch (err) {
        console.error('Error parsing widget config', err)
      }
    }
    //
    processWidgetItems(widgetItems)
    setWidgetItems(widgetItems)
  }, [prototype?.widget_config])

  const processWidgetItems = (widgetItems: any[]) => {
    if (!widgetItems) return
    widgetItems.forEach((widget) => {
      if (!widget?.url) {
        if (widget.options?.url) {
          widget.url = widget.options.url
        } else if (widget.path) {
          // For built-in widgets, use the static path
          widget.url = widget.path
        }
      }
    })
  }

  const handleEnterEditMode = () => {
    originalWidgetConfigRef.current = prototype?.widget_config || ''
    setMode(MODE_EDIT)
    setPendingChanges(false)
  }

  const handleDeleteAllWidgets = async () => {
    const emptyConfig = JSON.stringify(
      {
        autorun: false,
        widgets: [],
      },
      null,
      4,
    )

    setWidgetItems([])

    const newPrototype = { ...prototype, widget_config: emptyConfig }
    setActivePrototype(newPrototype)

    setPendingChanges(true)
    setPrototypeHasUnsavedChanges(true) // Mark that we have unsaved changes
  }

  const handleSave = async () => {
    // Only save to database if changes were made
    if (pendingChanges && prototype?.id) {
      try {
        await updatePrototypeService(prototype.id, {
          widget_config: prototype.widget_config,
        })
        setPrototypeHasUnsavedChanges(false)
      } catch (error) {
        console.error('Error saving widget configuration:', error)
      }
    }
    setMode(MODE_RUN)
    setPendingChanges(false)
  }

  const handleCancel = () => {
    // Restore the original configuration
    if (pendingChanges && originalWidgetConfigRef.current) {
      const originalPrototype = {
        ...prototype,
        widget_config: originalWidgetConfigRef.current,
      }
      setActivePrototype(originalPrototype)
    }
    setMode(MODE_RUN)
    setPendingChanges(false)
    setPrototypeHasUnsavedChanges(false)
  }

  return (
    <div className="w-full h-full relative border bg-white">
      <div
        className={cn(
          'absolute z-10 left-0 px-2 top-0 flex w-full py-1 shadow-xl bg-white items-center',
          showPrototypeDashboardFullScreen && 'h-[56px]',
        )}
      >
        {showPrototypeDashboardFullScreen && (
          <Link to="/" className="w-fit h-[56px] flex items-center px-2">
            <DaImage src="/imgs/logo-wide.png" className="object-contain" />
          </Link>
        )}
        {isAuthorized && (
          <div className="ml-2 flex w-full h-fit items-center px-1 justify-end">
            {mode == MODE_RUN && (
              <Button
                variant="outline"
                size="sm"
                data-id="dashboard-edit-button"
                onClick={handleEnterEditMode}
              >
                <TbEdit className="size-4 mr-1" />
                Edit
              </Button>
            )}

            {mode == MODE_EDIT && (
              <div className="flex flex-col w-full h-full">
                <div className="flex w-full h-fit justify-between">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-fit flex text-destructive hover:bg-transparent hover:text-destructive/90"
                    onClick={handleDeleteAllWidgets}
                    data-id="dashboard-delete-all-widgets"
                  >
                    <TbTrash className="size-4 mr-1" />
                    Delete all widgets
                  </Button>
                  <div className="flex w-fit ml-auto items-center space-x-2 mr-2">
                    <Button
                      size="sm"
                      onClick={handleCancel}
                      variant="outline"
                      data-id="dashboard-cancel-button"
                      className="w-16"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      data-id="dashboard-save-button"
                      className="w-16"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          data-id="dashboard-fullscreen-button"
          onClick={() =>
            setShowPrototypeDashboardFullScreen(
              !showPrototypeDashboardFullScreen,
            )
          }
        >
          {showPrototypeDashboardFullScreen ? (
            <TbArrowsMinimize className="size-4" />
          ) : (
            <TbArrowsMaximize className="size-4" />
          )}
        </Button>
      </div>

      <div
        className={cn(
          'w-full h-full absolute top-0 left-0 right-0 bottom-0 ',
          showPrototypeDashboardFullScreen ? 'pt-[56px]' : 'pt-[38px]',
        )}
      >
        <div
          className={cn(
            'flex flex-col w-full h-full pt-1',
            showPrototypeDashboardFullScreen && 'pr-14',
          )}
        >
          {mode == MODE_RUN && (
            <div className="flex w-full h-full px-1 pb-1">
              <DaDashboardGrid widgetItems={widgetItems} />
            </div>
          )}
          {mode == MODE_EDIT && (
            <div className="px-4 h-full">
              <PrototypeTabCodeDashboardCfg />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DaDashboard

