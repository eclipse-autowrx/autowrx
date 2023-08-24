import { CircularProgress } from "@mui/material";
import { FC } from "react";
import { IoClose } from "react-icons/io5";

export interface CategoryAndTag {
    tagCategoryId: string
    tagCategoryName: string
    tag: string
}

const TagChip: FC<{
    categoryAndTag: CategoryAndTag
    onRemove?: () => void
    loading?: boolean
}> = ({categoryAndTag, onRemove, loading = false}) => {
    return (
        <div className="flex bg-white border rounded-full text-gray-500 border text-sm items-center border-gray-200 border-2 mr-2 mb-2">
            <div className="flex pl-3 pr-2 py-1">
                <div className="font-bold">{categoryAndTag.tagCategoryName}</div>
                <div>/</div>
                <div>{categoryAndTag.tag}</div>
            </div>
            {typeof onRemove !== "undefined" && (
                loading ? (
                    <div className="flex w-7 h-7 transition bg-gray-100 rounded-full items-center justify-center">
                        <CircularProgress size="1em" className="m-auto" style={{color: "inherit"}} />
                    </div>            
                ) : (
                    <div className="flex w-7 h-7 transition bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full items-center justify-center cursor-pointer">
                        <IoClose onClick={onRemove} style={{transform: "scale(1.2)"}} />
                    </div>
                )
            )}
        </div>
    );
}

export default TagChip