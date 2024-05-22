import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 pointer-events-none select-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-da-primary-500/10 text-da-primary-500 ",
        secondary: "border-transparent bg-da-gray-dark/10 text-da-gray-dark ",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground  hover:bg-destructive/80",
        outline:
          "text-da-gray-dark border-da-gray-dark  hover:bg-da-gray-dark/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function DaTag({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { DaTag, badgeVariants };
