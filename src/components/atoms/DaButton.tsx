import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva("da-btn", {
  variants: {
    variant: {
      default: "da-btn-default",
      destructive: "da-btn-destructive",
      outline: "da-btn-outline",
      "outline-nocolor": "da-btn-outline-nocolor",
      gradient: "da-btn-gradient",
      secondary: "da-btn-secondary",
      ghost: "da-btn-ghost",
      link: "da-btn-link",
    },
    size: {
      default: "da-btn-sz-default",
      sm: "da-btn-sz-sm",
      lg: "da-btn-sz-lg",
      icon: "da-btn-sz-icon",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const DaButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
DaButton.displayName = "DaButton";

export { DaButton, buttonVariants };
