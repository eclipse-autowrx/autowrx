import React, { useState } from "react";
import { IconType } from "react-icons";

import { cn } from "@/lib/utils";
import { DaText } from "./DaText";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  inputClassName?: string;
  Icon?: IconType;
  iconBefore?: boolean;
  IconOnClick?: () => void;
  iconSize?: number;
}

const DaInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputClassName, label, type,
    Icon,
    iconBefore = false,
    IconOnClick,
    iconSize,
    ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
      <div className={cn("block", className)}>
        {label && <DaText className={focused?`text-da-primary-500`:`text-da-gray-dark`}>{label}</DaText>}
        <div className={cn(
          `h-10 py-1 flex items-center rounded-md border bg-da-white 
          da-txt-regular shadow-sm transition-colors text-da-gray-gray`,
          !focused && "border-da-gray-light",
          focused && "border-da-primary-500 text-da-primary-500",)}
        >
          {Icon && iconBefore && (
            <Icon
              size={iconSize || 20}
              className="mx-2"
              onClick={IconOnClick}
            />
          )}

          <input
            type={type}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={cn(
              `grow flex px-2 py-1 h-8 w-full
                placeholder:text-da-light-gray
                focus-visible:ring-0 focus-visible:ring-0 focus-visible:outline-none
                disabled:cursor-not-allowed`,
              inputClassName
            )}
            ref={ref}
            {...props}
          />

          {Icon && !iconBefore && (
            <Icon
              size={iconSize || 20}
              className="mx-2"
              onClick={IconOnClick}
            />
          )}
        </div>
      </div>
    );
  }
);
DaInput.displayName = "Input";

export { DaInput };
