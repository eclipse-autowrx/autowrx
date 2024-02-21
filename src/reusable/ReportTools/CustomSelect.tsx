import clsx from "clsx";
import { useState, useEffect, useRef } from "react";
import { TbChevronDown } from "react-icons/tb";

type Value = string | number | undefined;

interface CustomSelectProps {
    options: Array<{ value: Value; label: string; icon?: React.ReactNode; containerStyle?: string; tooltip?: string }>;
    selectedValue: Value;
    onValueChange?: (value: Value) => void;
    customStyle?: string; // Main container style
    customContainerClassName?: string; // Main container class
    customDropdownContainerStyle?: string; // Dropdown style
    customDropdownItemStyle?: string; // Each option style
    hideIndicator?: boolean; // Hide the chevron down indicator
    customCssStyle?: React.CSSProperties;
    fullWidth?: boolean;
    isReadOnly?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    selectedValue,
    onValueChange,
    customStyle,
    customContainerClassName,
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

    return (
        <div className={`relative ${widthClass} ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}>
            <div
                style={customCssStyle}
                className={clsx(
                    `group text-gray-600 flex items-center justify-between rounded shadow focus:outline-none focus:ring-0 ${
                        hasIcon ? "" : ""
                    } ${effectiveStyle} ${widthClass} ${isReadOnly ? "cursor-default" : "cursor-pointer"}`,
                    customContainerClassName
                )}
                onClick={handleButtonClick}
            >
                <div className="flex w-full items-center">
                    {selectedOption?.icon && <span className="mr-2 ml-1">{selectedOption.icon}</span>}
                    <span className="ml-1">{selectedLabel}</span>
                </div>
                {!isReadOnly && <TbChevronDown className={`ml-2 mr-1${chevronClass}`} />}
            </div>

            {isExpanded && !isReadOnly && (
                <div
                    ref={dropdownRef}
                    style={{ minWidth: "1rem", zIndex: 10000 }}
                    className={`absolute w-full top-full right-0 mt-1 bg-white border rounded shadow text-gray-600 ${customDropdownContainerStyle}`}
                >
                    {options.map((opt, index, array) => {
                        let itemClasses = "";
                        if (index === 0) {
                            itemClasses = "rounded-t"; // Top rounded for the first item
                        } else if (index === array.length - 1) {
                            itemClasses = "rounded-b border-none"; // Bottom rounded for the last item
                        }
                        return (
                            <div
                                key={opt.value}
                                className={`flex items-center w-full px-1 py-1 pl-2 hover:bg-gray-100 cursor-pointer border-b ${customDropdownItemStyle} ${
                                    hasIcon ? "" : ""
                                } ${itemClasses}`}
                                onClick={() => handleOptionClick(opt.value)}
                                title={opt.tooltip}
                            >
                                {opt.icon && <span className="mr-2">{opt.icon}</span>}
                                {opt.label}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
