import { DaTableProperty } from "../molecules/DaTableProperty";

interface ApiDetailProps {
  apiDetails: any;
}

const ApiDetail = ({ apiDetails }: ApiDetailProps) => {
  const properties = [
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
  ].filter(Boolean);

  return (
    <div className="p-4 bg-white shadow rounded">
      <DaTableProperty properties={properties} maxWidth="700px" />
    </div>
  );
};

export default ApiDetail;
