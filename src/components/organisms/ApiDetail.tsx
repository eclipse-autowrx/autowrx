import { useState, useRef, useEffect } from 'react'
import { DaTableProperty } from '../molecules/DaTableProperty'
import { DaText } from '../atoms/DaText'
import { DaCopy } from '../atoms/DaCopy'
import { cn, getApiTypeClasses } from '@/lib/utils'
import { DaButton } from '../atoms/DaButton'
import { updateModelService } from '@/services/model.service'
import useCurrentModel from '@/hooks/useCurrentModel'
import { CustomApi } from '@/types/model.type'
import DaConfirmPopup from '../molecules/DaConfirmPopup'
import { Link, useNavigate } from 'react-router-dom'
import DaLoader from '../atoms/DaLoader'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import DaApiArchitecture from '../molecules/DaApiArchitecture'
import DaDiscussions from '../molecules/DaDiscussions'
import DaPopup from '../atoms/DaPopup'
import FormSubmitIssue from '../molecules/forms/FormSubmitIssue'
import { FaGithub } from 'react-icons/fa6'
import useGithubAuth from '@/hooks/useGithubAuth'
import {
  TbChevronDown,
  TbExternalLink,
  TbLoader,
  TbTrash,
} from 'react-icons/tb'
import useCurrentExtendedApiIssue from '@/hooks/useCurrentExtendedApiIssue'
import DaMenu from '../atoms/DaMenu'
import DaConsumedPrototypes from '../molecules/DaConsumedPrototypes'
import { deleteExtendedApi } from '@/services/extendedApis.service'
import useModelStore from '@/stores/modelStore'

interface ApiDetailProps {
  apiDetails: any
  forceSimpleMode?: boolean
  diffDetail?: any
}

// Randomly select one of the items from the list based on the name length
const OneOfFromName = (list: string[], name: string) => {
  return list[name.length % list.length]
}

const ApiDetail = ({
  apiDetails,
  forceSimpleMode,
  diffDetail,
}: ApiDetailProps) => {
  const { bgClass } = getApiTypeClasses(apiDetails.type)
  const { data: model, refetch } = useCurrentModel()
  const [isLoading, setIsLoading] = useState(false)
  const discussionsRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model?.id])
  const popupSubmitIssueState = useState(false)

  const { onTriggerAuth, loading, user, access, error } = useGithubAuth()
  const { data, refetch: refetchCurrIssue } = useCurrentExtendedApiIssue()
  const refreshModel = useModelStore((state) => state.refreshModel)

  const handleDeleteWishlistApi = async () => {
    if (model) {
      if (model.api_version && apiDetails?.id) {
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

  const [confirmPopupOpen, setConfirmPopupOpen] = useState(false)

  return (
    <div className="flex h-full w-full flex-col px-2">
      {!forceSimpleMode && <DaApiArchitecture apiName={apiDetails.name} />}
      <div className="grow"></div>
      <div className="flex h-fit w-full flex-row items-center justify-between space-x-2 bg-da-primary-100 py-2 pl-4 pr-2">
        <DaCopy textToCopy={apiDetails.name}>
          <DaText
            variant="regular-bold"
            className="truncate text-da-primary-500"
          >
            {apiDetails.name}
          </DaText>
          {apiDetails.isWishlist && (
            <div className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-500 text-[9px] font-bold text-da-white">
              W
            </div>
          )}
        </DaCopy>
        <div className="flex items-center space-x-2">
          {isLoading ? (
            <div className="flex items-center text-da-gray-medium">
              <TbLoader className="animate mr-2 h-5 w-5 animate-spin text-da-gray-medium" />
              <DaText variant="small-bold">Deleting...</DaText>
            </div>
          ) : (
            !forceSimpleMode &&
            apiDetails.isWishlist &&
            isAuthorized && (
              <DaMenu
                trigger={
                  <DaButton variant="solid" size="sm">
                    <div className="da-label-small-bold">
                      Wishlist Signal Action
                    </div>
                    <TbChevronDown className="ml-1 h-4 w-4" />
                  </DaButton>
                }
              >
                <div className="da-menu-dropdown flex flex-col">
                  {data ? (
                    <Link
                      to={data.link}
                      className="da-label-small-bold flex items-center gap-2"
                      target="_blank"
                    >
                      <TbExternalLink className="h-5 w-5" />
                      View COVESA Issue
                    </Link>
                  ) : (
                    <DaButton
                      variant="plain"
                      size="sm"
                      onClick={() => {
                        popupSubmitIssueState[1](true)
                        onTriggerAuth()
                      }}
                    >
                      <FaGithub className="mr-2 h-5 w-5" />
                      <span className="da-label-small-bold">
                        Propose this Signal to COVESA
                      </span>
                    </DaButton>
                  )}
                  <DaButton
                    variant="destructive"
                    size="sm"
                    className="flex w-full !justify-start"
                    onClick={() => setConfirmPopupOpen(true)}
                  >
                    <TbTrash className="mr-2 h-5 w-5" />
                    <div className="da-label-small-bold">
                      Delete Wishlist Signal
                    </div>
                  </DaButton>
                </div>
              </DaMenu>
            )
          )}
          <DaConfirmPopup
            onConfirm={handleDeleteWishlistApi}
            state={[confirmPopupOpen, setConfirmPopupOpen]}
            title="Delete Wishlist Signal"
            label="Are you sure you want to delete this wishlist signal?"
          >
            <></>
          </DaConfirmPopup>
          <DaPopup state={popupSubmitIssueState} trigger={<></>}>
            {loading && (
              <div className="flex flex-col items-center gap-4 p-4">
                <DaLoader />
                <p>Please wait while we are authenticating with Github...</p>
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center gap-4 p-4">
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && access && (
              <FormSubmitIssue
                user={user}
                api={apiDetails}
                refetch={refetchCurrIssue}
                onClose={async () => {
                  popupSubmitIssueState[1](false)
                }}
                access={access}
              />
            )}
          </DaPopup>
          <div
            className={cn(
              'hidden h-8 items-center rounded-md px-2 xl:flex',
              bgClass,
            )}
          >
            <DaText variant="small-bold" className="uppercase text-da-white">
              {apiDetails.type}
            </DaText>
          </div>
        </div>
      </div>

      <div className="flex h-fit w-full flex-col p-4">
        <DaText variant="regular-bold" className="flex text-da-secondary-500">
          VSS Specification
        </DaText>
        <DaTableProperty
          diffDetail={translatedDiffDetail}
          properties={vssSpecificationProperties}
        />

        {!forceSimpleMode && (
          <DaConsumedPrototypes
            signal={
              ['actuator', 'sensor'].includes(apiDetails.type)
                ? apiDetails?.name || apiDetails?.shortName || ''
                : ''
            }
          />
        )}

        <DaText
          variant="regular-bold"
          className="flex pt-4 text-da-secondary-500"
        >
          Implementation
        </DaText>
        <DaTableProperty properties={implementationProperties} />
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
