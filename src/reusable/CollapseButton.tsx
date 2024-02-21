import { ReactNode } from "react";
import { TbSquareChevronRight, TbSquareChevronDown } from "react-icons/tb";

interface CollapseButtonProps {
    isExpanded: boolean;
    expandedIcon?: ReactNode;
    collapsedIcon?: ReactNode;
    className?: string;
    expandedClass?: string;
    collapsedClass?: string;
    children?: ReactNode;
    label?: string;
    labelClass?: string;
    onClick: () => void;
}

const CollapseButton: React.FC<CollapseButtonProps> = ({
    isExpanded = true,
    className = "text-gray-500", // Default style
    expandedClass = "", // Default style for expanded state
    collapsedClass = "", // Default style for collapsed state
    expandedIcon = <TbSquareChevronDown />, // Default expanded icon
    collapsedIcon = <TbSquareChevronRight />, // Default collapsed icon
    label = "",
    labelClass = "font-semibold ml-1 text-gray-700",
    children,
    onClick,
}) => {
    const icon = isExpanded ? expandedIcon : collapsedIcon;
    const stateClass = isExpanded ? expandedClass : collapsedClass;

    return (
        <button className={`collapse-btn flex items-center ${className} ${stateClass}`} onClick={onClick}>
            {icon}
            {label && <div className={`collapse-btn-label ${labelClass}`}>{label}</div>}
            {children}
        </button>
    );
};

export default CollapseButton;
