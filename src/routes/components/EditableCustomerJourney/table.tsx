import { FC } from 'react';
import { HiOutlineArrowCircleRight } from 'react-icons/hi';
import { TableCellType, TableDataType } from './parser/parseCJFromInput';

const TableHeader: FC<{
    keys: string[]
}> = ({keys}) => {
    return (
        <thead>
            <tr>
                {keys.map((key, index) => {
                    const color1 = ["white", "#003a6f", "#004a6f", "#276177", "#396c6e", "#75906f", "#a6b445", "#83b445", "#58b445", "#45b45e", "#006f4d"]
                    return (
                    <th style={{ backgroundColor: color1[index], color: "white" }} key={key}>
                        <div className="flex items-center">
                            <HiOutlineArrowCircleRight size="2em" className="mr-2" />
                            {key}
                        </div>
                    </th>
                    )
                })}
            </tr>
        </thead>
    )
}

const RenderCell: FC<{
    cell: TableCellType
}> = ({cell}) => {
    return (
        <td>
            {cell?.map((token, i) => {
                return token.type === "text" ? (
                    <span key={i}>{token.text}</span>
                ) : (
                    <a key={i} href={token.href} target="_blank" rel="noreferrer" className="text-slate-400">{token.text}</a>
                )
            })}
        </td>
    )
}

const RenderRow: FC<{
    keys: string[]
    row: {
        [key: string]: TableCellType
    }
}> = ({keys, row}) => {
    return (
        <tr>
            {keys.map((key, index) => {
                return <RenderCell key={key} cell={row[key]} />
            })}
        </tr>
    )
}

const TableBody: FC<{
    keys: string[],
    data: TableDataType
}> = ({keys, data}) => {
    return (
        <tbody>
            {data.map((row, index) => <RenderRow key={index} row={row} keys={keys} />)}
        </tbody>
    )
}

interface TableProps {
    data: TableDataType
}

const Table: FC<TableProps> = ({data}) => {
    const keys = Object.keys(data).length === 0 ? [] : Object.keys(data[0]);
    
    return keys.length === 0 ? null : (
        <div className="ui container" >
            <table className="ui definition table celled">
                <TableHeader keys={keys} />
                <TableBody keys={keys} data={data} />
            </table>
        </div>
    )
}

export default Table