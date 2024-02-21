import { TableCellType } from "./parseCJFromInput";

const tokenRegex = /({{(?:[\s\S]+?)\|(?:(?:http|https|ftp|ftps):\/\/[\S]+?)}})/g;
const linkRegex = /^{{([\s\S]+?)\|((?:http|https|ftp|ftps):\/\/[\S]+?)}}$/g;

const tokenizeText = (text: string): TableCellType => {
    const splits = text.split(tokenRegex).filter(Boolean);
    const tokens: TableCellType = splits.map((token) => {
        if (linkRegex.test(token)) {
            //@ts-ignore
            const [text, href] = [
                ...token.matchAll(/^{{([\s\S]+?)\|((?:http|https|ftp|ftps):\/\/[\S]+?)}}$/g),
            ][0].slice(1) as [string, string];
            return {
                type: "link",
                text,
                href,
            };
        } else {
            return {
                type: "text",
                text: token,
            };
        }
    });
    return tokens;
};

export default tokenizeText;
