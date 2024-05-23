import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

const AspectRatio = AspectRatioPrimitive.Root;

interface DaImageProps {
  src: string;
  alt?: string;
  ratio: number;
  maxWidth: string;
  className?: string;
}

const DaImage = ({
  src,
  alt,
  ratio,
  maxWidth,
  className = "",
}: DaImageProps) => {
  return (
    <div
      className={`${className} h-full w-full`}
      style={{ maxWidth: maxWidth }}
    >
      <AspectRatio ratio={ratio}>
        <img
          src={src}
          alt={alt ? alt : "Image"}
          className="rounded-md object-cover h-full w-full"
        />
      </AspectRatio>
    </div>
  );
};

export { DaImage };
