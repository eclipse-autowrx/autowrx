import { CircularProgress } from "@mui/material"
import { FC, useState } from "react"
import { HiPlus } from "react-icons/hi"
import { IoCheckmark, IoClose } from "react-icons/io5"
import { TagCategory } from "../../apis/models"
import Select from "../../reusable/Select"
import { CategoryAndTag } from "./TagChip"

const TagInput: FC<{
    selectedTags: CategoryAndTag[]
    tagCategories: TagCategory[]
    onCreate: (tagCategory: CategoryAndTag) => void
    loading?: boolean
}> = ({tagCategories, onCreate, selectedTags, loading = false}) => {
    const [activated, setActivated] = useState(false)
    const selectedTagCategoryState = useState("")
    const selectedTagState = useState("")

    if (!activated) {
        return (
            <div
            onClick={() => setActivated(true)}
            className="flex bg-white border rounded-full text-gray-500 border text-sm items-center border-2 mr-2 mb-2 cursor-pointer border-gray-200 hover:bg-gray-200 active:bg-gray-300 transition"
            >
                <div className="flex items-center justify-center pl-3 pr-3 py-1">
                    <HiPlus className="mr-1 transform scale-120" />
                    Add New
                </div>
            </div>
        )
    }

    const selectedTagKeys = selectedTags.map((categoryAndTag) => categoryAndTag.tagCategoryId + "-/-" + categoryAndTag.tag)

    const selectedCatTags = Object.values(
        (tagCategories.find(tagCategory => tagCategory.id === selectedTagCategoryState[0]))?.tags ?? {}
    ).map(tag => ({
        value: tag.name,
        name: tag.name
    })).filter(tagCategory => !selectedTagKeys.includes(selectedTagCategoryState[0] + "-/-" + tagCategory.value))

    return (
        <div className="flex bg-white border rounded-full text-gray-500 border text-sm items-center border-gray-200 border-2 mr-2 mb-2">
            <div className="flex items-center">
                <div className="ml-3 py-1">
                    <Select
                    state={selectedTagCategoryState}
                    options={[
                        {
                            name: "Select Tag Category",
                            value: "select-tag-category",
                            disabled: true
                        }
                    ].concat(tagCategories.map(tagCategory => {
                        return {
                            name: tagCategory.name,
                            value: tagCategory.id,
                            disabled: false
                        }
                    } ))}
                    />
                </div>
                    {selectedTagCategoryState[0] !== "select-tag-category" && (
                        <>
                            <div className="ml-1 mr-2">/</div>
                            <Select
                            state={selectedTagState}
                            options={[
                                {
                                    name: "Select Tag",
                                    value: "select-tag",
                                    disabled: true
                                }
                            ].concat(selectedCatTags as any)} />
                        </>
                    )}
                <div className="ml-1">
                    {(selectedTagCategoryState[0] !== "select-tag-category" && selectedTagState[0] !== "select-tag") && (
                        loading ? (
                            <div className="flex w-7 h-7 transition bg-gray-100 rounded-full items-center justify-center">
                                <CircularProgress size="1em" className="m-auto" style={{color: "inherit"}} />
                            </div>
                        ) : (
                            <div className="flex w-7 h-7 transition bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full items-center justify-center cursor-pointer">
                                <IoCheckmark style={{transform: "scale(1.3)"}} onClick={() => {
                                    selectedTagCategoryState[1]("select-tag-category")
                                    selectedTagState[1]("select-tag")

                                    onCreate({
                                        tag: selectedTagState[0],
                                        tagCategoryId: selectedTagCategoryState[0],
                                        tagCategoryName: tagCategories.find(tagCategory => tagCategory.id === selectedTagCategoryState[0])?.name ?? ""
                                    })
                                }} />
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    )
}

export default TagInput