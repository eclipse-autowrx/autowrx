import { FC, useEffect, useState } from "react";

interface DisplayImageProps {
    image_file: string | undefined;
    disableNoImagePlaceholder?: boolean;
    minHeight?: number;
    objectFit?: "contain" | "cover";
    aspectRatio?: "3/2" | "4/3" | "16/9" | "auto" | "free"; // For the image inside the container
    isBlur?: boolean;
    alignTop?: boolean;
    onImageLoad?: (width: number) => void;
}

const CustomDisplayImage: FC<DisplayImageProps> = ({
    image_file,
    disableNoImagePlaceholder = false,
    minHeight = 450,
    objectFit = "contain",
    aspectRatio = "auto",
    isBlur = true,
    alignTop = false,
    onImageLoad,
}) => {
    const [loading, setLoading] = useState(true);
    const [aspectRatioNumeric, setAspectRatioNumeric] = useState(1);

    useEffect(() => {
        if (image_file) {
            const img = new Image();
            img.src = image_file;
            img.onload = () => {
                setLoading(false);
            };
        }
    }, [image_file]);

    useEffect(() => {
        let aspectRatioValues = aspectRatio.split("/").map(Number);
        if (aspectRatio === "free") {
            setAspectRatioNumeric(1);
        } else if (aspectRatio === "auto") {
            setAspectRatioNumeric(1);
        } else {
            setAspectRatioNumeric(aspectRatioValues[0] / aspectRatioValues[1]);
        }
    }, [aspectRatio]);

    const imageStyle: React.CSSProperties = {
        objectFit: objectFit,
        width: "100%",
        height: "100%",
        objectPosition: alignTop ? "top" : "center",
        position: "absolute",
        zIndex: 20,
    };

    const blurBackgroundStyle: React.CSSProperties = {
        filter: "brightness(75%) blur(20px)",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: alignTop ? "top center" : "center",
        position: "absolute",
        width: "100%",
        height: "100%",
        zIndex: 10,
    };

    const handleImageLoad = (event) => {
        let aspectRatio = event.currentTarget.naturalWidth / event.currentTarget.naturalHeight;
        let calculatedWidth = minHeight * aspectRatio;

        if (onImageLoad) {
            onImageLoad(calculatedWidth);
        }
    };

    const containerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        minHeight: `${minHeight}px`,
        height: aspectRatio === "auto" ? "auto" : `calc(100% / ${aspectRatioNumeric})`,
        overflow: "hidden",
    };

    return (
        <div style={containerStyle}>
            {image_file === "" ? (
                disableNoImagePlaceholder ? null : (
                    <div
                        style={{
                            height: "100%",
                            background:
                                "repeating-linear-gradient(135deg, #f9fafb, #f9fafb 20px, #f3f4f6 10px, #f3f4f6 50px)",
                        }}
                        className="flex w-full select-none text-2xl text-gray-400 justify-center items-center"
                    >
                        No Image Attached
                    </div>
                )
            ) : (
                <>
                    {loading ? (
                        <div className="bg-gray-100 h-full"></div>
                    ) : (
                        <>
                            {isBlur && (
                                <div
                                    style={{ ...blurBackgroundStyle, backgroundImage: `url(${image_file})` }}
                                    className="absolute inset-0"
                                ></div>
                            )}
                            <img
                                src={image_file}
                                alt=""
                                style={imageStyle}
                                onLoad={(event) => {
                                    handleImageLoad(event);
                                }}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default CustomDisplayImage;
