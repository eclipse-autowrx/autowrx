import { DaText } from "../atoms/DaText";

interface CardIntroProps {
  title: string;
  content: string;
  maxWidth?: string;
}

const DaCardIntro = ({
  title,
  content,
  maxWidth = "320px",
}: CardIntroProps) => {
  return (
    <div
      className={`flex flex-col p-4 w-full bg-da-white rounded-xl shadow-md space-y-2 border border-da-gray-dark text-da-gray-dark`}
      style={{ maxWidth: maxWidth }}
    >
      <DaText variant="title">{title}</DaText>
      <DaText variant="regular">{content}</DaText>
    </div>
  );
};

export { DaCardIntro };
