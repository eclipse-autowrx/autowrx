import { FC, useEffect, useState } from "react"

interface DisplayImageProps {
    image_file: string
    disableNoImagePlaceholder?: boolean
    maxHeight?: number
}

const DisplayImage: FC<DisplayImageProps> = ({image_file, disableNoImagePlaceholder = false, maxHeight = 600}) => {
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
    }, [image_file])
    

    return (
        <div className="flex w-full h-full">
            {image_file === "" ? (
                disableNoImagePlaceholder ? (
                    <div></div>
                ) : (
                    <div
                    style={{
                        height: "100%",
                        minHeight: 220,
                        background: "repeating-linear-gradient(135deg, #f9fafb, #f9fafb 20px, #f3f4f6 10px, #f3f4f6 50px)"
                    }}
                    className="flex w-full select-none text-2xl text-gray-400 justify-center items-center px-3"
                    >
                        No Image Attached
                    </div>    
                )
            ) : (
                <div style={{height: "220px", display: loading ? "block" : "none"}} className="w-full bg-gray-100 my-auto"></div>
            )}
            <img
            style={{display: loading ? "none" : "block", objectFit: "contain", maxHeight}}
            src={image_file}
            alt=""
            className="w-full h-100 select-none"
            onLoad={() => {
                setLoading(false)
            }}
            />
        </div>
    )
}

export default DisplayImage