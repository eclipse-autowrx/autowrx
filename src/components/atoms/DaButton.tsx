import * as React from "react";
import { cn } from "@/lib/utils";


interface DaButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "solid"  | "outline" | "outline-nocolor" | "gradient" | "secondary" | "destructive";
  size?: "sm" | "md" | "lg";
}

const DaButton = React.forwardRef<HTMLButtonElement, DaButtonProps>(
  ({ className, variant="solid", size="md", ...props }, ref) => {
    return (
      <button
        className={cn(`da-btn`, `da-btn-${variant}`, `da-btn-${size}`, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
DaButton.displayName = "DaButton";

export { DaButton };
