import { TbSquare, TbSquareCheck } from "react-icons/tb";

interface CustomCheckBoxProps {
    isChecked: boolean;
    onToggle: (value: boolean) => void;
    label: string;
    labelClassName?: string;
    colorVariant?: "gray" | "blue" | "green" | "red" | "yellow";
    strokeWidth?: number;
    iconClassName?: string;
}

const CustomCheckBox = ({
    isChecked,
    onToggle,
    label,
    colorVariant = "gray",
    strokeWidth = 1.6,
    iconClassName = "w-5 h-5",
    labelClassName,
}: CustomCheckBoxProps) => {
    const getColorClass = () =>
        isChecked
            ? {
                  gray: "text-gray-600",
                  blue: "text-aiot-blue",
                  green: "text-green-500",
                  red: "text-red-500",
                  yellow: "text-yellow-500",
              }[colorVariant]
            : "text-gray-600";

    return (
        <div
            className={`flex items-center text-center mt-2 select-none cursor-pointer ${getColorClass()}`}
            onClick={() => onToggle(!isChecked)}
        >
            {isChecked ? (
                <TbSquareCheck className={`${iconClassName}`} style={{ strokeWidth: strokeWidth }} />
            ) : (
                <TbSquare className={`${iconClassName}`} style={{ strokeWidth: strokeWidth }} />
            )}
            <div className={`ml-1 text-sm text-gray-600 ${labelClassName}`}>{label}</div>
        </div>
    );
};

export default CustomCheckBox;
