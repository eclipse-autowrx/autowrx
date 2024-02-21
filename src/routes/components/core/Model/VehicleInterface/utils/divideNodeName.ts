export const divideNodeName = (node_name: string) => {
    const parts = node_name.split(".");
    const [nesting, name] = [parts.slice(0, -1).join("."), parts.slice(-1)[0]];

    return [nesting, name] as const;
};
