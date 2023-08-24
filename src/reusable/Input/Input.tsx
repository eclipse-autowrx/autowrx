import clsx from "clsx"
import { useState } from "react"
import { IconType } from "react-icons"

interface InputProps {
    state?: [string, (s: string) => void]
    type?: "text" | "email" | "password"
    form?: "input" | "textarea"
    disabled?: boolean
    placeholder?: string
    containerClassName?: string
    className?: string

    defaultValue?: string
    
    Icon?: IconType
    iconBefore?: boolean
    IconOnClick?: () => void
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
    IconOnClick
}: InputProps) => {
    const [focused, setFocused] = useState(false)
    const selfManaged = useState(defaultValue)
    const searchState = state ?? selfManaged

    const InputForm = form

    return (
        <div
        className={clsx(
        "flex w-full border-2 rounded-sm bg-gray-100 border-transparent p-3 transition",
        focused && "border-aiot-blue bg-transparent",
        disabled && "opacity-40",
        containerClassName
        )}>
            {(Icon && iconBefore) && <Icon className={clsx("h-full w-auto text-gray-400 transition pr-2", focused && "text-aiot-blue")} />}
            <InputForm
            value={searchState[0]}
            disabled={disabled}
            type={type}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={clsx("flex w-full outline-0 placeholder:select-none pr-2 bg-transparent resize-none", className)}
            placeholder={placeholder}
            onChange={((event) => {
                searchState[1](event.target.value)
            })}
            />
            {(Icon && !iconBefore) &&
            <Icon
            className={clsx(
                "h-full w-auto text-gray-400 transition",
                focused && "text-aiot-blue",
                IconOnClick && "cursor-pointer"
            )}
            onClick={IconOnClick}
            />
            }
        </div>
    )
}

export default Input