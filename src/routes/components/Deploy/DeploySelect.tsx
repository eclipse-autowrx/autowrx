import { useEffect, useState, useRef } from "react";
import { TbCheck, TbChevronDown, TbExclamationMark, TbLoader2 } from "react-icons/tb";
import GeneralTooltip from "../../../reusable/ReportTools/GeneralTooltip";
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
    hideIndicator?: boolean; // Hide the chevron down indicator
    fullWidth?: boolean;
    isReadOnly?: boolean;
}

const DeploySelect: React.FC<DeploySelectProps> = ({
    options,
    selectedValue,
    onValueChange,
    hideIndicator,
    fullWidth = false,
    isReadOnly = false,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFetchingTimeout, setIsFetchingTimeout] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleButtonClick = () => {
        setIsExpanded(!isExpanded);
    };

    const handleOptionClick = (value: Value) => {
        onValueChange?.(value); // The '?.' ensures it won't error if onValueChange is undefined
        setIsExpanded(false);
    };

    useEffect(() => {
        const timeoutFetching = setTimeout(() => {
            setIsFetchingTimeout(true);
        }, 10000); // Timeout after 10 seconds

        return () => clearTimeout(timeoutFetching);
    }, []);

    const PLACEHOLDER_LABEL = "Select an option"; // Introduced a placeholder label
    const selectedOption = options.find((opt) => opt.value === selectedValue);
    const selectedLabel = selectedOption?.label || PLACEHOLDER_LABEL;
    const hasIcon = options.some((opt) => !!opt.icon);
    const chevronClass = hideIndicator ? "opacity-0 group-hover:opacity-100" : "w-4 h-4";

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
                <div className="flex w-fit shrink-0 text-gray-600 items-center mt-1">
                    {!isFetchingTimeout && <TbLoader2 className="animate-spin mr-1 w-3 h-3 text-aiot-blue"></TbLoader2>}
                    {isFetchingTimeout ? "Not available" : "Fetching"}
                </div>
            </div>
        );
    }

    return (
        <div className={`${widthClass} ${isReadOnly ? "cursor-default" : "cursor-pointer"} relative`}>
            <div
                className={`group w-full text-gray-600 flex items-center justify-between h-7 min-w-[200px] text-xs rounded border border-gray-200 hover:border-gray-300 bg-white shadow-sm ${
                    hasIcon ? "" : ""
                } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
                onClick={handleButtonClick}
            >
                <div className="flex w-full items-center ">
                    {selectedOption?.icon && <div className="flex-shrink-0 ml-1 mr-1">{selectedOption.icon}</div>}
                    <div className="flex items-center justify-between w-full">
                        <div className="overflow-hidden mr-1">
                            <span className="block truncate whitespace-nowrap select-none">{selectedLabel}</span>
                        </div>
                        {!isReadOnly && isLoading && (
                            <TbChevronDown
                                className={`flex-shrink-0 mr-1 ${chevronClass} ${isExpanded ? "text-aiot-blue" : ""}`}
                            />
                        )}
                    </div>
                </div>
            </div>

            {isExpanded && !isReadOnly && (
                <div
                    ref={dropdownRef}
                    style={{ minWidth: 100, zIndex: 10000 }}
                    className={`absolute top-8 left-0 flex flex-col w-full p-0.5 bg-white border border-gray-200 rounded shadow-sm text-xs text-gray-600 overflow-y-auto max-h-32 scroll-gray-small `}
                >
                    {options &&
                        options.map((opt, index, array) => {
                            const inCompatible = !opt.isCompatible || !opt.is_online;
                            const incompatibleStyle = inCompatible ? "opacity-70" : "";
                            return (
                                <GeneralTooltip
                                    className="py-1"
                                    content={opt.tooltip}
                                    delay={300}
                                    key={opt.value}
                                    space={8}
                                >
                                    <div
                                        className={`flex py-[1px] rounded items-center cursor-pointer ${
                                            inCompatible ? "hover:bg-white" : ""
                                        }`}
                                        onClick={() => {
                                            if (!inCompatible) {
                                                handleOptionClick(opt.value);
                                            }
                                        }}
                                    >
                                        <div
                                            className={`flex p-1 w-full rounded items-center justify-center overflow-x-hidden hover:bg-gray-100 ${
                                                opt.label === selectedLabel ? "bg-gray-100" : ""
                                            }`}
                                        >
                                            {opt.icon && (
                                                <span className={`mr-1 select-none ${incompatibleStyle}`}>
                                                    {opt.icon}
                                                </span>
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
