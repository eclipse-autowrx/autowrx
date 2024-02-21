export const isNumeric = (value: string): boolean => {
    return /^[+-]?([0-9]*[.])?[0-9]+$/.test(value);
};
