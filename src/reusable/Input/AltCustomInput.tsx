import { useState, useEffect, useRef } from "react";
import { IconType } from "react-icons";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    // Detach state and setState here to allow for custom state management
    value: string | number | undefined;
    setValue: (s: string) => void;
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
    iconClass?: string;
    defaultRows?: number;
}

const AltCustomInput = ({
    value,
    setValue,
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
    iconClass = "w-4 h-4",
    defaultRows = 1,
    ...props
}: InputProps) => {
    const [focused, setFocused] = useState(false);
    const selfManaged = useState(defaultValue);
    const searchState = ([value, setValue] as [string, (s: string) => void]) ?? selfManaged;

    const isTextarea = form === "textarea";
    const containerClasses = `flex w-full text-base pl-3 py-2 border bg-transparent rounded transition items-center group ${
        focused ? "border-gray-400 text-gray-800" : "text-gray-600 border-gray-200"
    } 
    ${containerClassName || ""} ${disabled ? "opacity-50 pointer-events-none" : ""} ${isTextarea ? "h-auto" : ""}`;

    const inputClasses = `flex w-full text-base outline-0 placeholder:select-none bg-transparent resize-none scroll-gray ${
        className || ""
    }`;
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Adjust height of textarea
    useEffect(() => {
        if (isTextarea && textareaRef.current) {
            const textarea = textareaRef.current;
            // Reset the height to 'auto' to get the correct scroll height
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
            // Set a maximum height for the scrollbar to appear
            textarea.style.maxHeight = "7rem"; // Adjust as needed
        }
    }, [searchState[0], isTextarea]);

    return (
        <div className={containerClasses}>
            {Icon && iconBefore && (
                <Icon className={`flex group-focus-within:text-aiot-blue text-gray-500 transition mx-2 ${iconClass}`} />
            )}
            <div className="flex w-full">
                {isTextarea ? (
                    <textarea
                        ref={textareaRef}
                        value={searchState[0]}
                        rows={defaultRows}
                        disabled={disabled}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        className={inputClasses}
                        placeholder={placeholder}
                        onChange={(event) => searchState[1](event.target.value)}
                    />
                ) : (
                    <input
                        ref={inputRef}
                        value={searchState[0]}
                        disabled={disabled}
                        type={type}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        className={inputClasses}
                        placeholder={placeholder}
                        onChange={(event) => searchState[1](event.target.value)}
                        {...props}
                    />
                )}
            </div>
            {Icon && !iconBefore && (
                <Icon
                    className={`flex w-5 h-5 group-focus-within:text-aiot-blue text-gray-500 transition mx-2 ${iconClass}`}
                    onClick={IconOnClick}
                />
            )}
        </div>
    );
};

export default AltCustomInput;
