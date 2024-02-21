// Import required React hooks, components, and libraries
import { FC, memo, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { TbSearch, TbPlus } from "react-icons/tb";
import { Model } from "../../../../../../apis/models";
import permissions from "../../../../../../permissions";
import useCurrentUser from "../../../../../../reusable/hooks/useCurrentUser";
import Input from "../../../../../../reusable/Input/Input";
import SideNav from "../../../../../../reusable/SideNav/SideNav";
import BranchViewer from "../../../../CVIViewer/BranchViewer";
import CreateApiForm from "../../../../CVIViewer/CreateApiForm";
import { AnyNode, Branch } from "../Spec";
import CheckboxDropdown from "../../../../../../reusable/Dropdown/CheckboxDropdown";
import LinkWrap from "../../../../../../reusable/LinkWrap";
import { useParamsX } from "../../../../../../reusable/hooks/useUpdateNavigate";
import ApiListItem from "../../../../CVIViewer/models/ApiListItem";
import { useNavigate } from "react-router-dom";
import Dropdown from "../../../../../../reusable/Dropdown";
import { MenuItem } from "@mui/material";
import { ApiData, fetchAllTags } from "../../../../../TagsFilter/ApiTagUtilities";
import { useSearchParams } from "react-router-dom";

type ApiItem = {
    name: string;
    type: string;
    uuid: string;
    description: string;
    parent: string | null;
    isWishlist?: boolean;
};

// Declare ListHalfProps interface
interface ListHalfProps {
    node_name: string;
    model: Model;
    onlyShow?: string[];
    onClickApi?: (api: any) => Promise<void>;
    listApiFetched?: (api: any[]) => void;
}

const ListHalf: FC<ListHalfProps> = ({ node_name, model, onlyShow, onClickApi, listApiFetched }) => {
    const { node_path = "" } = useParams();
    const [search, setSearch] = useState("");
    const customApiSidenav = useState(false);
    const [cvi, setCVI] = useState<any>(null);
    const editingCustomNode = useState<null | [string, AnyNode]>(null);

    const { profile } = useCurrentUser();
    const selectedRef = useRef<HTMLDivElement | null>(null);

    const [isDefault, setIsDefault] = useState(true);
    const [isWishlist, setIsWishlist] = useState(true);
    const [apiList, setApiList] = useState<ApiItem[]>([]);
    const [apiListRender, setApiListRender] = useState<ApiItem[]>([]);

    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

    const [recentApis, setRecentApis] = useState<string[]>([]);
    const navigate = useNavigate();

    const [tagToApiMapping, setTagToApiMapping] = useState<Record<string, string[]>>({});

    const [searchParams, setSearchParams] = useSearchParams();
    const { prototype_id = "" } = useParamsX();
    const [activeApi, setActiveApi] = useState("");

    useEffect(() => {
        const tagQueryParam = searchParams.get("tag");
        if (tagQueryParam) {
            setSearch("#" + tagQueryParam);
        } else {
            if (node_path) {
                setSearch(node_path);
            } else {
                setSearch("");
            }
        }
    }, [searchParams, node_path]);

    useEffect(() => {
        if (search.startsWith("#") && search.length > 1) {
            const tagValue = search.substring(1);
            navigate(
                `/model/${model.id}/cvi/list/${node_name ? node_name + "/" : ""}?tag=${encodeURIComponent(tagValue)}`
            );
        }
    }, [search, model.id, node_name]);

    const loadAllTags = async () => {
        try {
            let fetchedTags = await fetchAllTags(model.id); // Fetch tags
            createTagApiMapping(fetchedTags);
        } catch (error) {
            console.error("Error fetching tags:", error);
        }
    };

    const createTagApiMapping = (apiData: ApiData[]) => {
        let mapping: Record<string, string[]> = {};

        // Check if apiData is defined and is an array
        if (Array.isArray(apiData)) {
            apiData.forEach((api) => {
                // Check if api.tags is defined and is an array
                if (Array.isArray(api.tags)) {
                    api.tags.forEach((tag) => {
                        // Use both tag category and tag for mapping
                        let key = `#${tag.tagCategoryName.toLowerCase()}/${tag.tag.toLowerCase()}`;
                        if (mapping[key]) {
                            mapping[key].push(api.apiName);
                        } else {
                            mapping[key] = [api.apiName];
                        }
                    });
                }
            });
        }

        setTagToApiMapping(mapping);
        // console.log("mapping", mapping)
    };

    useEffect(() => {
        loadAllTags();
    }, []);

    useEffect(() => {
        let str_lastApis = localStorage.getItem("lastApis");
        if (str_lastApis) {
            setRecentApis(JSON.parse(str_lastApis) || []);
        }
        return () => {
            localStorage.setItem("lastApis", JSON.stringify(recentApis));
        };
    }, []);

    useEffect(() => {
        if (recentApis.length > 5) {
            setRecentApis((recentApis) => {
                return recentApis.slice(0, 5);
            });
        }
    }, [recentApis]);

    const addRecentApi = (api: string) => {
        setRecentApis((recentApis) => {
            return [api, ...recentApis.filter((a) => a !== api)];
        });
    };

    const handleDisplayAPI = () => {
        setIsDefault(selectedTypes.includes("defaultAPI"));
        setIsWishlist(selectedTypes.includes("wishlistAPI"));

        if (!selectedTypes.includes("defaultAPI") && !selectedTypes.includes("wishlistAPI")) {
            setIsDefault(false);
            setIsWishlist(false);
        }
    };

    useEffect(() => {
        handleDisplayAPI();
    }, [selectedTypes]);

    // const fullLink =
    //   prototype_id === ""
    //     ? `/model/:model_id`
    //     : `/model/:model_id/library/prototype/${prototype_id}`;

    useEffect(() => {
        // if (node_path) {
        //   setSearch(node_path);
        // }
        setActiveApi(node_path || "");
        if (node_path) {
            addRecentApi(node_path);
        }
    }, [node_path]);

    useEffect(() => {
        if (model.cvi) {
            setCVI(JSON.parse(model.cvi));
        }
    }, [model]);

    useEffect(() => {
        let defaultApis = convertCVITreeToList(cvi);
        let wishlistApi: any = [];
        // console.log("model.custom_apis", model.custom_apis)
        if (model.custom_apis) {
            for (let key in model.custom_apis) {
                let node = model.custom_apis[key];
                for (let childKey in node) {
                    convertNodeToItem(key, childKey, node[childKey], wishlistApi);
                }
            }

            wishlistApi.forEach((a) => (a.isWishlist = true));
        }
        // console.log(defaultApis);
        // console.log("wishlistApi", [...wishlistApi])
        let apis = [...wishlistApi, ...defaultApis];
        apis.sort(function (a, b) {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });
        if (listApiFetched) {
            listApiFetched(apis);
        }
        setApiList(apis);
    }, [cvi]);

    useEffect(() => {
        if (!apiList) {
            setApiListRender([]);
            return;
        }

        const searchLower = search.toLowerCase();
        let filteredApis;

        if (searchLower.startsWith("#")) {
            let matchedApis = new Set<string>(); // To store matching API names

            // Extract the search term without the '#' and check if it's contained in the mapping keys
            let searchTerm = searchLower.substring(1);

            Object.keys(tagToApiMapping).forEach((key) => {
                // Check if the key contains the entire search term
                if (key.includes(searchTerm)) {
                    tagToApiMapping[key].forEach((apiName) => matchedApis.add(apiName));
                }
            });

            // Filter APIs based on matched names
            filteredApis = apiList.filter((item: ApiItem) => matchedApis.has(item.name));
        } else {
            // Regular search by name
            filteredApis = apiList.filter(
                (item: ApiItem) => selectedTypes.includes(item.type) && item.name.toLowerCase().includes(searchLower)
            );
        }

        setApiListRender(
            filteredApis.filter((item: ApiItem) => (item.isWishlist && isWishlist) || (!item.isWishlist && isDefault))
        );
    }, [apiList, selectedTypes, isWishlist, isDefault, search, tagToApiMapping]);

    const convertNodeToItem = (parent, name, node, returnList) => {
        if (!node || !name) return;
        let item = {
            name: parent ? parent + "." + name : name,
            type: node.type,
            uuid: node.uuid,
            description: node.description,
            parent: parent,
            isWishlist: false,
        };
        returnList.push(item);
        if (node.children) {
            for (let childKey in node.children) {
                convertNodeToItem(item.name, childKey, node.children[childKey], returnList);
            }
        }
    };

    const convertCVITreeToList = (apiData) => {
        if (!apiData) return [];
        let ret = [];
        convertNodeToItem(null, "Vehicle", apiData["Vehicle"], ret);
        return ret;
    };

    // Scroll the selected element into view
    useEffect(() => {
        selectedRef.current?.scrollIntoView();
    }, []);

    // Render component
    return (
        <div className="flex flex-col w-full py-4 px-6 overflow-auto h-full border-r">
            <div className="flex w-full space-x-2 mb-2">
                <Input
                    className="text-gray-600 text-sm placeholder-gray-500"
                    containerClassName="bg-white border-gray-300 shadow-sm"
                    state={[search, setSearch]}
                    placeholder="Search"
                    iconBefore
                    Icon={TbSearch}
                    iconSize={20}
                    iconColor="#4b5563"
                    IconOnClick={
                        search === ""
                            ? undefined
                            : () => {
                                  setSearch("");
                                  setSearchParams({});
                              }
                    }
                />
                <CheckboxDropdown
                    options={[
                        { label: "Wishlist APIs", value: "wishlistAPI" },
                        { label: "Default APIs", value: "defaultAPI" },
                        { label: "Branch", value: "branch" },
                        { label: "Sensor", value: "sensor" },
                        { label: "Actuator", value: "actuator" },
                        { label: "Attribute", value: "attribute" },
                    ]}
                    onSelectedOptionsChange={setSelectedTypes}
                />
            </div>

            <div className="flex mb-0 mt-1">
                {permissions.MODEL(profile, model).canEdit() && (
                    <>
                        <SideNav
                            className="flex flex-col px-4 py-3 h-full"
                            width="450px"
                            trigger={<></>}
                            state={customApiSidenav}
                        >
                            <CreateApiForm editingNode={editingCustomNode[0]} />
                        </SideNav>
                        <div
                            className=" flex py-1 text-slate-600 items-center text-sm border-gray-100 px-2 
                        leading-loose select-none cursor-pointer hover:bg-slate-100"
                            onClick={() => {
                                editingCustomNode[1](null);
                                customApiSidenav[1](true);
                            }}
                        >
                            <TbPlus className="mr-1" style={{ transform: "scale(1.1)" }} />
                            <span className="text-sm">New Wishlist API</span>
                        </div>
                    </>
                )}
                <div className="grow" />
                <div>
                    {recentApis && recentApis.length > 0 && (
                        <div className="flex select-none">
                            <div className="grow" />
                            <Dropdown
                                trigger={
                                    <div
                                        className="flex items-center py-1 text-slate-600 text-sm 
                              border-gray-100 px-2 leading-loose select-none cursor-pointer hover:bg-slate-100"
                                    >
                                        Recently viewed APIs
                                    </div>
                                }
                            >
                                {recentApis.map((api: any) => (
                                    <MenuItem
                                        className="px-4 py-1"
                                        style={{ minHeight: 36 }}
                                        onClick={async () => {
                                            navigate(
                                                window.location.pathname.split("/list/")[0] + "/list/" + api + "/"
                                            );
                                        }}
                                    >
                                        <div className="text-sm">{api}</div>
                                    </MenuItem>
                                ))}
                            </Dropdown>
                        </div>
                    )}
                </div>

                {/* <div className="mb-0 text-sm text-gray-400 select-none">Type</div> */}
            </div>

            <div className="flex flex-col w-full h-full overflow-auto mt-2 scroll-gray">
                {apiListRender &&
                    apiListRender.map((item: any) => (
                        <div key={item.name}>
                            {" "}
                            <ApiListItem onClickApi={onClickApi} item={item} activeApi={activeApi} />{" "}
                        </div>
                    ))}
            </div>
        </div>
    );
};

const ListHalfMemoized = memo(ListHalf, (prevProps, nowProps) => {
    return (
        prevProps.node_name === nowProps.node_name &&
        prevProps.model.id === nowProps.model.id &&
        JSON.stringify(prevProps.model.custom_apis) === JSON.stringify(nowProps.model.custom_apis) &&
        prevProps.model.cvi === nowProps.model.cvi &&
        JSON.stringify(prevProps.onlyShow) === JSON.stringify(nowProps.onlyShow)
    );
});

export default ListHalfMemoized;
