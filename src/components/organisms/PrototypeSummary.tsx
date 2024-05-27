import { DaText } from "../atoms/DaText";
import { DaImage } from "../atoms/DaImage";
import { DaTag } from "../atoms/DaTag";
import { DaTableProperty } from "../molecules/DaTableProperty";
import { DaAvatar } from "../atoms/DaAvatar";
import { DaButton } from "../atoms/DaButton";

interface PrototypeSummaryProps {
  prototypeName: string;
  prototypeAuthorName: string;
  prototypeTags: string[];
  prototypeProperties: { property: string; value: string }[];
  prototypeImageUrl: string;
  prototypeAuthorAvatarUrl: string;
}

const PrototypeSummary = ({
  prototypeName,
  prototypeAuthorName,
  prototypeTags,
  prototypeProperties,
  prototypeImageUrl,
  prototypeAuthorAvatarUrl,
}: PrototypeSummaryProps) => {
  return (
    <div className="border rounded-lg p-4 w-full">
      <DaImage src={prototypeImageUrl} className="w-full" />
      <div className="flex justify-between items-center mt-4">
        <DaText variant="huge-bold">{prototypeName}</DaText>
        <DaButton variant="solid" className="text-sm">
          Open
        </DaButton>
      </div>
      <div className="flex items-center pt-6">
        <DaAvatar
          src={prototypeAuthorAvatarUrl}
          alt="Jame Bond"
          className="mr-2 w-7 h-7"
        />
        <DaText>{prototypeAuthorName}</DaText>
      </div>
      <div className="flex flex-wrap pt-6 pb-2">
        {prototypeTags.map((tag) => (
          <DaTag className="mr-2 mb-2">{tag}</DaTag>
        ))}
      </div>
      <DaTableProperty properties={prototypeProperties} maxWidth="500px" />
    </div>
  );
};

export default PrototypeSummary;
