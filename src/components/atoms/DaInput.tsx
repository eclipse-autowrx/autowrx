import * as React from "react";

import { cn } from "@/lib/utils";
import { DaText } from "./DaText";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const DaInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, type, ...props }, ref) => {
    return (
      <div className="block">
        {label && <DaText className="text-da-gray-dark">{label}</DaText>}
        <input
          type={type}
          className={cn(
            ` flex px-3 py-1 h-9 w-full rounded-md border border-da-gray-dark bg-da-white  
                    da-txt-regular shadow-sm transition-colors 
                    placeholder:text-light-gray focus-visible:outline-none 
                    focus-visible:ring-1 focus-visible:ring-ring 
                    disabled:cursor-not-allowed disabled:opacity-50`,
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
DaInput.displayName = "Input";

export { DaInput };
