import { DaText } from "../atoms/DaText";
import { DaButton } from "../atoms/DaButton";
import { TbArrowRight } from "react-icons/tb";

interface CardIntroProps {
  title: string;
  content: string;
  buttonText: string;
  maxWidth?: string;
  onClick?: () => void;
}

const DaCardIntroBig = ({
  title,
  content,
  buttonText,
  maxWidth = "320px",
  onClick,
}: CardIntroProps) => {
  return (
    <div
      className={`flex flex-col p-4 w-full bg-da-white rounded-lg border border-da-gray-medium/10 items-center justify-between`}
      style={{ maxWidth: maxWidth, maxHeight: maxWidth, minHeight: "250px" }}
    >
      <div className="flex flex-col items-center">
        <DaText variant="sub-title" className="text-da-gray-medium ">
          {title}
        </DaText>
        <DaText variant="small" className="text-center text-gray-500 mt-2">
          {content}
        </DaText>
      </div>
      <DaButton
        variant="outline-nocolor"
        className="flex w-fit !mt-auto"
        onClick={onClick}
      >
        {buttonText}
        <TbArrowRight className="ml-2 w-4 h-4" />
      </DaButton>
    </div>
  );
};

export { DaCardIntroBig };
