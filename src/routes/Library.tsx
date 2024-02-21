import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Tab from "../reusable/Tabs/Tab";
import { useEffect, useState } from "react";
import useAsyncRefresh from "../reusable/hooks/useAsyncRefresh";
import { getPrototypes } from "../apis";
import LoadingPage from "./components/LoadingPage";
import { useCurrentModel } from "../reusable/hooks/useCurrentModel";
import { Model, Prototype, Tag } from "../apis/models";
import NoPrototypeDisplay from "./components/PrototypeOverview/NoPrototypeDisplay";
import PrototypeOverview from "./components/PrototypeOverview/PrototypeOverview";
import PrototypeDisplay from "./components/PrototypeOverview/PrototypeDisplay";
import LinkWrap from "../reusable/LinkWrap";
import clsx from "clsx";
import Portfolio from "./components/Portfolio/Portfolio";
import { TbChevronDown, TbUpload, TbPlus, TbSearch } from "react-icons/tb";
import PrototypeNotFound from "./components/PrototypeOverview/PrototypeNotFound";
import NewPrototype from "./NewPrototype";
import ImportPrototype from "./ImportPrototype";
import { useCurrentModelPermissions } from "../permissions/hooks";
import TagsFilter from "./TagsFilter/TagsFilter";
import Input from "../reusable/Input/Input";
import useCurrentUser from "../reusable/hooks/useCurrentUser";
import { isEqual } from "lodash";
import TagSelection from "./TagsFilter/TagSelection";
import Button from "../reusable/Button";

interface LibraryProps {
    tab: "list" | "portfolio";
}

