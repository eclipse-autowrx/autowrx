import * as React from "react";
import { DaImage } from "../atoms/DaImage";
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
      className="flex flex-col items-center p-4 border border-da-gray-dark rounded-lg shadow-md bg-da-white space-y-2 text-da-gray-dark overflow-hidden"
      style={{ maxWidth: maxWidth, minWidth: "300px" }}
    >
      <DaImage
        src={imageUrl}
        alt="Image"
        className="w-full h-auto rounded-lg"
        ratio={16 / 9}
        maxWidth={maxWidth}
      />
      <div className="flex flex-col items-start w-full space-y-2">
        <DaText variant="title">{title}</DaText>
        <DaText variant="regular" className="line-clamp-2">
          {content}
        </DaText>
      </div>
    </div>
  );
};

export { DaItemVerticalStandard };
