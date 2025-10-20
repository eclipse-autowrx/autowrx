import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-da-primary-500 text-da-white shadow-sm hover:bg-da-primary-500/90",
        destructive:
          "text-da-gray-medium hover:text-da-destructive hover:bg-da-destructive/10",
        outline:
          "border text-da-primary-500 border-da-primary-500 shadow-xs hover:bg-da-primary-500/10",
        secondary:
          "bg-da-gray-medium text-da-white shadow-xs hover:bg-da-gray-medium/80",
        ghost: "text-da-gray-medium hover:bg-da-primary-100 hover:text-da-primary-500",
        link: "text-da-gray-medium hover:underline",
        gradient:
          "bg-gradient-to-r from-da-gradient-from to-da-gradient-to text-da-white shadow-xs hover:opacity-90",
        plain: "text-da-gray-medium hover:bg-da-primary-100 hover:text-da-primary-500",
        editor: "text-da-primary-500 hover:bg-da-primary-100",
        text: "text-da-primary-500 hover:underline",
        dash: "p-2 text-da-primary-500 hover:bg-da-primary-100 border border-dashed border-da-primary-500 rounded-sm",
        "outline-nocolor": "border bg-white text-da-gray-medium border-da-gray-light hover:bg-da-gray-light shadow-sm",
      },
      size: {
        default: "h-10 rounded-md px-4 py-1 text-base",
        sm: "h-8 rounded-md px-2 py-1 text-sm",
        lg: "h-12 rounded-md px-4 py-1 text-lg",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  dataId?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, dataId, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        data-id={dataId}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
