import { DaText } from "../atoms/DaText";

interface DaApiListItemProps {
  api: string;
  type: string;
}

const DaApiListItem = ({ api, type }: DaApiListItemProps) => {
  return (
    <div
      className="grid grid-cols-4 gap-4 py-2 text-da-gray-dark"
      style={{ minWidth: "500px" }}
    >
      <div className="col-span-3">
        <DaText variant="regular">{api}</DaText>
      </div>
      <div className="col-span-1">
        <DaText variant="regular-bold">{type}</DaText>
      </div>
    </div>
  );
};

interface DaApiListProps {
  apis: { api: string; type: string }[];
}

export const DaApiList = ({ apis }: DaApiListProps) => {
  return (
    <div className="p-4 border border-da-gray-dark rounded-lg shadow-md bg-da-white">
      {apis.map((item, index) => (
        <DaApiListItem key={index} api={item.api} type={item.type} />
      ))}
    </div>
  );
};
