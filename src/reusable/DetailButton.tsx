import { FC } from "react";
import { IconType } from "react-icons";

interface DetailButtonProps {
    title: string;
    description: string;
    icon: IconType;
    className?: string;
    accentColor?: string;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const DetailButton: FC<DetailButtonProps> = ({
    title,
    description,
    icon: Icon,
    className,
    accentColor = "black",
    onClick,
}) => {
    return (
        <div onClick={onClick} className={`w-full h-full items-center flex space-x-4 p-4 pl-7 ${className}`}>
            <Icon className="w-7 h-7" style={{ color: accentColor }} />
            <div className="flex flex-col items-start justify-center pl-1">
                <h3 className="font-bold text-current" style={{ color: accentColor }}>
                    {title}
                </h3>
                <p className="text-gray-500 text-sm">{description}</p>
            </div>
        </div>
    );
};

export default DetailButton;
