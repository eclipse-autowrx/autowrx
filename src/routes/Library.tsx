import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import Tab from "../reusable/Tabs/Tab"
import TabContainer from "../reusable/Tabs/TabContainer"
import WIPPopup from "./components/WIPPopup"
import { useEffect, useState } from "react"
import useAsyncRefresh from "../reusable/hooks/useAsyncRefresh"
import { getPrototypes } from "../apis"
import LoadingPage from "./components/LoadingPage"
import Select from "../reusable/Select"
import { useCurrentModel } from "../reusable/hooks/useCurrentModel"
import { Model, Tag } from "../apis/models"
import NoPrototypeDisplay from "./components/PrototypeOverview/NoPrototypeDisplay"
import PrototypeOverview from "./components/PrototypeOverview/PrototypeOverview"
import PrototypeDisplay from "./components/PrototypeOverview/PrototypeDisplay"
import LinkWrap from "../reusable/LinkWrap"
import clsx from "clsx"
import Portfolio from "./components/Portfolio/Portfolio"
import { HiChevronDown, HiPlus } from "react-icons/hi"
import PrototypeNotFound from "./components/PrototypeOverview/PrototypeNotFound"
import NewPrototype from "./NewPrototype"
import { useCurrentModelPermissions } from "../permissions/hooks"
import TagsFilter from "./TagsFilter/TagsFilter"

interface LibraryProps {
    tab: "list" | "portfolio"
}

const Library = ({tab}: LibraryProps) => {
    const {prototype_id = ""} = useParams()
    const [tagsQuery] = useSearchParams()

    const model = useCurrentModel() as Model

    const [refreshCounter, setRefreshCounter] = useState(0)

    const tagStrings = (tagsQuery.get("tags")?.split(",") ?? []).filter(tagString => tagString !== "")
    const currentSelectedTags = tagStrings.map(tagString => {
        const [tagCategoryId, tagCategoryName, tag] = tagString.split("|")
        return {tagCategoryId, tagCategoryName, tag}
    }) ?? []

    const {value: prototypes} = useAsyncRefresh(
        () => getPrototypes(model.id),
        [model.id, refreshCounter],
        5 * 60 * 1000
    )

    const navigate = useNavigate()

    const modelPermissions = useCurrentModelPermissions()

    useEffect(() => {
        if (prototype_id === "" && typeof prototypes !== "undefined" && prototypes.length && tab === "list") {
            navigate(`/model/${model.id}/library/prototype/${prototypes[0].id}`)
        }
    }, [prototype_id, typeof prototypes, tab])

    if (typeof prototypes === "undefined") {
        return <LoadingPage />
    }

    const selectedPrototype = prototypes.find(prototype => prototype.id === prototype_id)

    const selectedTagFullNames = currentSelectedTags.map(tag => tag.tagCategoryId + "-/-" + tag.tag)
    const filteredPrototypes = selectedTagFullNames.length === 0 ? prototypes : prototypes.filter(prototype => {
        const matchingTag = prototype.tags?.find(tag => selectedTagFullNames.includes(tag.tagCategoryId + "-/-" + tag.tag))
        return !!matchingTag
    })
    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex w-full h-fit bg-slate-50 px-4">
                <LinkWrap to="/model/:model_id/library/" className={clsx("ml-auto", tab === "list" && "pointer-events-none")} >
                    <Tab label="List" active={tab === "list"} className="!w-fit whitespace-nowrap mr-4" />
                </LinkWrap>
                <LinkWrap to="/model/:model_id/library/portfolio" className={clsx(tab === "portfolio" && "pointer-events-none")} >
                    <Tab label="Portfolio" active={tab === "portfolio"} className="!w-fit whitespace-nowrap" />
                </LinkWrap>
            </div>
            <div className="flex w-full" style={{height: "calc(100% - 42px)"}}>
                {tab === "portfolio" ? (
                    <Portfolio prototypes={prototypes} />
                ) : (
                    <>
                        <div className="flex flex-col h-full w-2/6 border-r">
                            <div className="flex w-full items-center px-4 py-2 select-none border-b">
                                <TagsFilter selectedTagsState={[currentSelectedTags, (dispatch) => {
                                    const newSelectedTags = typeof dispatch === "function" ? dispatch(currentSelectedTags) : dispatch
                                    const newQueryParams = new URLSearchParams()
                                    newQueryParams.set("tags", newSelectedTags.map(tag => tag.tagCategoryId + "|" + tag.tagCategoryName + "|" + tag.tag).join(","))
                                    navigate(`/model/${model.id}/library/prototype/${selectedPrototype?.id ?? ""}?` + newQueryParams.toString())
                                }]} />
                            </div>
                            <div className="flex w-full">
                                {modelPermissions.canEdit() && (
                                    <NewPrototype trigger={
                                        <div className="flex w-full items-center px-4 py-3 cursor-pointer text-aiot-blue select-none border-b">
                                            <HiPlus className="text-xl mr-2"/>New Prototype
                                        </div>
                                    }/>
                                )}
                            </div>
                            <div className="flex flex-col overflow-auto">
                                {filteredPrototypes.map(prototype => {
                                    return (
                                        <PrototypeOverview
                                        prototype={prototype}
                                        key={prototype.id}
                                        active={prototype.id === prototype_id}
                                        />    
                                    )
                                })}
                            </div>
                            {(filteredPrototypes.length === 0 && prototypes.length > 0) && (
                                <div className="flex p-4 text-gray-400 text-2xl w-full h-full justify-center items-center select-none mb-40">No Prototypes matched your filters.</div>
                            )}
                            {prototypes.length === 0 && (
                                <div className="flex p-4 text-gray-400 text-2xl w-full h-full justify-center items-center select-none mb-40">No Prototypes in Library</div>
                            )}
                        </div>
                        <div className="flex flex-col h-full w-4/6 overflow-auto">
                            {prototypes.length === 0 ? (
                                <NoPrototypeDisplay />
                            ) : (
                                typeof selectedPrototype === "undefined" ? (
                                    <PrototypeNotFound />
                                ) : (
                                    <PrototypeDisplay prototype={selectedPrototype} />
                                )
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Library