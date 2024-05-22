import { useState, FC, useEffect } from "react";

interface BlockProps {
  title: string;
  variant?: "solid" | "outline";
  height?: string;
  className?: string;
}

const Block: FC<BlockProps> = ({
  title,
  variant = "solid",
  height = "200px",
  className = "",
}) => {
  const [variantStyle, setVariantStyle] = useState<string>("");
  useEffect(() => {
    let style = "px-4 py-2 flex items-center justify-center text-bold";
    switch (variant) {
      case "outline":
        style += " text-primary-700 border border-primary-500";
        break;
      default:
        style += " text-white bg-primary-500";
    }
    setVariantStyle(style);
  }, [variant]);

  return (
    <div className={`${variantStyle} ${className}`} style={{ height: height }}>
      {title}
    </div>
  );
};

export { Block };
