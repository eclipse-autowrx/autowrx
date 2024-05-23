import { DaText } from "../atoms/DaText";
import { DaButton } from "../atoms/DaButton";

interface CardIntroProps {
  title: string;
  content: string;
  buttonText: string;
  maxWidth?: string;
}

const DaCardIntroBig = ({
  title,
  content,
  buttonText,
  maxWidth = "320px",
}: CardIntroProps) => {
  return (
    <div
      className={`flex flex-col p-4 w-full bg-da-white rounded-lg shadow-md space-y-2 border border-da-gray-dark text-da-gray-dark items-center justify-between`}
      style={{ maxWidth: maxWidth, maxHeight: maxWidth }}
    >
      <div className="flex flex-col items-center">
        <DaText variant="title">{title}</DaText>
        <DaText variant="regular" className="text-center">
          {content}
        </DaText>
      </div>
      <DaButton variant="outline-nocolor" className="flex w-fit !mt-12">
        {buttonText}
      </DaButton>
    </div>
  );
};

export { DaCardIntroBig };
