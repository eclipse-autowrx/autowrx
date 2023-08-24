import { FC, useState } from "react"
import useAsyncRefresh from "../../reusable/hooks/useAsyncRefresh"
import { useCurrentTenantTagCategories } from "../../reusable/hooks/useCurrentTenantTagCategories"
import TagChip, { CategoryAndTag } from "./TagChip"
import TagInput from "./TagInput"

const TagSelection: FC<{
    selectedTagsState: [CategoryAndTag[], React.Dispatch<React.SetStateAction<CategoryAndTag[]>>]
}> = ({selectedTagsState}) => {
    const [selectedTags, setSelectedTags] = selectedTagsState
    const [loading, setLoading] = useState(false)
    const tagCategories = useCurrentTenantTagCategories()

    return (
        <div className="flex flex-wrap mt-3 select-none">
            {selectedTags.map((categoryAndTag, index) => (
                <TagChip
                loading={loading}
                key={categoryAndTag.tag + "-/-" + categoryAndTag.tagCategoryId} categoryAndTag={categoryAndTag}
                onRemove={async () => {
                    setLoading(true)
                    await setSelectedTags(() => {
                        return selectedTags.filter((tagCategory) => JSON.stringify(tagCategory) !== JSON.stringify(categoryAndTag))
                    })
                    setLoading(false)
                }}
                />
            ))}
            <TagInput
            loading={loading}
            selectedTags={selectedTags}
            tagCategories={tagCategories}
            onCreate={async (tagCategory) => {
                setLoading(true)
                await setSelectedTags(() => {
                    return selectedTags.concat([tagCategory])
                })
                setLoading(false)
            }}
            />
        </div>
    )
}

export default TagSelection