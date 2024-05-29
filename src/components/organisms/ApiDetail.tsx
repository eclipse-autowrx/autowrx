import { DaTableProperty } from "../molecules/DaTableProperty";

interface ApiDetailProps {
  apiDetails: any;
}

const OneOfFromName = (list: string[], name: string) => {
  return list[name.length % list.length];
};

const ApiDetail = ({ apiDetails }: ApiDetailProps) => {
  const properties = [
    { property: "API", value: apiDetails.api },
    { property: "UUID", value: apiDetails.uuid },
    { property: "Type", value: apiDetails.type },
    { property: "Description", value: apiDetails.description },
    apiDetails.datatype && {
      property: "Data Type",
      value: apiDetails.datatype,
    },
    apiDetails.unit && { property: "Unit", value: apiDetails.unit },
    apiDetails.max !== undefined && {
      property: "Max",
      value: apiDetails.max.toString(),
    },
    apiDetails.min !== undefined && {
      property: "Min",
      value: apiDetails.min.toString(),
    },
    apiDetails.allowed && {
      property: "Allowed Values",
      value: apiDetails.allowed.join(", "),
    },
    apiDetails.comment && { property: "Comment", value: apiDetails.comment },
    {
      property: "Implementation Status",
      value: OneOfFromName(
        ["Wishlist", "VSS Spec", "HW Prototype", "Production ready"],
        apiDetails.api
      ),
    },
    {
      property: "API Lifecycle Status",
      value: OneOfFromName(
        [
          "Proposal: Proposed new API",
          "Validated: Has at least one valid client use case / example prototype",
          "Committed: Server implementation has been committed for next release",
          "Available: Server implementation is available",
        ],
        apiDetails.api
      ),
    },
    {
      property: "API Standardization",
      value: OneOfFromName(
        [
          "Undefined",
          "Proprietary: Proprietary API definition (OEM only)",
          "Proposed for standardization: Formal proposal to API standards organization, e.g. COVESA",
          "Standardized: Proposal has been accepted",
        ],
        apiDetails.api
      ),
    },
    {
      property: "API Visibility",
      value: OneOfFromName(
        [
          "Internal: This API is only accessible for apps provided by the OEM",
          "Partner: This API is only available to the OEM as well as selected development partners",
          "Open AppStore: This API is available to any vehicle AppStore developer",
        ],
        apiDetails.api
      ),
    },
  ].filter(Boolean);

  return (
    <div className="bg-white">
      <DaTableProperty properties={properties} maxWidth="700px" />
    </div>
  );
};

export default ApiDetail;
