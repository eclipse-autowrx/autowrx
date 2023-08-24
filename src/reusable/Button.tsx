import clsx from "clsx"
import { ReactNode } from "react"

interface ButtonProps {
    variant?: "neutral" | "success" | "failure" | "alt"
    children: ReactNode
    className?: string
    onClick?: React.MouseEventHandler<HTMLDivElement>
    disabled?: boolean
}

const Button = ({children, className, onClick, variant = "neutral", disabled = false}: ButtonProps) => {
    return (
        <div
        onClick={onClick}
        className={clsx(
            "flex items-center rounded pr-3 pl-3 transition bg-gray-50 border-transparent border-2 text-slate-500 hover:bg-gray-300 select-none cursor-pointer",
            disabled && "opacity-30 pointer-events-none",
            variant === "success" && "bg-emerald-500 text-white hover:bg-emerald-600",
            variant === "failure" && "bg-red-500 text-white hover:bg-red-600",
            variant === "alt" && "bg-aiot-blue text-white hover:bg-aiot-blue hover:opacity-80",
            className
        )}
        >
            {children}
        </div>
    )
}

export default Button