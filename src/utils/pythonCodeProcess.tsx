const removeCommentFromPythonCode = (code: string) => {
    return code
        .split("\n")
        .filter((line) => {
            let tmp = String(line).trim();
            return !tmp.startsWith("#");
        })
        .join("\n");
};

export { removeCommentFromPythonCode };
