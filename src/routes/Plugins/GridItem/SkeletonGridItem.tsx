import clsx from "clsx"
import { FC } from "react"

interface SkeletonGridItemProps {
    space: number
    className?: string
}

const SkeletonGridItem: FC<SkeletonGridItemProps> = ({space, className}) => {
    return (
        <div
        data-space={space}
        className={clsx(
            "flex border border-dashed items-center justify-center text-gray-400 text-4xl select-none",
            className
        )}>{space}</div>
    )
}

export default SkeletonGridItem