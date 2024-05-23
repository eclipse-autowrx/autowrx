import * as React from "react";
import { DaImageRatio } from "../atoms/DaImageRatio";
import { DaText } from "../atoms/DaText";
import { DaTag } from "../atoms/DaTag";

interface DaItemVerticalType2Props {
  title: string;
  imageUrl: string;
  tags: string[];
  maxWidth?: string;
}

const DaItemVerticalType2: React.FC<DaItemVerticalType2Props> = ({
  title,
  imageUrl,
  tags,
  maxWidth = "500px",
}) => {
  return (
    <div
      className="flex flex-col w-full p-4 border border-da-gray-dark rounded-lg shadow-md bg-da-white space-y-2 text-da-gray-dark overflow-hidden"
      style={{ maxWidth: maxWidth }}
    >
      <DaText variant="title">{title}</DaText>
      <DaImageRatio
        src={imageUrl}
        alt="Image"
        className="w-full h-auto rounded-lg"
        ratio={16 / 9}
        maxWidth={maxWidth}
      />
      <div className="flex space-x-2 pt-2">
        {tags.map((tag, index) => (
          <DaTag variant={"secondary"} key={index}>
            {tag}
          </DaTag>
        ))}
      </div>
    </div>
  );
};

export { DaItemVerticalType2 };
