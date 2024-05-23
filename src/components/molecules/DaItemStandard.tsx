import * as React from "react";
import { DaImageRatio } from "../atoms/DaImageRatio";
import { DaTag } from "../atoms/DaTag";
import { DaText } from "../atoms/DaText";
import { DaAvatar } from "../atoms/DaAvatar";

interface DaItemStandardProps {
  title: string;
  author: string;
  content: string;
  tags: string[];
  imageUrl: string;
  avatarUrl: string;
  maxWidth?: string;
}

const DaItemStandard: React.FC<DaItemStandardProps> = ({
  title,
  author,
  content,
  tags,
  imageUrl,
  avatarUrl,
  maxWidth = "500px",
}) => {
  return (
    <div
      className="flex p-4 border border-da-gray-dark rounded-lg shadow-md bg-da-white max-w-lg space-x-4 text-da-gray-dark overflow-hidden"
      style={{ maxWidth: maxWidth, minWidth: "300px" }}
    >
      <DaImageRatio
        src={imageUrl}
        alt="Image"
        className="w-full h-full rounded-lg"
        ratio={1 / 1}
        maxWidth={"300px"}
      />

      <div className="flex flex-col justify-between overflow-hidden w-ful">
        <div className="flex flex-col space-y-2">
          <DaText variant="title">{title}</DaText>
          <div className="flex items-center space-x-2">
            <DaAvatar
              src={avatarUrl}
              alt="Author"
              className="w-6 h-6 rounded-full"
            />
            <DaText variant="regular">{author}</DaText>
          </div>
          <DaText variant="regular" className="w-full line-clamp-2">
            {content}
          </DaText>
        </div>
        <div className="flex space-x-2">
          {tags.map((tag, index) => (
            <DaTag key={index}>{tag}</DaTag>
          ))}
        </div>
      </div>
    </div>
  );
};

export { DaItemStandard };
