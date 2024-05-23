import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

interface DaTextProps {
  children?: React.ReactNode;
  className?: string;
  variant?:
    | "regular"
    | "regular-bold"
    | "small"
    | "small-bold"
    | "sub-title"
    | "title"
    | "huge"
    | "huge-bold";
}

const DaText = React.forwardRef<HTMLLabelElement, DaTextProps>(
  ({ className, variant = "regular", ...props }, ref) => {
    return (
      <label
        className={cn(`da-label-${variant}`, className)}
        ref={ref}
        {...props}
      />
    );
  }
);

export { DaText };
