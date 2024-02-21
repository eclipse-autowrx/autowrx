import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { IconType } from "react-icons";
import { BsFilter } from "react-icons/bs";
import { useHover } from "react-use";

type CheckboxOptions = "actuator" | "branch" | "sensor" | "attribute" | "defaultAPI" | "wishlistAPI";

interface CheckboxOption {
    label: string;
    value: CheckboxOptions;
    Icon?: IconType;
    iconBefore?: boolean;
    IconOnClick?: () => void;
}

interface Props {
    options: CheckboxOption[];
    onSelectedOptionsChange?: (selectedOptions: CheckboxOptions[]) => void;
}

const CheckboxDropdown: React.FC<Props> = ({ options, onSelectedOptionsChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    // const [selectedOptions, setSelectedOptions] = useState<CheckboxOptions[]>([]);
    const allOptions: CheckboxOptions[] = ["actuator", "branch", "sensor", "attribute", "defaultAPI", "wishlistAPI"];

    const [selectedOptions, setSelectedOptions] = useState<CheckboxOptions[]>(allOptions);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const activeElement = document.activeElement as HTMLElement;
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("click", handleOutsideClick);

        return () => {
            document.removeEventListener("click", handleOutsideClick);
        };
    }, []);

    useEffect(() => {
        if (onSelectedOptionsChange) {
            onSelectedOptionsChange(selectedOptions);
        }
    }, [selectedOptions]);

    const handleToggleOpen = () => {
        if (!isOpen) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
            if (activeElement?.blur) {
                activeElement.blur();
            }
        }
    };

    const handleOptionClick = (option: CheckboxOption) => {
        // if (option.value === "defaultAPI" || option.value === "wishlistAPI") { // Toggle Wishlist API and Default APIs mutual exclusive
        //   setSelectedOptions((prev) => {
        //     const newOptions = prev.filter(
        //       (value) => value !== "defaultAPI" && value !== "wishlistAPI"
        //     );
        //     if (!prev.includes(option.value)) {
        //       newOptions.push(option.value);
        //     }
        //     return newOptions;
        //   });
        // } else {
        if (selectedOptions.includes(option.value)) {
            setSelectedOptions((prev) => prev.filter((value) => value !== option.value));
        } else {
            setSelectedOptions((prev) => [...prev, option.value]);
        }
        // }
    };

    // useEffect(() => {
    //   console.log("Selected options:", selectedOptions);
    // }, [selectedOptions]);
    return (
        <div className="relative inline-block text-left text-gray-500" ref={dropdownRef}>
            <div>
                <button
                    type="button"
                    className={clsx(
                        "inline-flex items-center justify-center max-w-fit h-10 rounded border border-gray-300 shadow-sm px-6 py-4 text-sm text-gray-600 hover:border-gray-400",
                        !focused && "hover:border-gray-200",
                        focused && "border-gray-500 border-opacity-50 bg-transparent bg-gray-50 h-10"
                    )}
                    id="options-menu"
                    aria-haspopup="true"
                    aria-expanded="true"
                    onClick={handleToggleOpen}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                >
                    <BsFilter className="h-5 w-5 mr-1" />
                    Filter
                </button>
            </div>
            {isOpen && (
                <div className="origin absolute right-0 mt-2  max-w-fit rounded shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                        {options.map((option, index) => (
                            <React.Fragment key={option.value}>
                                {index === 2 && <div className="border-t border-gray-200"></div>}
                                <div className="flex items-center justify-between px-4 py-2 text-sm">
                                    <label
                                        className="inline-flex items-center whitespace-nowrap"
                                        htmlFor={option.value}
                                    >
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-4 w-4 accent-aiot-blue"
                                            checked={selectedOptions.includes(option.value)}
                                            onChange={() => handleOptionClick(option)}
                                            id={option.value}
                                        />
                                        <span className="ml-3">{option.label}</span>
                                    </label>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckboxDropdown;
