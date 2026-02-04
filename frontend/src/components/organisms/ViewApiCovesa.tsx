// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ApiDetail from '@/components/organisms/ApiDetail'
import { VehicleApi } from '@/types/model.type'
import ModelApiList from '@/components/organisms/ModelApiList'
import { DaImage } from '@/components/atoms/DaImage'
import DaTabItem from '@/components/atoms/DaTabItem'
import DaTreeView from '@/components/molecules/DaTreeView'
import useModelStore from '@/stores/modelStore'
import {
  TbBinaryTree2,
  TbGitCompare,
  TbList,
  TbDownload,
  TbReplace,
  TbLoader,
} from 'react-icons/tb'
import useCurrentModel from '@/hooks/useCurrentModel'
import VssComparator from '@/components/organisms/VssComparator'
import { getComputedAPIs, replaceAPIsService } from '@/services/model.service'
import { isAxiosError } from 'axios'
import { toast } from 'react-toastify'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/dialog'
import DaFileUpload from '@/components/atoms/DaFileUpload'
import { Button } from '@/components/atoms/button'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { Spinner } from '@/components/atoms/spinner'

const ViewApiCovesa = () => {
  const { model_id, api: apiParam } = useParams<{ model_id: string; api?: string }>()
  const navigate = useNavigate()
  const [selectedApi, setSelectedApi] = useState<VehicleApi | null>(null)
  const [activeTab, setActiveTab] = useState<
    'list' | 'tree' | 'compare' | 'hierarchical'
  >('list')
  const [activeModelApis, refreshModel] = useModelStore((state) => [
    state.activeModelApis,
    state.refreshModel,
  ])
  const { data: model, refetch } = useCurrentModel()

  const [hasWritePermission] = usePermissionHook([
    PERMISSIONS.WRITE_MODEL,
    model_id,
  ])

  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    // Set selected API from route param or default to first API
    if (apiParam && activeModelApis) {
      const foundApi = activeModelApis.find((api) => api.name === apiParam)
      if (foundApi) {
        setSelectedApi(foundApi)
        return
      }
    }
    // If no route param or not found, use previous selection or first API
    setSelectedApi(
      (prev) => activeModelApis?.find((api) => api.name === prev?.name) || activeModelApis?.[0] || null,
    )
  }, [activeModelApis, apiParam])

  const handleReplaceAPI = async () => {
    try {
      setLoading(true)
      await replaceAPIsService(model_id as string, url)
      await Promise.all([refetch(), refreshModel()])
      toast.success('APIs replaced successfully')

      setUrl('')
      setShowUpload(false)
    } catch (error) {
      console.error(error)
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to replace APIs')
      } else {
        toast.error('Failed to replace APIs')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApiClick = (apiDetails: VehicleApi) => {
    // console.log('apiDetails', apiDetails)
    setSelectedApi(apiDetails)
    navigate(`/model/${model_id}/api/covesa/${apiDetails.name}`)
  }

  const isLoading = activeModelApis?.length === 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Spinner className="mr-2" />
        <span className="text-sm font-medium text-muted-foreground">
          Loading Vehicle API...
        </span>
      </div>
    )
  }

  if (!activeModelApis || activeModelApis.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <span className="text-sm font-medium text-muted-foreground">
          No Signals found.
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-md h-full w-full flex flex-col">
      <div className="flex w-full min-h-10 items-center justify-between border-b border-muted-foreground/50 shrink-0">
        <div className="flex space-x-2 h-full">
          <DaTabItem
            active={activeTab === 'list'}
            to="#"
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('list')
            }}
          >
            <TbList className="w-5 h-5 mr-2" />
            List View
          </DaTabItem>

          <DaTabItem
            active={activeTab === 'tree'}
            to="#"
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('tree')
            }}
          >
            <TbBinaryTree2 className="w-5 h-5 mr-2 rotate-270" />
            Tree View
          </DaTabItem>

          <DaTabItem
            active={activeTab === 'compare'}
            to="#"
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('compare')
            }}
          >
            <TbGitCompare className="w-5 h-5 mr-2" />
            Version Diff
          </DaTabItem>
          <DaTabItem
            active={false}
            to="#"
            onClick={async (e) => {
              e.preventDefault()
              if (!model) return
              try {
                const data = await getComputedAPIs(model.id)
                const link = document.createElement('a')
                link.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 4))}`
                link.download = `${model.name}_vss.json`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                toast.success('JSON file downloaded successfully')
              } catch (e) {
                console.error(e)
                toast.error('Failed to download JSON file')
              }
            }}
          >
            <TbDownload className="w-5 h-5 mr-2" />
            Download as JSON
          </DaTabItem>
          {hasWritePermission && (
            <DaTabItem
              active={false}
              to="#"
              onClick={(e) => {
                e.preventDefault()
                if (!model) return
                setShowUpload(true)
              }}
            >
              <TbReplace className="h-5 w-5 mr-2" />
              Replace Vehicle API
            </DaTabItem>
          )}
        </div>
        <div className="text-sm font-medium text-primary pr-4">
          {model?.api_version && `COVESA VSS ${model.api_version}`}
        </div>
      </div>

      {(activeTab === 'list' || activeTab === 'hierarchical') && (
        <div className="grow w-full flex overflow-auto">
          <div className="flex-1 flex w-full h-full overflow-auto border-r">
            <ModelApiList
              onApiClick={handleApiClick}
              viewMode={activeTab === 'list' ? 'list' : 'hierarchical'}
            />
          </div>
          <div className="flex-1 flex w-full h-full overflow-auto">
            {selectedApi ? <>
              <ApiDetail apiDetails={selectedApi} />
            </> : (
              <div className="flex justify-center w-full h-full">
                <DaImage
                  src="/ref/E-Car_Full_Vehicle.png"
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tree' && (
        <div className="flex w-full grow overflow-auto items-center justify-center">
          <DaTreeView onNodeClick={() => setActiveTab('list')} />
        </div>
      )}
      {activeTab === 'compare' && (
        <div className="flex w-full grow overflow-auto justify-center">
          <VssComparator />
        </div>
      )}

      {hasWritePermission && (
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Vehicle API file</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <DaFileUpload
                onFileUpload={(url) => setUrl(url)}
                accept=".json"
                className="w-full"
              />
              <Button
                size="default"
                className="w-full"
                onClick={handleReplaceAPI}
                disabled={!url || loading}
              >
                {loading && <TbLoader className="animate-spin w-4 h-4 mr-2" />}
                Replace Vehicle API
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default ViewApiCovesa
