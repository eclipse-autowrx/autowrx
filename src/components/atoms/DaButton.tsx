import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md da-txt-regular font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-da-primary-500 text-da-white shadow hover:bg-da-primary-500/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border text-da-primary-500 border-da-primary-500 shadow-sm hover:bg-da-primary-500/10",
        "outline-nocolor":
          "border text-da-gray-dark border-da-gray-dark shadow-sm hover:bg-da-gray-dark/10",
        gradient:
          "bg-gradient-to-r from-da-gradient-from to-da-gradient-to text-da-white shadow-sm hover:opacity-90",
        secondary:
          "bg-da-gray-dark text-da-white shadow-sm hover:bg-da-gray-dark/80",
        ghost: "hover:bg-da-primary-500 hover:text-da-white",
        link: "text-da-primary-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

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
