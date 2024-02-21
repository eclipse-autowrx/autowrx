import parseLine from "./parseLine";
import tokenizeText from "./tokenizeText";

type ParsedData = {
    [header: string]: {
        [key: string]: TableCellType;
    };
};

const parser = (value: string): ParsedData => {
    const lines = value.split("\n");

    const colHeaders: string[] = [];
    const data: ParsedData = {};
    for (const line of lines) {
        const parsedLine = parseLine(line);
        if (typeof parsedLine === "undefined") {
            // If `parseLine(line)` can't understand line, skip it.
            continue;
        }

        if (parsedLine.type === "header") {
            data[parsedLine.value] = {};
            colHeaders.push(parsedLine.value);
        } else {
            const currentColHeader = colHeaders[colHeaders.length - 1];
            const currentRow = data[currentColHeader];
            currentRow[parsedLine.key] = parsedLine.value;
        }
    }

    return data;
};

type CellTypes =
    | {
          type: "link";
          text: string;
          href: string;
      }
    | {
          type: "text";
          text: string;
      };

export type TableCellType = CellTypes[];

export type TableDataType = {
    [key: string]: TableCellType;
}[];

const translateParsedDataToRows = (data: ParsedData): TableDataType => {
    const translatedData: {
        [key: string]: {
            [header: string]: TableCellType;
        };
    } = {};
    Object.entries(data).forEach(([header, rows]) => {
        Object.entries(rows).forEach(([key, value]) => {
            translatedData[key] = translatedData[key] ?? {};
            translatedData[key][""] = tokenizeText(key);
            translatedData[key][header] = value;
        });
    });

    return Object.values(translatedData);
};

const parseCJFromInput = (value: string | undefined) => {
    if (!value) {
        return null;
    }
    try {
        return translateParsedDataToRows(parser(value));
    } catch (error) {
        return null;
    }
};

export default parseCJFromInput;
