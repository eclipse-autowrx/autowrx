import { DaTableProperty } from '../molecules/DaTableProperty'
import { DaText } from '../atoms/DaText'
import { DaImage } from '../atoms/DaImage'
import { DaCopy } from '../atoms/DaCopy'
import { cn, getApiTypeClasses } from '@/lib/utils'

interface ApiDetailProps {
  apiDetails: any
}

// Randomly select one of the items from the list based on the name length
const OneOfFromName = (list: string[], name: string) => {
  return list[name.length % list.length]
}

const ApiDetail = ({ apiDetails }: ApiDetailProps) => {
  const { bgClass } = getApiTypeClasses(apiDetails.type)
  const implementationProperties = [
    {
      name: 'Implementation Status',
      value: OneOfFromName(
        ['Wishlist', 'VSS Spec', 'HW Prototype', 'Production ready'],
        apiDetails.api,
      ),
    },
    {
      name: 'API Lifecycle Status',
      value: OneOfFromName(
        [
          'Proposal: Proposed new API',
          'Validated: Has at least one valid client use case / example prototype',
          'Committed: Server implementation has been committed for next release',
          'Available: Server implementation is available',
        ],
        apiDetails.api,
      ),
    },
    {
      name: 'API Standardization',
      value: OneOfFromName(
        [
          'Undefined',
          'Proprietary: Proprietary API definition (OEM only)',
          'Proposed for standardization: Formal proposal to API standards organization, e.g. COVESA',
          'Standardized: Proposal has been accepted',
        ],
        apiDetails.api,
      ),
    },
    {
      name: 'API Visibility',
      value: OneOfFromName(
        [
          'Internal: This API is only accessible for apps provided by the OEM',
          'Partner: This API is only available to the OEM as well as selected development partners',
          'Open AppStore: This API is available to any vehicle AppStore developer',
        ],
        apiDetails.api,
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
    { name: 'API', value: apiDetails.api || 'N/A' },
    {
      name: 'UUID',
      value: (apiDetails.details && apiDetails.details.uuid) || 'N/A',
    },
    {
      name: 'Type',
      value: (apiDetails.details && apiDetails.details.type) || 'N/A',
    },
    {
      name: 'Description',
      value: (apiDetails.details && apiDetails.details.description) || 'N/A',
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
    <div>
      <DaImage
        src="https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/E-Car_Full_Vehicle.png"
        className="object-cover"
      />
      <div className="w-full py-2 px-4 bg-da-primary-100 justify-between flex">
        <DaCopy textToCopy={apiDetails.api}>
          <DaText variant="regular-bold" className="text-da-primary-500">
            {apiDetails.api}
          </DaText>
        </DaCopy>
        <div className={cn('px-3 rounded', bgClass)}>
          <DaText variant="small" className="text-da-white uppercase">
            {apiDetails.type}
          </DaText>
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
    </div>
  )
}

export default ApiDetail
