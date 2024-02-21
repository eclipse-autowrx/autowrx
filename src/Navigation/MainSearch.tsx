import clsx from "clsx";
import { FC, useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { HiOutlineSearch, HiOutlineX } from "react-icons/hi";
import Popup from "../reusable/Popup/Popup";
import { useCurrentTenantModels } from "../reusable/hooks/useCurrentTenantModels";
import { getPrototypesOfModels, getPluginsOfModels, addLog } from "../apis";
import useAsyncRefresh from "../reusable/hooks/useAsyncRefresh";
import { Model } from "../apis/models";
import useAccessiblePrototypes from "../reusable/hooks/useAccessiblePrototypes";
import useCurrentUser from "../reusable/hooks/useCurrentUser";

interface ISearchResult {
    id: string;
    name: string;
    visibility?: string | null;
    img?: string;
    type: string;
    url: string;
    refUrl?: string;
    parent: ISearchResult | null;
}

const MainSearch: FC = ({}) => {
    //   const inputKey = useState("");
    const [inputKey, setInputKey] = useState("");
    const [focused, setFocused] = useState(false);
    const [result, setResult] = useState<ISearchResult[]>([]);
    const [searchDone, setSearchDone] = useState(false);
    const [message, setMessage] = useState("");
    const [searchType, setSearchType] = useState("All");
    const popupState = useState(false);
    const { profile } = useCurrentUser();

    const models = useCurrentTenantModels();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    const { prototypes } = useAccessiblePrototypes();

    const { value: plugins } = useAsyncRefresh(
        () => getPluginsOfModels(models.map((model) => model.id)),
        [models],
        5 * 60 * 1000
    );

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        setSearchDone(false);
        if (!inputKey) {
            setMessage("Type something and press enter to search");
        } else {
            setMessage("");
        }
    }, [inputKey]);

    useEffect(() => {
        handleSearchAction();
    }, [searchType]);

    const buildUrlForItem = (item: ISearchResult) => {
        switch (item.type) {
            case "Model":
                return `/model/${item.id}`;
            case "Prototype":
                return `/model/${item.parent?.id}/library/prototype/${item.id}`;
            case "Plugin":
                return `/model/${item.parent?.id}/plugins/plugin/${item.id}`;
            default:
                return "";
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            handleSearchAction();
        }
    };

    const buildSearchItemFromModel = (model: Model) => {
        let retItem = {
            id: model.id,
            name: model.name,
            visibility: model.visibility || "private",
            img: model.model_home_image_file || "",
            type: "Model",
            url: "",
            parent: null,
        };
        retItem.url = buildUrlForItem(retItem);
        return retItem;
    };

    const handleSearchAction = () => {
        if (!inputKey) return;
        if (!models) {
            setMessage("There is no model in this tenant!");
            return;
        }
        setMessage("");
        setSearchDone(false);

        let finalResult: ISearchResult[] = [];

        if (prototypes && ["All", "Tags"].includes(searchType)) {
            let items = prototypes.filter((prototype) => {
                // console.log("prototype", prototypes)
                if (inputKey === "*") return true;

                // Lowercase input for comparison
                const lowerInputKey = inputKey.toLowerCase();
                // Filter by tags if the prototype has tags
                return (
                    prototype.tags &&
                    prototype.tags.some((tagObj) => {
                        // Check if any part of the tag matches the inputKey
                        // console.log("tagObj", tagObj)
                        return (
                            tagObj.tagCategoryName.toLowerCase().includes(lowerInputKey) ||
                            tagObj.tag.toLowerCase().includes(lowerInputKey)
                        );
                    })
                );
            });

            // Map filtered items to the desired result structure.
            let selectResult = items.map((item) => {
                let resultItem: any = {
                    id: item.id,
                    name: item.name,
                    img: item.image_file || "",
                    type: "Prototype",
                    url: "",
                    parent: null,
                };
                let matchModel = models.find((m) => m.id === item.model_id);
                if (matchModel) {
                    resultItem.parent = buildSearchItemFromModel(matchModel);
                }
                resultItem.url = buildUrlForItem(resultItem);
                return resultItem;
            });

            finalResult = finalResult.concat(selectResult);
        }

        if (models && ["All", "Model"].includes(searchType)) {
            // console.log("models", models)
            let items = models.filter((item) => {
                if (inputKey == "*") return true;
                return item.name.toLowerCase().includes(inputKey.toLowerCase());
            });
            let selectResult = items.map(buildSearchItemFromModel);
            finalResult = finalResult.concat(selectResult);
        }

        if (prototypes && ["All", "Prototype"].includes(searchType)) {
            // console.log("Prototype", prototypes)
            let items = prototypes.filter((item) => {
                if (inputKey == "*") return true;
                return item.name.toLowerCase().includes(inputKey.toLowerCase());
            });
            let selectResult = items.map((item) => {
                let resultItem: any = {
                    id: item.id,
                    name: item.name,
                    img: item.image_file || "",
                    type: "Prototype",
                    url: "",
                    parent: null,
                };
                let matchModel = models.find((m) => m.id === item.model_id);
                if (matchModel) {
                    resultItem.parent = buildSearchItemFromModel(matchModel);
                }
                resultItem.url = buildUrlForItem(resultItem);
                return resultItem;
            });
            finalResult = finalResult.concat(selectResult);
        }

        if (plugins && ["All", "Plugin"].includes(searchType)) {
            // console.log("plugins", plugins)
            let keyLowerCase = inputKey.toLowerCase();
            let items = plugins.filter((item) => {
                if (inputKey == "*") return true;
                return (
                    item.name.toLowerCase().includes(keyLowerCase) ||
                    item.js_code_url.toLowerCase().includes(keyLowerCase)
                );
            });
            let selectResult = items.map((item) => {
                let resultItem: any = {
                    id: item.id,
                    name: item.name,
                    img: item.image_file || "",
                    type: "Plugin",
                    url: "",
                    refUrl: item.js_code_url,
                    parent: null,
                };
                let matchModel = models.find((m) => m.id === item.model_id);
                if (matchModel) {
                    resultItem.parent = buildSearchItemFromModel(matchModel);
                }
                resultItem.url = buildUrlForItem(resultItem);
                return resultItem;
            });
            finalResult = finalResult.concat(selectResult);

            // Add search log
            if (profile)
                addLog(
                    `User ${profile.name || profile.email || "Anonymous"} perform search`,
                    `Search for ${inputKey}`,
                    "search",
                    profile.uid,
                    null,
                    null,
                    "search",
                    null
                );
        }

        setResult(finalResult);
        setSearchDone(true);
    };

    return (
        <>
            <Popup
                state={popupState}
                width={"800px"}
                trigger={
                    <div className="flex justify-center items-center">
                        <div
                            className="flex items-center cursor-pointer 
                                      hover:bg-gray-200 bg-gray-200/80 w-36 py-1 
                                        rounded "
                        >
                            <HiOutlineSearch className="w-4 h-4 text-gray-600 mr-2 ml-2" />{" "}
                            <span className="text-gray-600">Search</span>
                        </div>
                    </div>
                }
            >
                <div className="h-[70vh] flex flex-col">
                    <div className="flex justify-center items-center">
                        <div
                            className="w-full h-[40px] pl-4 px-0 py-0 flex justify-center items-center 
                                        font-normal bg-gray-100 text-gray-700 text-lg rounded-lg border border-gray-300"
                        >
                            <HiOutlineSearch color="#9ca3af" size={22} />
                            <input
                                ref={inputRef}
                                autoFocus
                                value={inputKey}
                                disabled={false}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                className={clsx(
                                    "flex grow outline:none placeholder:select-none px-2 py-2 resize-none bg-transparent border-transparent focus:border-transparent focus:ring-0 focus:ring-offset-0 focus:outline-none"
                                )}
                                placeholder="Search"
                                onChange={(event) => {
                                    setSearchDone(false);
                                    setInputKey(event.target.value);
                                }}
                                onKeyDown={handleKeyDown}
                            />

                            {inputKey && (
                                <HiOutlineX
                                    className="mr-3 cursor-pointer"
                                    color="#454545"
                                    size={22}
                                    onClick={() => {
                                        setInputKey("");
                                        inputRef.current?.focus();
                                    }}
                                />
                            )}

                            <div className="flex justify-center items-center rounded-r-lg w-[144px] h-full px-2 resize-none bg-gray-300 text-gray-700 ">
                                <select
                                    className="w-full text-left bg-transparent outline:none focus:border-transparent focus:ring-0 focus:ring-offset-0 focus:outline-none"
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value)}
                                >
                                    <option>All</option>
                                    <option>Model</option>
                                    <option>Plugin</option>
                                    <option>Prototype</option>
                                    <option>Tags</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className="flex items-center justify-center text-gray-400 p-4 font-thin">
                            {" "}
                            <i>{message}</i>
                        </div>
                    )}

                    {searchDone && inputKey && (
                        <div className="mb-1 ml-2 text-sm">
                            <i>
                                Result for {searchType} <b>'{inputKey}'</b> : {result.length} items
                            </i>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto mt-2">
                        {searchDone &&
                            result &&
                            result.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex py-1 px-2 mb-1 mr-1 rounded border hover:border-sky-500 cursor-pointer"
                                    onClick={() => {
                                        navigate(item.url);
                                        popupState[1](false);
                                    }}
                                >
                                    <img className="w-[100px] h-[60px] object-contain" src={item.img} alt={item.name} />
                                    <div className="pl-2 text-md text-gray-600 font-semi-bold">
                                        <div className="flex justify-center items-center">
                                            <div className="font-semi-bold text-[11px] w-[70px]">{item.type}</div>
                                            <div className="font-bold grow hover:underline">{item.name}</div>
                                        </div>
                                        {item.parent && (
                                            <div className="flex justify-center items-center">
                                                <div className="font-semi-bold text-[11px] w-[70px] ">Belong to</div>
                                                <div
                                                    className="text-[13px] grow hover:underline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(item.parent?.url || "");
                                                        popupState[1](false);
                                                    }}
                                                >
                                                    {item.parent.type}: <b>{item.parent.name}</b>
                                                </div>
                                            </div>
                                        )}
                                        <div className="leading-tight mt-1 text-xs flex">
                                            {item.refUrl && (
                                                <div className="flex justify-center items-center">
                                                    <div className="font-semi-bold text-[10px] w-[70px] ">Ref Link</div>
                                                    <a
                                                        className="text-[13px] grow hover:underline"
                                                        href={item.refUrl}
                                                        target="blank"
                                                    >
                                                        {" "}
                                                        {item.refUrl}
                                                    </a>
                                                </div>
                                            )}
                                            {/* { item.visibility==='public' && <div className="rounded-full bg-gray-200 px-3 py-0.5 text-[10px]">{item.visibility}</div> } */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </Popup>
        </>
    );
};

export default MainSearch;
