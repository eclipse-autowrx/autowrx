import { useState, FC, useEffect } from "react";

interface BlockProps {
  title: string;
  variant?: "solid" | "outline";
  height?: string;
  className?: string;
}

const Block = ({ title, variant, height, className }: BlockProps) => {
  const [variantStyle, setVariantStyle] = useState<string>("");
  useEffect(() => {
    let style = "px-4 py-2 flex items-center justify-center text-bold";
    switch (variant) {
      case "outline":
        style += " text-primary-700 border border-primary";
        break;
      default:
        style += " text-white bg-primary";
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
