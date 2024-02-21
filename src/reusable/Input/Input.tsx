import clsx from "clsx";
import { useState } from "react";
import { IconType } from "react-icons";

interface InputProps {
    state?: [string, (s: string) => void];
    type?: "text" | "email" | "password";
    form?: "input" | "textarea";
    disabled?: boolean;
    placeholder?: string;
    containerClassName?: string;
    className?: string;

    defaultValue?: string;

    Icon?: IconType;
    iconBefore?: boolean;
    IconOnClick?: () => void;
    iconSize?: number;
    iconColor?: string;
    iconColorOnFocus?: string;
}

const Input = ({
    state,
    type = "text",
    disabled = false,
    placeholder,
    form = "input",
    containerClassName,
    className,

    defaultValue,

    Icon,
    iconBefore = false,
    IconOnClick,
    iconSize,
    iconColor = "#6b7280",
    iconColorOnFocus = "#005072",
}: InputProps) => {
    const [focused, setFocused] = useState(false);
    const selfManaged = useState(defaultValue);
    const searchState = state ?? selfManaged;

    const InputForm = form;

    return (
        <div
            className={clsx(
                "w-full h-10 border rounded p-3 transition inline-flex justify-center items-center",
                !focused && "bg-gray-100",
                focused && "border-gray-400 bg-transparent text-sm text-gray-600 p-3 h-10",
                disabled && "opacity-40",
                containerClassName
            )}
        >
            {Icon && iconBefore && (
                <Icon
                    size={iconSize}
                    color={focused ? iconColorOnFocus : iconColor}
                    className={clsx("w-auto text-gray-400 transition pr-3", focused && "text-aiot-blue")}
                />
            )}
            <InputForm
                value={searchState[0]}
                disabled={disabled}
                type={type}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className={clsx(
                    "flex w-full outline-0 placeholder:select-none pr-2 bg-transparent resize-none",
                    className
                )}
                placeholder={placeholder}
                onChange={(event) => {
                    searchState[1](event.target.value);
                }}
            />
            {Icon && !iconBefore && (
                <Icon
                    size={iconSize}
                    color={iconColor}
                    className={clsx(
                        "w-auto text-gray-400 transition pr-1",
                        focused && "text-aiot-blue",
                        IconOnClick && "cursor-pointer"
                    )}
                    onClick={IconOnClick}
                />
            )}
        </div>
    );
};

export default Input;
