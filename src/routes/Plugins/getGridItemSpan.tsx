import { GridItem } from "./GridItem/types"

export type AllowedTailwindSpans =
    "col-span-2" |
    "row-span-2" |
    "col-span-2 row-span-2" |
    "col-span-3" |
    "col-span-3 row-span-2" |
    "col-span-4" |
    "col-span-4 row-span-2" | 
    "col-span-5" |
    "col-span-5 row-span-2"

const allowedPositiveMerges = (space: number): {
    [space: string]: AllowedTailwindSpans
} => {
    const merges: {
        [space: string]: AllowedTailwindSpans
    } = {}


    // 2x1
    if (![5, 10].includes(space)) {
        merges[space+1] = "col-span-2"
    }

    // 1x2
    if (![6, 7, 8, 9, 10].includes(space)) {
        merges[space+5] = "row-span-2"
    }

    // 2x2
    if (![5, 6, 7, 8, 9, 10].includes(space)) {
        const occupying = [space+1, space+5, space+6].join("-")
        merges[occupying] = "col-span-2 row-span-2"
    }    

    // 3x1
    if (![4, 5, 9, 10].includes(space)) {
        const occupying = [space+1, space+2].join("-")
        merges[occupying] = "col-span-3"
    }

    // 3x2
    if (![6, 7, 8, 9, 10, 4, 5].includes(space)) {
        const occupying = [space+1, space+2, space+5, space+6, space+7].join("-")
        merges[occupying] = "col-span-3 row-span-2"
    }

    // 4x1
    if ([1, 2, 6, 7].includes(space)) {
        const occupying = [space+1, space+2, space+3].join("-")
        merges[occupying] = "col-span-4"
    }

    // 4x2
    if ([1, 2].includes(space)) {
        const occupying = [space+1, space+2, space+3, space+5, space+6, space+7, space+8].join("-")
        merges[occupying] = "col-span-4 row-span-2"
    }

    // 5x1
    if ([1, 6].includes(space)) {
        const occupying = [space+1, space+2, space+3, space+4].join("-")
        merges[occupying] = "col-span-5"
    }

    // 5x1
    if ([1].includes(space)) {
        const occupying = [space+1, space+2, space+3, space+4, space+5, space+6, space+7, space+8, space+9].join("-")
        merges[occupying] = "col-span-5 row-span-2"
    }

    // Simple check to see if occupying is correct.
    // 'occupying' must be (total grids occupied) - 1
    // so
    // 3x2 = 6
    // 6 - 1 = 5
    // Must have occupying of length 5.
    // (subtracting one because first box is the key)

    return merges
}

const getGridItemSpan = (gridItem: GridItem): string => {
    const spaces = [...gridItem.boxes]

    if (spaces.length === 1) {
        return ""
    } else {
        const sorted = [...spaces].sort((a, b) => a - b)
        const occupying = sorted.slice(1).join("-")
        const span: AllowedTailwindSpans | undefined = allowedPositiveMerges(sorted[0])[occupying]

        if (typeof span === "undefined") {
            throw new Error(`Boxes [${spaces.join(", ")}] can't be merged`)
        }

        return span
    }

}

export default getGridItemSpan