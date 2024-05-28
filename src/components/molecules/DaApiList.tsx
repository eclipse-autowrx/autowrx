import { DaText } from "../atoms/DaText";

interface DaApiListItemProps {
  api: string;
  type: string;
  onClick: () => void;
  isSelected: boolean;
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

const DaApiListItem = ({
  api,
  type,
  onClick,
  isSelected,
}: DaApiListItemProps) => {
  return (
    <div
      className={`grid grid-cols-4 gap-4 py-1.5 text-da-gray-medium cursor-pointer hover:bg-da-gray-light items-center justify-center px-2 rounded ${
        isSelected ? "bg-da-gray-light" : ""
      }`}
      onClick={onClick}
    >
      <div className="col-span-3 cursor-pointer">
        <DaText variant="regular" className="cursor-pointer !text-xs">
          {api}
        </DaText>
      </div>
      <div className="col-span-1 flex justify-end cursor-pointer">
        <DaText
          variant="regular-bold"
          className={
            getTypeClassName(type) +
            " uppercase !text-[10px] !font-medium cursor-pointer"
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
  selectedApi?: { api: string; type: string; details: any } | null;
  maxWidth?: string;
}

const DaApiList = ({
  apis,
  onApiClick,
  selectedApi,
  maxWidth = "1500px",
}: DaApiListProps) => {
  return (
    <div
      className="flex flex-col w-full h-full overflow-y-auto bg-da-white"
      style={{ maxWidth: maxWidth }}
    >
      {apis.map((item, index) => (
        <DaApiListItem
          key={index}
          api={item.api}
          type={item.type}
          onClick={() => onApiClick(item.details)}
          isSelected={selectedApi?.api === item.api}
        />
      ))}
    </div>
  );
};

export default DaApiList;
