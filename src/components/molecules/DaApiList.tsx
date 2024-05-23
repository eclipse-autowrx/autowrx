import { DaText } from "../atoms/DaText";

interface DaApiListItemProps {
  api: string;
  type: string;
}

const DaApiListItem = ({ api, type }: DaApiListItemProps) => {
  return (
    <div className="grid grid-cols-4 gap-4 py-2 text-da-gray-dark">
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
  maxWidth?: string;
}

export const DaApiList = ({ apis, maxWidth = "500px" }: DaApiListProps) => {
  return (
    <div className="p-4 w-full bg-da-white" style={{ maxWidth: maxWidth }}>
      {apis.map((item, index) => (
        <DaApiListItem key={index} api={item.api} type={item.type} />
      ))}
    </div>
  );
};
