import { useEffect, useState } from "react";

export const useFetchApiList = (model) => {
    const [apiList, setApiList] = useState<any[]>([]);
    const [cvi, setCVI] = useState<any[]>([]);
    const [listApiFetched, setListApiFetched] = useState<any>(null);

    const convertNodeToItem = (parent, name, node, returnList) => {
        if (!node || !name) return;

        // Check if 'datatype' exists in the node and add it to the item if it does
        const item = {
            name: parent ? `${parent}.${name}` : name,
            type: node.type,
            uuid: node.uuid,
            description: node.description,
            parent: parent,
            isWishlist: false,
            datatype: node.datatype || "N/A",
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

    useEffect(() => {
        if (model && model.cvi) {
            try {
                setCVI(JSON.parse(model.cvi));
            } catch (error) {
                console.error("Error parsing cvi:", error);
                // Handle the error appropriately
            }
        }
    }, [model]);
    // import cvi list to for MappingComponent
    useEffect(() => {
        let defaultApis = convertCVITreeToList(cvi);
        let wishlistApi: any = [];
        // console.log("model.custom_apis", model.custom_apis)
        if (model && model.custom_apis) {
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
        // console.log("apis", apis)
    }, [cvi]);

    return { apiList };
};
