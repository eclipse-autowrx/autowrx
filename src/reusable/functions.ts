import { v4 } from "uuid";

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const slugify = (str: string) =>
    str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

export const forever = () => new Promise(() => {});

export const random = () => v4();

export const MinDigits = (digits: number, num: number) => {
    const str = num.toString();
    const zeros = Math.max(0, digits - str.length);
    const zero_str = new Array(zeros)
        .fill(null)
        .map(() => "0")
        .join("");
    return zero_str + str;
};

export const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
