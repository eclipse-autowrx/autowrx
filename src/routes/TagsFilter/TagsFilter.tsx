import { FC, useState } from "react";
import { HiChevronDown } from "react-icons/hi";
import { useCurrentTenantTagCategories } from "../../reusable/hooks/useCurrentTenantTagCategories";
import { CategoryAndTag } from "./TagChip";
import TagSelection from "./TagSelection";

const TagsFilter: FC<{
    selectedTagsState: [CategoryAndTag[], React.Dispatch<React.SetStateAction<CategoryAndTag[]>>];
}> = ({ selectedTagsState }) => {
    const [filtersOpen, setFiltersOpen] = useState(false);

    return (
        <div className="flex flex-col w-auto">
            <div
                className="flex w-full text-gray-500 items-center cursor-pointer"
                onClick={() => setFiltersOpen(!filtersOpen)}
            >
                <div className="uppercase font-bold text-m">Filters</div>
                {filtersOpen ? (
                    <HiChevronDown className="text-xl ml-1 transform rotate-180" />
                ) : (
                    <HiChevronDown className="text-xl ml-1" />
                )}
            </div>
            <div className="flex">
                {filtersOpen && (
                    <div className=" flex w-[30%] justify-end">
                        <TagSelection selectedTagsState={selectedTagsState} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TagsFilter;
