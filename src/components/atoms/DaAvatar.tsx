import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

interface DaAvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src: string;
  alt?: string;
  fallback?: React.ReactNode;
}

const DaAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  DaAvatarProps
>(({ className, src, alt, fallback, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  >
    <AvatarPrimitive.Image
      src={src}
      alt={alt ? alt : "Avatar"}
      className="aspect-square object-cover h-full w-full"
    />
    <AvatarPrimitive.Fallback className="flex items-center justify-center bg-gray-200 text-gray-700">
      {fallback}
    </AvatarPrimitive.Fallback>
  </AvatarPrimitive.Root>
));
DaAvatar.displayName = AvatarPrimitive.Root.displayName;

export { DaAvatar };
