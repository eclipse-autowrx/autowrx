import React, { HTMLAttributes } from "react";

interface DaImageProps extends HTMLAttributes<HTMLImageElement> {
  //   children?: React.ReactNode;
  src?: string | undefined;
  alt?: string | undefined;
}

const DaImage = React.forwardRef<HTMLImageElement, DaImageProps>(
  ({ className, src, alt, ...props }, ref) => {
    return <img ref={ref} src={src || ""} {...props} className={className} />;
  }
);

export { DaImage };
