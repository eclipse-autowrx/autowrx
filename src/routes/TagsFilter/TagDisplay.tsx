import { FC } from "react";
import TagChip, { CategoryAndTag } from "./TagChip";

const TagDisplay: FC<{
    categoryAndTags: CategoryAndTag[];
}> = ({ categoryAndTags }) => {
    return (
        <div className="flex flex-wrap select-none">
            {categoryAndTags.map((categoryAndTag, index) => (
                <TagChip
                    key={categoryAndTag.tag + "-/-" + categoryAndTag.tagCategoryId}
                    categoryAndTag={categoryAndTag}
                />
            ))}
        </div>
    );
};

export default TagDisplay;
