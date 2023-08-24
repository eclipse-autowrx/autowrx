import { FC } from "react"
import { TableCellType } from "./parser/parseCJFromInput"

interface TokenTextProps {
    cell: TableCellType
}

const TokenText: FC<TokenTextProps> = ({cell}) => {
    return (
        <>
            {cell?.map((token, i) => {
                return token.type === "text" ? (
                    <span key={i}>{token.text}</span>
                ) : (
                    <a key={i} href={token.href} target="_blank" rel="noreferrer" className="text-slate-400">{token.text}</a>
                )
            })}
        </>
    )
}

export default TokenText