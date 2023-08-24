import { FC, useState } from "react"
import { HiChevronDown } from "react-icons/hi"
import { useCurrentTenantTagCategories } from "../../reusable/hooks/useCurrentTenantTagCategories"
import { CategoryAndTag } from "./TagChip"
import TagSelection from "./TagSelection"

const TagsFilter: FC<{
    selectedTagsState: [CategoryAndTag[], React.Dispatch<React.SetStateAction<CategoryAndTag[]>>]
}> = ({selectedTagsState}) => {
    const [filtersOpen, setFiltersOpen] = useState(false)

    return (
        <div className="flex flex-col w-full">
            <div className="flex w-full text-gray-500 items-center cursor-pointer" onClick={() => setFiltersOpen(!filtersOpen)}>
                <div className="uppercase font-bold text-sm">Filters</div>
                {filtersOpen ? <HiChevronDown className="text-xl ml-1 transform rotate-180" /> : <HiChevronDown className="text-xl ml-1" />}
            </div>
            {filtersOpen && (
                <TagSelection selectedTagsState={selectedTagsState} />
            )}
        </div>
    )
}

export default TagsFilter