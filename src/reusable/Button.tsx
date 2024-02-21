import { ReactNode, ElementType } from "react";
import { CircularProgress } from "@mui/material";

interface ButtonProps {
    variant?: "neutral" | "success" | "failure" | "alt" | "aiot-gradient" | "white" | "red" | "blue" | "custom";
    children?: ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    disabled?: boolean;
    zIndex?: number;
    icon?: ElementType;
    iconClassName?: string;
    iconStrokeWidth?: number;
    showProgress?: boolean;
    progressSize?: string;
    progressColor?: string;
    progressText?: string;
    ref?: React.Ref<HTMLDivElement>;
}

const Button = ({
    children,
    className,
    onClick,
    variant = "neutral",
    disabled = false,
    zIndex,
    icon: Icon,
    iconClassName,
    iconStrokeWidth = 2,
    showProgress,
    progressSize = "0.8rem",
    progressColor = "white",
    progressText = "",
    ref,
}: ButtonProps) => {
    const baseClasses =
        "flex px-2 py-1 text-sm items-center justify-center rounded transition select-none cursor-pointer";
    const disabledClasses = disabled ? "opacity-30 pointer-events-none" : "";
    const variantClasses = {
        neutral: "border-transparent text-slate-500",
        success: "border-transparent bg-emerald-500 text-white hover:bg-emerald-600 pr-3 pl-3",
        failure: "border-transparent bg-red-500 text-white hover:bg-red-600  pr-3 pl-3",
        alt: "border-transparent bg-aiot-blue text-white hover:bg-aiot-blue hover:opacity-80 pr-3 pl-3",
        "aiot-gradient": "shadow-sm group bg-aiot-gradient-6 text-white hover:opacity-90",
        white: "shadow-sm group bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-200/70 ",
        red: "shadow-sm group bg-red-500 text-white hover:bg-red-400",
        blue: "shadow-sm group bg-aiot-blue text-white hover:bg-aiot-blue/90",
    };

    return (
        <div
            ref={ref}
            style={{ zIndex: zIndex }}
            onClick={onClick}
            className={`${baseClasses} ${disabledClasses} ${variantClasses[variant] || ""} ${className} ${
                showProgress ? "pointer-events-none" : ""
            }`}
        >
            {showProgress ? (
                <div className="flex w-full h-full items-center justify-center">
                    <CircularProgress size={progressSize} style={{ color: progressColor }} />
                    {progressText && <div className="ml-1 text-sm">{progressText}</div>}
                </div>
            ) : (
                <div className={`flex w-full items-center justify-center`}>
                    {Icon && <Icon className={`flex mr-1 ${iconClassName}`} style={{ strokeWidth: iconStrokeWidth }} />}
                    {children}
                </div>
            )}
        </div>
    );
};

export default Button;
