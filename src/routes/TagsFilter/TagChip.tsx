import { CircularProgress } from "@mui/material";
import { FC } from "react";
import { IoClose } from "react-icons/io5";
import GeneralTooltip from "../../reusable/ReportTools/GeneralTooltip";

export interface CategoryAndTag {
    tagCategoryId: string;
    tagCategoryName: string;
    tag: string;
}

const TagChip: FC<{
    categoryAndTag: CategoryAndTag;
    onRemove?: () => void;
    loading?: boolean;
}> = ({ categoryAndTag, onRemove, loading = false }) => {
    return (
        <div className="flex h-8 bg-white rounded text-gray-600 text-xs items-center border border-gray-200 shadow-sm mr-2 mb-2">
            <div className="flex pl-2 pr-2 py-1">
                <div className="font-bold">{categoryAndTag.tagCategoryName}</div>
                <div>/</div>
                <div>{categoryAndTag.tag}</div>
            </div>
            {typeof onRemove !== "undefined" &&
                (loading ? (
                    <div className="flex px-2 py-2 transition items-center justify-center">
                        <CircularProgress size="1em" className="m-auto" style={{ color: "inherit" }} />
                    </div>
                ) : (
                    <GeneralTooltip content="Remove Tag" delay={200} space={10}>
                        <div className="flex pr-2 transition hover:text-red-500 items-center justify-center cursor-pointer">
                            <IoClose onClick={onRemove} style={{ transform: "scale(1.2)" }} />
                        </div>
                    </GeneralTooltip>
                ))}
        </div>
    );
};

export default TagChip;
