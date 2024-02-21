import React, { useCallback, useEffect, useState } from "react";
import { API } from "../../../apis/backend/vehicleApi";
import { useCurrentPrototypeGetSet } from "../../../hooks/useCurrentPrototype";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import { Model } from "../../../apis/backend/modelApi";
import ApiListItem from "../CVIViewer/models/ApiListItem";
import { PrototypeGetSet } from "../../../apis/models";
import clsx from "clsx";
import { supportedCertivityApis } from "../../../apis/backend/certivityApi";
import HomologationUsedAPIsHeader from "./HomologationUsedAPIsHeader";
import { TbSquare, TbSquareCheck } from "react-icons/tb";
import Button from "../../../reusable/Button";

type HomologationUsedAPIsProps = {
    selectedAPIs: Set<API>;
    setSelectedAPIs: (apis: Set<API>) => void;
};

const HomologationUsedAPIs = ({ selectedAPIs, setSelectedAPIs }: HomologationUsedAPIsProps) => {
    const [usedAPIs, setUsedAPIs] = useState<API[]>([]);
    const model = useCurrentModel() as Model | undefined;
    const { prototype } = useCurrentPrototypeGetSet() as PrototypeGetSet;

    const convertNodeToItem = useCallback((parent: string | null, name: string, node, returnList: API[]) => {
        if (!node || !name) return;
        let item: API = {
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
    }, []);

    const convertCVITreeToList = useCallback(
        (apiData: object) => {
            if (!apiData) return [];
            let ret = [];
            convertNodeToItem(null, "Vehicle", apiData["Vehicle"], ret);
            return ret;
        },
        [convertNodeToItem]
    );

    const fetchAPIs = useCallback(async () => {
        const cvi = JSON.parse(model?.cvi ?? "");
        const cviList = convertCVITreeToList(cvi);
        let wishlistApi: API[] = [];

        if (model?.custom_apis) {
            for (let key in model.custom_apis) {
                let node = model.custom_apis[key];
                for (let childKey in node) {
                    convertNodeToItem(key, childKey, node[childKey], wishlistApi);
                }
            }

            wishlistApi.forEach((a) => (a.isWishlist = true));
        }
        const combine = [...wishlistApi, ...cviList];
        const finalResult: API[] = [];
        combine.forEach((item) => {
            if (item.type == "branch") return;
            let arName = item.name.split(".");
            if (arName.length > 1) {
                item.shortName = "." + arName.slice(1).join(".");
                finalResult.push(item);
            }
        });

        return finalResult;
    }, [convertCVITreeToList, convertNodeToItem, model?.custom_apis, model?.cvi]);

    // Sort by supported and not supported APIs
    const compareFn = useCallback((a: API, b: API) => {
        const aIsSupported = supportedCertivityApis.has("Vehicle" + a.shortName);
        const bIsSupported = supportedCertivityApis.has("Vehicle" + b.shortName);
        if (Number(aIsSupported) < Number(bIsSupported)) return 1;
        if (Number(aIsSupported) > Number(bIsSupported)) return -1;
        return a.name.localeCompare(b.name);
    }, []);

    useEffect(() => {
        (async () => {
            if (prototype?.code) {
                const allAPIs = await fetchAPIs();
                const res: API[] = [];
                for (let api of allAPIs) {
                    if (api.shortName && prototype.code.includes(api.shortName)) {
                        res.push(api);
                    }
                }

                return setUsedAPIs(res.sort(compareFn));
            }
            setUsedAPIs([]);
        })();
    }, [compareFn, fetchAPIs, prototype, setUsedAPIs]);

    const selectAPIHandler = (api: API) => () => {
        if (selectedAPIs.has(api)) {
            selectedAPIs.delete(api);
        } else {
            selectedAPIs.add(api);
        }
        setSelectedAPIs(new Set(selectedAPIs));
    };

    const getRoundedClassesOfRow = useCallback(
        (index: number) => {
            const res: string[] = [];
            if (!selectedAPIs.has(usedAPIs[index])) {
                res.push("rounded-lg");
                return res;
            }
            if (index === 0) res.push("rounded-t-lg");
            if (index === usedAPIs.length - 1) res.push("rounded-b-lg");
            if (index + 1 >= usedAPIs.length || !selectedAPIs.has(usedAPIs[index + 1])) res.push("rounded-b-lg");
            if (index - 1 < 0 || !selectedAPIs.has(usedAPIs[index - 1])) res.push("rounded-t-lg");
            return res;
        },
        [selectedAPIs, usedAPIs]
    );

    return (
        <div className="rounded-3xl flex flex-col w-full bg-gray-50 px-5 pt-5 pb-3 h-full text-gray-700">
            <HomologationUsedAPIsHeader
                selectedAPIs={selectedAPIs}
                setSelectedAPIs={setSelectedAPIs}
                usedAPIs={usedAPIs}
            />

            {/* List of used APIs */}
            {usedAPIs.length > 0 ? (
                <ul className="flex-1 min-h-0 overflow-y-auto scroll-gray -mx-2">
                    {usedAPIs.map((api, index) => (
                        <div
                            key={api.name}
                            className={clsx(
                                "flex gap-2 items-center",
                                !supportedCertivityApis.has(api.name) && "opacity-30 pointer-events-none"
                            )}
                        >
                            <Button
                                variant="custom"
                                className="hover:bg-gray-200 w-6 ml-1 rounded-lg"
                                onClick={selectAPIHandler(api)}
                            >
                                {selectedAPIs.has(api) ? (
                                    <TbSquareCheck className="flex-shrink-0 text-base" />
                                ) : (
                                    <TbSquare className="flex-shrink-0 text-base" />
                                )}
                            </Button>
                            <li
                                onClick={selectAPIHandler(api)}
                                className={clsx(
                                    "hover:bg-gray-300 active:ring-2 flex-1 min-w-0 ring-gray-300 ring-inset transition cursor-pointer",
                                    selectedAPIs.has(api) && "bg-gray-300",
                                    ...getRoundedClassesOfRow(index)
                                )}
                            >
                                <div className="pointer-events-none">
                                    <ApiListItem activeApi="" item={api} onClickApi={(() => {}) as any} />
                                </div>
                            </li>
                        </div>
                    ))}
                </ul>
            ) : (
                <div className="text-sm h-full flex italic items-center text-gray-600 justify-center py-6">
                    {"<"}No APIs used{">"}
                </div>
            )}
        </div>
    );
};

export default HomologationUsedAPIs;
