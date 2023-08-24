import { TableCellType } from "./parseCJFromInput"
import tokenizeText from "./tokenizeText"

type ParsedLine = {
    type: "cell"
    key: string
    value: TableCellType
} | {
    type: "header"
    value: string
}

const parseLine = (line: string): ParsedLine | undefined => {
    if (line.trim() === "") {
        // Line is blank
        return
    } else if (line.startsWith("#")) {
        return {
            type: "header",
            value: line.split("#")[1]
        }
    } else if (line.includes(":")) {
        const [key, value] = line.split(/:(.*)/g, 2)

        return {
            type: "cell",
            key,
            value: tokenizeText(value)
        }
    } else {
        return
    }
}

export default parseLine