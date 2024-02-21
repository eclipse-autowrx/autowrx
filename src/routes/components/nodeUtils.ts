export const getClosestNode = (node_name: string, exists: (name_slice: string) => boolean) => {
    const parts = node_name.split(".").filter((part) => part !== "");
    for (let i = parts.length; i > 0; i--) {
        const name_slice = parts.slice(0, i).join(".");
        if (exists(name_slice)) {
            return name_slice;
        }
    }
    return undefined;
};
