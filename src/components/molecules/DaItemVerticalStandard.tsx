import * as React from "react";
import { DaImageRatio } from "../atoms/DaImageRatio";
import { DaText } from "../atoms/DaText";

interface DaItemVerticalStandardProps {
  title: string;
  content: string;
  imageUrl: string;
  maxWidth?: string;
}

const DaItemVerticalStandard: React.FC<DaItemVerticalStandardProps> = ({
  title,
  content,
  imageUrl,
  maxWidth = "500px",
}) => {
  return (
    <div
      className="flex w-full flex-col items-center rounded-lg bg-da-white space-y-2 text-da-gray-dark overflow-hidden"
      style={{ maxWidth: maxWidth }}
    >
      <DaImageRatio
        src={imageUrl}
        alt="Image"
        className="w-full h-auto rounded-lg"
        ratio={16 / 9}
        maxWidth={maxWidth}
      />
      <div className="flex flex-col items-start w-full space-y-1">
        <DaText variant="sub-title" className="line-clamp-1">
          {title}
        </DaText>
        <DaText variant="small" className="line-clamp-2 text-da-gray-light">
          {content}
        </DaText>
      </div>
    </div>
  );
};

export { DaItemVerticalStandard };
