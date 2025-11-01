// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useRef, useEffect, useMemo } from 'react'
import { DaTableProperty } from '../molecules/DaTableProperty'
import { DaCopy } from '../atoms/DaCopy'
import { cn, getApiTypeClasses } from '@/lib/utils'
import { Button } from '@/components/atoms/button'
import { updateModelService } from '@/services/model.service'
import useCurrentModel from '@/hooks/useCurrentModel'
import { CustomApi } from '@/types/model.type'
import DaConfirmPopup from '../molecules/DaConfirmPopup'
import { Link, useNavigate } from 'react-router-dom'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import DaApiArchitecture from '../molecules/DaApiArchitecture'
import DaDiscussions from '../molecules/DaDiscussions'
import { Dialog, DialogContent } from '@/components/atoms/dialog'
import FormSubmitIssue from '../molecules/forms/FormSubmitIssue'
import { FaGithub } from 'react-icons/fa6'
import useGithubAuth from '@/hooks/useGithubAuth'
import {
  TbChevronDown,
  TbEdit,
  TbExternalLink,
  TbLoader,
  TbTrash,
} from 'react-icons/tb'
import useCurrentExtendedApiIssue from '@/hooks/useCurrentExtendedApiIssue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import DaConsumedPrototypes from '../molecules/DaConsumedPrototypes'
import { deleteExtendedApi } from '@/services/extendedApis.service'
import useModelStore from '@/stores/modelStore'
import { customAPIs } from '@/data/customAPI'
import DaVehicleAPIEditor from '../molecules/DaVehicleAPIEditor'
import { CustomPropertyType } from '@/types/property.type'
import { Spinner } from '@/components/atoms/spinner'

interface ApiDetailProps {
  apiDetails: any
  forceSimpleMode?: boolean
  diffDetail?: any
  syncHeight?: boolean
}

// Randomly select one of the items from the list based on the name length
const OneOfFromName = (list: string[], name: string) => {
  return list[name.length % list.length]
}

