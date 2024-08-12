import { useState, useRef } from 'react'
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
  TbDotsVertical,
  TbExternalLink,
  TbLoader,
  TbTrash,
} from 'react-icons/tb'
import useCurrentExtendedApiIssue from '@/hooks/useCurrentExtendedApiIssue'
import DaMenu from '../atoms/DaMenu'

interface ApiDetailProps {
  apiDetails: any
}

// Randomly select one of the items from the list based on the name length
const OneOfFromName = (list: string[], name: string) => {
  return list[name.length % list.length]
}

const ApiDetail = ({ apiDetails }: ApiDetailProps) => {
  const { bgClass } = getApiTypeClasses(apiDetails.type)
  const { data: model, refetch } = useCurrentModel()
  const [isLoading, setIsLoading] = useState(false)
  const discussionsRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model?.id])
  const popupSubmitIssueState = useState(false)

  const { onTriggerAuth, loading, user, access, error } = useGithubAuth()
  const { data, refetch: refetchCurrIssue } = useCurrentExtendedApiIssue()

  const handleDeleteWishlistApi = async () => {
    if (model && model.custom_apis) {
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
        navigate(`/model/${model.id}/api`)
        //
      } catch (error) {
        setIsLoading(false)
        console.error('Error deleting wishlist API:', error)
      }
    }
  }

  const handleScrollToDiscussions = () => {
    if (discussionsRef.current) {
      discussionsRef.current.scrollIntoView({ behavior: 'smooth' })
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

  return (
    <div className="flex flex-col w-full px-2">
      {/* <DaImage
        src="https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/E-Car_Full_Vehicle.png"
        className="object-cover"
      /> */}
      <DaApiArchitecture apiName={apiDetails.name} />
      <div className="w-full py-2 px-4 bg-da-primary-100 justify-between flex">
        <DaCopy textToCopy={apiDetails.name}>
          <DaText variant="regular-bold" className="text-da-primary-500">
            {apiDetails.name}
          </DaText>
          {apiDetails.isWishlist && (
            <div className=" flex font-bold rounded-full w-4 h-4 ml-2 bg-fuchsia-500 text-da-white items-center justify-center text-[9px]">
              W
            </div>
          )}
        </DaCopy>
        <div className="flex items-center space-x-2">
          {isLoading ? (
            <div className="flex items-center text-da-gray-medium">
              <TbLoader className="text-da-gray-medium w-5 h-5 mr-2 animate animate-spin" />
              <DaText variant="small-bold">Deleting...</DaText>
            </div>
          ) : (
            apiDetails.isWishlist &&
            isAuthorized && (
              <DaMenu
                trigger={
                  <DaButton variant="solid" size="sm">
                    <div className="da-label-small-bold">
                      Wishlist Signal Action
                    </div>
                    <TbChevronDown className="w-4 h-4 ml-1" />
                  </DaButton>
                }
              >
                <div className="flex flex-col da-menu-dropdown">
                  {data ? (
                    <Link
                      to={data.link}
                      className="da-label-small-bold flex items-center gap-2"
                      target="_blank"
                    >
                      <TbExternalLink className="w-5 h-5" />
                      View COVESA Issue
                    </Link>
                  ) : (
                    <DaPopup
                      state={popupSubmitIssueState}
                      trigger={
                        <DaButton
                          variant="plain"
                          size="sm"
                          onClick={() => {
                            popupSubmitIssueState[1](true)
                            onTriggerAuth()
                          }}
                        >
                          <FaGithub className="w-5 h-5 mr-2" />
                          <span className="da-label-small-bold">
                            Propose this Signal to COVESA
                          </span>
                        </DaButton>
                      }
                    >
                      {loading && (
                        <div className="p-4 flex flex-col gap-4 items-center">
                          <DaLoader />
                          <p>
                            Please wait while we are authenticating with
                            Github...
                          </p>
                        </div>
                      )}

                      {!loading && error && (
                        <div className="p-4 flex flex-col gap-4 items-center">
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
                  )}
                  <DaConfirmPopup
                    onConfirm={handleDeleteWishlistApi}
                    label="Are you sure you want to delete this wishlist signal?"
                  >
                    <DaButton
                      variant="destructive"
                      size="sm"
                      className="flex w-full !justify-start"
                    >
                      <TbTrash className="w-5 h-5 mr-2 " />
                      <div className="da-label-small-bold">
                        Delete Wishlist Signal
                      </div>
                    </DaButton>
                  </DaConfirmPopup>
                </div>
              </DaMenu>
            )
          )}
          {/* <DaButton
            variant="plain"
            className="!text-da-primary-500"
            size="sm"
            onClick={handleScrollToDiscussions}
          >
            <TbMessage className="w-5 h-5 mr-2" />{' '}
            <div className="da-label-small-bold">Discussions</div>
          </DaButton> */}
          <div className={cn('flex px-3 rounded-md h-8 items-center', bgClass)}>
            <DaText variant="small-bold" className="text-da-white uppercase">
              {apiDetails.type}
            </DaText>
          </div>
        </div>
      </div>

      <div className="p-4">
        <DaText variant="regular-bold" className="flex text-da-secondary-500">
          VSS Specification
        </DaText>
        <DaTableProperty
          properties={vssSpecificationProperties}
          maxWidth="700px"
        />
        <DaText
          variant="regular-bold"
          className="flex !mt-6 text-da-secondary-500"
        >
          Dependencies
        </DaText>
        <DaTableProperty
          properties={[{ name: 'Used by these vehicle app', value: 'N/A' }]}
          maxWidth="700px"
        />
        <DaText
          variant="regular-bold"
          className="!mt-6 flex text-da-secondary-500"
        >
          Implementation
        </DaText>
        <DaTableProperty
          properties={implementationProperties}
          maxWidth="700px"
        />
      </div>
      {model && model.id && (
        <div ref={discussionsRef}>
          <DaDiscussions
            className="py-4"
            refId={`${model.id}-${apiDetails.name}`}
            refType="api"
          />
        </div>
      )}
    </div>
  )
}

export default ApiDetail
