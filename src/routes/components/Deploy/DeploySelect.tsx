import { useEffect, useState, useRef } from "react";
import { TbChevronDown, TbExclamationMark } from "react-icons/tb";
import GeneralTooltip from "../../../reusable/ReportTools/GeneralTooltip";
import LoadingPage from "../LoadingPage";
type Value = string | number | undefined;

interface DeploySelectProps {
    options: Array<{
        value: Value;
        label: React.ReactNode;
        icon?: React.ReactNode;
        containerStyle?: string;
        isCompatible?: boolean;
        is_online?: boolean;
        tooltip?: string;
    }>;
    selectedValue: Value;
    onValueChange?: (value: Value) => void;
    customStyle?: string; // Main container style
    customDropdownContainerStyle?: string; // Dropdown style
    customDropdownItemStyle?: string; // Each option style
    hideIndicator?: boolean; // Hide the chevron down indicator
    customCssStyle?: React.CSSProperties;
    fullWidth?: boolean;
    isReadOnly?: boolean;
}

const DeploySelect: React.FC<DeploySelectProps> = ({
    options,
    selectedValue,
    onValueChange,
    customStyle,
    customDropdownContainerStyle,
    customDropdownItemStyle,
    hideIndicator,
    customCssStyle,
    fullWidth = false,
    isReadOnly = false,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const handleButtonClick = () => {
        setIsExpanded(!isExpanded);
    };

    const handleOptionClick = (value: Value) => {
        onValueChange?.(value); // The '?.' ensures it won't error if onValueChange is undefined
        setIsExpanded(false);
    };

    const PLACEHOLDER_LABEL = "Select an option"; // Introduced a placeholder label

    const selectedOption = options.find((opt) => opt.value === selectedValue);
    const selectedLabel = selectedOption?.label || PLACEHOLDER_LABEL;
    const selectedOptionContainerStyle = selectedOption?.containerStyle || "";
    const hasIcon = options.some((opt) => !!opt.icon);
    const chevronClass = hideIndicator ? "opacity-0 group-hover:opacity-100" : "";
    const effectiveStyle = selectedOptionContainerStyle || customStyle;
    const defaultCssStyle: React.CSSProperties = {
        minWidth: "7.5rem",
        ...customCssStyle, // This will override default values if any property conflicts
    };

    const widthClass = fullWidth ? "w-full" : "w-max"; // If fullWidth is true, apply w-full class
    const isLoading = selectedOption?.label;

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if the click was on the trigger div.
            const clickedOnTriggerDiv =
                dropdownRef.current &&
                dropdownRef.current.previousSibling &&
                dropdownRef.current.previousSibling.contains(event.target);

            // Check if the click was outside the dropdown.
            const clickedOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target);

            // If the dropdown is open and the click was outside both the dropdown and the trigger div, close it.
            if (isExpanded && clickedOutsideDropdown && !clickedOnTriggerDiv) {
                setIsExpanded(false);
            }
        };

        document.body.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.body.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isExpanded]);

    if (!isLoading) {
        return (
            <div className="flex w-full h-fit justify-center shrink-0">
                <LoadingPage showText={false} size={15} fullScreen={false} />
                <div className="flex w-fit text-[0.6rem] shrink-0 ml-1 text-gray-600">Fetching</div>
            </div>
        );
    }

    return (
        <div className={`${widthClass} ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}>
            <div
                style={customCssStyle}
                className={`group w-full text-gray-600 flex items-center justify-between rounded shadow focus:outline-none focus:ring-0 ${
                    hasIcon ? "" : ""
                }  ${effectiveStyle} ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
                onClick={handleButtonClick}
            >
                <div className="flex w-full items-center">
                    {selectedOption?.icon && <div className="flex-shrink-0 ml-1 mr-1">{selectedOption.icon}</div>}
                    <div className="flex items-center justify-between w-full">
                        <div className="overflow-hidden mr-1">
                            <span className="block truncate whitespace-nowrap select-none">{selectedLabel}</span>
                        </div>
                        {!isReadOnly && isLoading && (
                            <TbChevronDown
                                className={`flex-shrink-0 mr-1${chevronClass} ${isExpanded ? "text-aiot-blue" : ""}`}
                            />
                        )}
                    </div>
                </div>
            </div>

            {isExpanded && !isReadOnly && (
                <div
                    ref={dropdownRef}
                    style={{ minWidth: 100, zIndex: 10000 }}
                    className={`w-full top-full right-0 mt-1 bg-white border rounded shadow text-gray-600 overflow-y-auto max-h-32
                            ${customDropdownContainerStyle} scroll-gray`}
                >
                    {options &&
                        options.map((opt, index, array) => {
                            let itemClasses = "";
                            if (index === 0) {
                                itemClasses = "rounded-t";
                            } else if (index === array.length - 1) {
                                itemClasses = "rounded-b border-none";
                            }
                            const inCompatible = !opt.isCompatible || !opt.is_online;
                            const incompatibleStyle = inCompatible ? "opacity-50" : "";
                            return (
                                <GeneralTooltip className="" content={opt.tooltip} delay={400} key={opt.value}>
                                    <div
                                        className={`flex items-center w-full px-2 py-1 pl-1 hover:bg-gray-100 cursor-pointer border-b ${customDropdownItemStyle} ${
                                            hasIcon ? "" : ""
                                        } ${itemClasses} ${inCompatible ? "hover:bg-white" : ""}`}
                                        onClick={() => {
                                            if (!inCompatible) {
                                                handleOptionClick(opt.value);
                                            }
                                        }}
                                    >
                                        {opt.icon && (
                                            <span className={`mr-1 select-none ${incompatibleStyle}`}>{opt.icon}</span>
                                        )}
                                        <div className={`flex ${incompatibleStyle} grow overflow-hidden`}>
                                            <span className="block truncate whitespace-nowrap select-none">
                                                {opt.label}
                                            </span>
                                        </div>
                                        {opt.isCompatible === false && (
                                            <TbExclamationMark className="w-4 ml-1 h-auto text-red-500" />
                                        )}
                                    </div>
                                </GeneralTooltip>
                            );
                        })}
                </div>
            )}
        </div>
    );
};

export default DeploySelect;
