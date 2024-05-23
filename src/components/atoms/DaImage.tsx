import React, { HTMLAttributes } from "react";

interface DaImageProps extends HTMLAttributes<HTMLImageElement> {
  //   children?: React.ReactNode;
  src?: string | undefined;
}

const DaImage = React.forwardRef<HTMLImageElement, DaImageProps>(
  ({ className, src, ...props }, ref) => {
    return <img ref={ref} src={src || ""} {...props} className={className} />;
  }
);

export { DaImage };
