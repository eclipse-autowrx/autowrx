import { DaText } from "../atoms/DaText";

interface DaApiListItemProps {
  api: string;
  type: string;
  onClick: () => void;
}

const getTypeClassName = (type: string) => {
  switch (type) {
    case "branch":
      return "text-purple-500";
    case "actuator":
      return "text-yellow-500";
    case "sensor":
      return "text-emerald-500";
    case "attribute":
      return "text-sky-500";
    default:
      return "text-da-gray-medium";
  }
};

const DaApiListItem = ({ api, type, onClick }: DaApiListItemProps) => {
  return (
    <div
      className="grid grid-cols-4 gap-4 py-2 text-da-gray-medium cursor-pointer"
      onClick={onClick}
    >
      <div className="col-span-3">
        <DaText variant="regular">{api}</DaText>
      </div>
      <div className="col-span-1 flex justify-end">
        <DaText
          variant="regular-bold"
          className={
            getTypeClassName(type) + " uppercase !text-xs !font-medium"
          }
        >
          {type}
        </DaText>
      </div>
    </div>
  );
};

interface DaApiListProps {
  apis: { api: string; type: string; details: any }[];
  onApiClick: (details: any) => void;
  maxWidth?: string;
}

const DaApiList = ({
  apis,
  onApiClick,
  maxWidth = "1200px",
}: DaApiListProps) => {
  return (
    <div className="w-full bg-da-white" style={{ maxWidth: maxWidth }}>
      {apis.map((item, index) => (
        <DaApiListItem
          key={index}
          api={item.api}
          type={item.type}
          onClick={() => onApiClick(item.details)}
        />
      ))}
    </div>
  );
};

export default DaApiList;
