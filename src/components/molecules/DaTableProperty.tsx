import { DaText } from "../atoms/DaText";

interface DaTablePropertyItemProps {
  property: string;
  value: string;
}

const DaTablePropertyItem = ({ property, value }: DaTablePropertyItemProps) => {
  return (
    <div
      className="grid grid-cols-4 gap-4 py-2 text-da-gray-dark"
      style={{ minWidth: "500px" }}
    >
      <div className="col-span-1">
        <DaText variant="regular-bold">{property}</DaText>
      </div>
      <div className="col-span-3">
        <DaText variant="regular">{value}</DaText>
      </div>
    </div>
  );
};

interface DaTablePropertyProps {
  properties: { property: string; value: string }[];
}

export const DaTableProperty = ({ properties }: DaTablePropertyProps) => {
  return (
    <div className="p-4 border border-da-gray-dark rounded-lg shadow-md bg-da-white">
      {properties.map((item, index) => (
        <DaTablePropertyItem
          key={index}
          property={item.property}
          value={item.value}
        />
      ))}
    </div>
  );
};
