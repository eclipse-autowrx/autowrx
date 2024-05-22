import { FC } from "react";

interface Btn2Props {
  variant?: string;
  size?: string;
  className?: string;
  children?: React.ReactNode;
}

const DaButton2: FC<Btn2Props> = ({
  children,
  variant = "default",
  size = "default",
  className = "",
}) => {
  return (
    <button
      className={`da-btn da-btn-${variant} da-btn-sz-${size} ${className}`}
    >
      {children}
    </button>
  );
};

export { DaButton2 };
