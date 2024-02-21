import clsx from "clsx";
import { IconType } from "react-icons";

interface ControlButtonProps {
    Icon: IconType;
    text: string;
    onClick?: () => void;
    disabled?: boolean;
}

const ControlButton = ({ Icon, text, onClick, disabled = false }: ControlButtonProps) => {
    return (
        <div
            className={clsx(
                "flex flex-col cursor-pointer items-center hover:text-gray-400 transition px-5",
                disabled && "text-gray-700 pointer-events-none"
            )}
            onClick={onClick}
        >
            <Icon />
            <div className="text-sm mt-1">{text}</div>
        </div>
    );
};

export default ControlButton;
