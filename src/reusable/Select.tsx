import clsx from "clsx";
import { useEffect, useState } from "react";
import { HiChevronDown } from "react-icons/hi";

interface Option {
    name: string;
    value: string;
    disabled?: boolean;
}

interface SelectProps {
    prefix?: string;
    options: Option[];
    containerClassName?: string;
    state?: [string, React.Dispatch<React.SetStateAction<string>>];
    autoSelectFirst?: boolean;
    disabled?: boolean;
    // Overrides state setting
    onSelect?: (option: string) => void;
    onClick?: () => void;
}

const Select = ({
    prefix = "",
    options,
    containerClassName,
    state,
    autoSelectFirst = true,
    disabled,
    onSelect,
    onClick,
}: SelectProps) => {
    const selfManaged = useState<string>("");
    const [selectedValue, setSelectedValue] = state ?? selfManaged;

    useEffect(() => {
        if (autoSelectFirst) {
            setSelectedValue(options[0].value);
        }
    }, []);

    const selected = options.find((option) => option.value === selectedValue);

    return (
        <div
            className={clsx("flex w-fit relative items-center", !disabled && "cursor-pointer", containerClassName)}
            onClick={onClick}
        >
            <select
                disabled={disabled || !!onClick}
                className={clsx("flex opacity-0 top-0 left-0 w-full h-full absolute", !disabled && "cursor-pointer")}
                value={selectedValue}
                onChange={(e) => {
                    if (typeof onSelect !== "undefined") {
                        onSelect(e.target.value);
                    }
                    setSelectedValue(e.target.value);
                    // console.log(`Selected value: ${e.target.value}`)
                }}
            >
                {!autoSelectFirst && (
                    <option value="" disabled>
                        Select Model
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled ?? false}>
                        {option.name}
                    </option>
                ))}
            </select>
            <div className={clsx("flex", disabled && "opacity-40 cursor-default")}>
                <div className="flex whitespace-nowrap">
                    {prefix}
                    {selected?.name ?? ""}
                </div>
                <HiChevronDown className="ml-1 mt-0.5" fontSize="1.3em" />
            </div>
        </div>
    );
};

export default Select;
