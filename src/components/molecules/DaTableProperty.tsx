import { cn } from "@/lib/utils";
import { DaText } from "../atoms/DaText";

interface DaTablePropertyItemProps {
  property: string;
  value: string;
}

const DaTablePropertyItem = ({ property, value }: DaTablePropertyItemProps) => {
  return (
    <div className="grid grid-cols-4 gap-4 py-2 text-da-gray-medium">
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
  maxWidth?: string;
  className?: string;
}

export const DaTableProperty = ({
  properties,
  maxWidth = "500px",
  className,
}: DaTablePropertyProps) => {
  return (
    <div
      className={cn("rounded-lg bg-da-white", className)}
      style={{ maxWidth: maxWidth }}
    >
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