const ApiDetail = ({
  apiDetails,
  forceSimpleMode,
  diffDetail,
  syncHeight,
}: ApiDetailProps) => {
  const { bgClass } = getApiTypeClasses(apiDetails.type)
  const { data: model, refetch } = useCurrentModel()
  const [isLoading, setIsLoading] = useState(false)
  const discussionsRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model?.id])
  const [popupSubmitIssueOpen, setPopupSubmitIssueOpen] = useState(false)

  const { onTriggerAuth, loading, user, access, error } = useGithubAuth()
  const { data, refetch: refetchCurrIssue } = useCurrentExtendedApiIssue()
  const [isEditing, setIsEditing] = useState(false)
  const refreshModel = useModelStore((state) => state.refreshModel)

  const handleDeleteWishlistApi = async () => {
    if (model) {
      if (apiDetails?.id) {
        await deleteExtendedApi(apiDetails.id)
        await refreshModel()
      } else if (model.custom_apis) {
        const updatedCustomApis = model.custom_apis.filter(
          (api: CustomApi) => api.name !== apiDetails.name,
        )
        try {
          setIsLoading(true)
          const customApisJson = JSON.stringify(updatedCustomApis)
          await updateModelService(model.id, {
            custom_apis: customApisJson as any,
          })
          setIsLoading(false)
          await refetch()
          navigate(`/model/${model.id}/api/Vehicle`)
        } catch (error) {
          setIsLoading(false)
          console.error('Error deleting wishlist API:', error)
        }
      }
    }
  }

  const implementationProperties = [
    {
      name: 'Implementation Status',
      value: OneOfFromName(
        ['Wishlist', 'VSS Spec', 'HW Prototype', 'Production ready'],
        apiDetails.name,
      ),
    },
    {
      name: 'Signal Lifecycle Status',
      value: OneOfFromName(
        [
          'Proposal: Proposed new Signal',
          'Validated: Has at least one valid client use case / example prototype',
          'Committed: Server implementation has been committed for next release',
          'Available: Server implementation is available',
        ],
        apiDetails.name,
      ),
    },
    {
      name: 'Signal Standardization',
      value: OneOfFromName(
        [
          'Undefined',
          'Proprietary: Proprietary Signal definition (OEM only)',
          'Proposed for standardization: Formal proposal to Signal standards organization, e.g. COVESA',
          'Standardized: Proposal has been accepted',
        ],
        apiDetails.name,
      ),
    },
    {
      name: 'Signal Visibility',
      value: OneOfFromName(
        [
          'Internal: This Signal is only accessible for apps provided by the OEM',
          'Partner: This Signal is only available to the OEM as well as selected development partners',
          'Open AppStore: This Signal is available to any vehicle AppStore developer',
        ],
        apiDetails.name,
      ),
    },
    apiDetails.supportedHardware && {
      name: 'Supported Hardware',
      value: apiDetails.supportedHardware,
    },
    apiDetails.keystakeHolder && {
      name: 'Keystake Holder',
      value: apiDetails.keystakeHolder,
    },
  ].filter(Boolean)

  const vssSpecificationProperties = [
    { name: 'Signal', value: apiDetails.name || 'N/A' },
    {
      name: 'UUID',
      value: (apiDetails && apiDetails.uuid) || 'N/A',
    },
    {
      name: 'Type',
      value: (apiDetails && apiDetails.type) || 'N/A',
    },
    {
      name: 'Description',
      value: (apiDetails && apiDetails.description) || 'N/A',
    },
    apiDetails.datatype && {
      name: 'Data Type',
      value: apiDetails.datatype,
    },
    apiDetails.unit && { name: 'Unit', value: apiDetails.unit },
    apiDetails.max !== undefined && {
      name: 'Max',
      value: apiDetails.max.toString(),
    },
    apiDetails.min !== undefined && {
      name: 'Min',
      value: apiDetails.min.toString(),
    },
    apiDetails.allowed && {
      name: 'Allowed Values',
      value: apiDetails.allowed.join(', '),
    },
    apiDetails.comment && { name: 'Comment', value: apiDetails.comment },
  ].filter(Boolean)
  const translatedDiffDetail = diffDetail
    ? {
        Signal: diffDetail.name,
        UUID: diffDetail.uuid,
        Type: diffDetail.type,
        Description: diffDetail.description,
        'Data Type': diffDetail.datatype,
        Unit: diffDetail.unit,
        Max: diffDetail.max,
        Min: diffDetail.min,
        'Allowed Values': diffDetail.allowed,
        Comment: diffDetail.comment,
      }
    : null

  const customProperties: CustomPropertyType[] = useMemo(() => {
    if (
      !apiDetails?.custom_properties ||
      typeof apiDetails.custom_properties !== 'object'
    )
      return []
    return Object.values(apiDetails.custom_properties)
  }, [apiDetails?.custom_properties])

  const [confirmPopupOpen, setConfirmPopupOpen] = useState(false)

  return (
    <div className="flex h-full w-full flex-col">
      {!forceSimpleMode && <DaApiArchitecture apiName={apiDetails.name} />}
      <div className="flex h-fit w-full flex-row items-center justify-between space-x-2 bg-primary/10 py-2 pl-4 pr-2">
        <DaCopy textToCopy={apiDetails.name}>
          <div className="text-sm font-medium truncate text-primary">
            {apiDetails.name}
          </div>
          {apiDetails.isWishlist && (
            <div className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-500 text-[9px] font-medium text-white">
              W
            </div>
          )}
        </DaCopy>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="flex items-center text-muted-foreground">
              <TbLoader className="animate mr-2 h-5 w-5 animate-spin" />
              <div className="text-sm font-medium">Deleting...</div>
            </div>
          )}

          {!forceSimpleMode &&
            (apiDetails?.id ||
              model?.custom_apis?.some(
                (api) => api?.name === apiDetails?.name,
              )) &&
            isAuthorized && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm">
                    <div className="text-sm font-medium">Signal Action</div>
                    <TbChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <TbEdit className="mr-2 h-5 w-5" />
                    <div className="text-sm font-medium">Edit Signal</div>
                  </DropdownMenuItem>
                  {data ? (
                    <DropdownMenuItem asChild>
                      <Link
                        to={data.link}
                        className="text-sm font-medium flex items-center gap-2"
                        target="_blank"
                      >
                        <TbExternalLink className="h-5 w-5" />
                        View COVESA Issue
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => {
                        setPopupSubmitIssueOpen(true)
                        onTriggerAuth()
                      }}
                    >
                      <FaGithub className="mr-2 h-5 w-5" />
                      <span className="text-sm font-medium">
                        Propose this Signal to COVESA
                      </span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setConfirmPopupOpen(true)}>
                    <TbTrash className="mr-2 h-5 w-5" />
                    <div className="text-sm font-medium">Delete Signal</div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          <DaConfirmPopup
            onConfirm={handleDeleteWishlistApi}
            state={[confirmPopupOpen, setConfirmPopupOpen]}
            title="Delete Wishlist Signal"
            label="Are you sure you want to delete this wishlist signal?"
          >
            <></>
          </DaConfirmPopup>
          <Dialog open={popupSubmitIssueOpen} onOpenChange={setPopupSubmitIssueOpen}>
            <DialogContent>
              {loading && (
                <div className="flex flex-col items-center gap-4 p-4">
                  <Spinner />
                  <p className="text-sm font-medium">Please wait while we are authenticating with Github...</p>
                </div>
              )}

              {!loading && error && (
                <div className="flex flex-col items-center gap-4 p-4">
                  <p className="text-sm font-medium text-red-500">{error}</p>
                </div>
              )}

              {!loading && !error && access && (
                <FormSubmitIssue
                  user={user}
                  api={apiDetails}
                  refetch={refetchCurrIssue}
                  onClose={async () => {
                    setPopupSubmitIssueOpen(false)
                  }}
                  access={access}
                />
              )}
            </DialogContent>
          </Dialog>
          <div
            className={cn(
              'hidden h-8 items-center rounded-md px-2 xl:flex',
              bgClass,
            )}
          >
            <div className="text-sm font-medium uppercase text-white">
              {apiDetails.type}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-fit w-full flex-col p-4">
        <div className="text-sm font-medium flex text-foreground">
          VSS Specification
        </div>
        {isEditing ? (
          <DaVehicleAPIEditor
            onCancel={() => setIsEditing(false)}
            onUpdate={async () => {
              await Promise.all([refetch(), refreshModel()])
              setIsEditing(false)
            }}
            apiDetails={apiDetails}
            className="mt-2"
          />
        ) : (
          <DaTableProperty
            diffDetail={translatedDiffDetail}
            properties={[...vssSpecificationProperties, ...customProperties]}
            syncHeight={syncHeight}
          />
        )}

        <div className="text-sm font-medium flex pt-4 text-foreground">
          Implementation
        </div>
        <DaTableProperty properties={implementationProperties} />

        <DaConsumedPrototypes
          signal={
            ['actuator', 'sensor'].includes(apiDetails.type)
              ? apiDetails?.name || apiDetails?.shortName || ''
              : ''
          }
        />
      </div>
      {!forceSimpleMode && model && model.id && (
        <div ref={discussionsRef} className="flex h-full">
          <DaDiscussions
            className="h-full min-w-[0px] pb-2"
            refId={`${model.id}-${apiDetails.name}`}
            refType="api"
          />
        </div>
      )}
    </div>
  )
}

export default ApiDetail