const Library = ({ tab }: LibraryProps) => {
    const { prototype_id = "" } = useParams();
    const [tagsQuery] = useSearchParams();

    const { isLoggedIn, user, profile } = useCurrentUser();
    const [filtersOpen, setFiltersOpen] = useState(false);

    const model = useCurrentModel() as Model;
    const [isFirstRender, setIsFirstRender] = useState(true); // Fix infinity loop when prototype not load yet

    const [refreshCounter, setRefreshCounter] = useState(0);

    // get tags from firebase
    const tagStrings = (tagsQuery.get("tags")?.split(",") ?? []).filter((tagString) => tagString !== "");
    const currentSelectedTags =
        tagStrings.map((tagString) => {
            const [tagCategoryId, tagCategoryName, tag] = tagString.split("|"); // tagString ex: 'organization|organization|bosch'
            return { tagCategoryId, tagCategoryName, tag };
        }) ?? [];

    const { value: prototypes, loading } = useAsyncRefresh(
        () => getPrototypes(model.id),
        [model.id, refreshCounter],
        5 * 60 * 1000
    );
    const searchStringState = useState("");
    const [renderList, setRenderList] = useState([] as Prototype[]);

    const navigate = useNavigate();

    const modelPermissions = useCurrentModelPermissions();

    // Navigate to the prototype page when user clicks on a prototype in list
    useEffect(() => {
        if (loading) {
            return;
        }

        if (prototype_id === "" && prototypes && renderList.length && tab === "list" && isFirstRender) {
            navigate(`/model/${model.id}/library/prototype/${renderList[0].id}`);
            setIsFirstRender(false);
        }
    }, [prototype_id, prototypes, renderList, tab, isFirstRender]);

    const selectedPrototype = prototypes?.find((prototype) => prototype.id === prototype_id);
    const selectedTagFullNames = currentSelectedTags.map((tag) => tag.tagCategoryId + "-/-" + tag.tag);

    // Re-render the protoype list whenever using tag filtering
    useEffect(() => {
        if (loading) {
            return;
        }

        if (!prototypes) {
            setRenderList([]);
            return;
        }
        let filtered =
            selectedTagFullNames.length === 0
                ? [...prototypes]
                : prototypes.filter((prototype) => {
                      return selectedTagFullNames.every(
                          (selectedTag) =>
                              prototype.tags?.some((tag) => selectedTag === tag.tagCategoryId + "-/-" + tag.tag)
                      );
                  });

        if (searchStringState[0] && searchStringState[0].length > 0) {
            const search = searchStringState[0].toLowerCase();
            filtered = filtered.filter((prototype) => prototype.name.toLowerCase().includes(search));
        }

        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        // Use lodash isEqual to deep compare the filtered array with renderList
        if (!isEqual(filtered, renderList)) {
            setRenderList(filtered);
        }
    }, [prototypes, searchStringState[0], selectedTagFullNames]);

    if (typeof prototypes === "undefined") {
        return <LoadingPage />;
    }

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex w-full h-fit bg-slate-50 px-4">
                <LinkWrap
                    to="/model/:model_id/library/"
                    className={clsx("ml-auto", tab === "list" && "pointer-events-none")}
                >
                    <Tab label="List" active={tab === "list"} className="!w-fit whitespace-nowrap mr-4" />
                </LinkWrap>
                <LinkWrap
                    to="/model/:model_id/library/portfolio"
                    className={clsx(tab === "portfolio" && "pointer-events-none")}
                >
                    <Tab label="Portfolio" active={tab === "portfolio"} className="!w-fit whitespace-nowrap" />
                </LinkWrap>
            </div>
            <div className="flex w-full" style={{ height: "calc(100% - 42px)" }}>
                {tab === "portfolio" ? (
                    <Portfolio prototypes={prototypes} />
                ) : (
                    <>
                        <div className="flex flex-col h-full w-[30%] border-r pt-1">
                            <div className="flex w-full items-center">
                                <div className="pl-2 w-full pr-2">
                                    <Input
                                        className="text-gray-600 text-sm placeholder-gray-500"
                                        containerClassName="bg-white border-gray-300"
                                        state={searchStringState}
                                        placeholder="Search Prototypes"
                                        iconBefore
                                        Icon={TbSearch}
                                        iconSize={20}
                                        iconColor="#4b5563"
                                    />
                                </div>
                                <div className="flex w-24 select-none justify-between relative mr-2">
                                    <div className="flex w-full py-2">
                                        <div className="flex w-full flex-col">
                                            <div
                                                className="flex w-full text-gray-500 items-center justify-center cursor-pointer border rounded border-gray-300 bg-white px-2 h-10"
                                                onClick={() => setFiltersOpen(!filtersOpen)}
                                            >
                                                <div className="text-sm text-center">Filter</div>
                                                {filtersOpen ? (
                                                    <TbChevronDown className="ml-1 transform rotate-180 w-4 h-4" />
                                                ) : (
                                                    <TbChevronDown className="ml-1 w-4 h-4" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex w-full">
                                {filtersOpen && (
                                    <div className="flex flex-col w-full h-full px-2">
                                        <TagSelection
                                            fullWidth={true}
                                            selectedTagsState={[
                                                currentSelectedTags,
                                                (dispatch) => {
                                                    const newSelectedTags =
                                                        typeof dispatch === "function"
                                                            ? dispatch(currentSelectedTags)
                                                            : dispatch;
                                                    const newQueryParams = new URLSearchParams();
                                                    newQueryParams.set(
                                                        "tags",
                                                        newSelectedTags
                                                            .map(
                                                                (tag) =>
                                                                    tag.tagCategoryId +
                                                                    "|" +
                                                                    tag.tagCategoryName +
                                                                    "|" +
                                                                    tag.tag
                                                            )
                                                            .join(",")
                                                    );
                                                    navigate(
                                                        `/model/${model.id}/library/prototype/${
                                                            selectedPrototype?.id ?? ""
                                                        }?` + newQueryParams.toString()
                                                    );
                                                },
                                            ]}
                                        />
                                        <div className="pb-2"></div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col overflow-auto">
                                {renderList &&
                                    renderList.map((prototype) => {
                                        return (
                                            <PrototypeOverview
                                                prototype={prototype}
                                                key={prototype.id}
                                                active={prototype.id === prototype_id}
                                                isMyPrototype={prototype.created?.user_uid === user?.uid}
                                            />
                                        );
                                    })}
                            </div>
                            <div className="grow overflow-y-auto">
                                {renderList.length === 0 && prototypes.length > 0 && (
                                    <div
                                        className="flex p-4 text-gray-400 text-2xl w-full h-full 
                                                    justify-center items-center select-none mb-40"
                                    >
                                        No Prototypes matched your filters.
                                    </div>
                                )}
                                {prototypes.length === 0 && (
                                    <div
                                        className="flex p-4 text-gray-400 text-2xl w-full h-full justify-center 
                                                    items-center select-none mb-40"
                                    >
                                        No Prototypes in Library
                                    </div>
                                )}
                            </div>

                            <div className="flex w-full items-center mt-2 text-sm">
                                {modelPermissions.canEdit() && (
                                    <>
                                        <NewPrototype
                                            prototypes={prototypes}
                                            trigger={
                                                <Button className="px-4 mx-4" variant="white">
                                                    <TbPlus className="mr-2 w-4 h-auto" />
                                                    <span className="mr-2 group-hover:text-gray-800">
                                                        New Prototype
                                                    </span>
                                                </Button>
                                            }
                                        />

                                        <ImportPrototype
                                            prototypes={prototypes}
                                            trigger={
                                                <Button className="px-4" variant="white">
                                                    <TbUpload className="mr-2 w-4 h-auto" />
                                                    <span className="mr-2 group-hover:text-gray-800">
                                                        Import Prototype
                                                    </span>
                                                </Button>
                                            }
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col h-full w-[70%] overflow-auto">
                            {prototypes.length === 0 ? (
                                <NoPrototypeDisplay />
                            ) : typeof selectedPrototype === "undefined" ? (
                                <PrototypeNotFound />
                            ) : (
                                <PrototypeDisplay prototype={selectedPrototype} />
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Library;
