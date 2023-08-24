import { FC, memo, useCallback, useEffect, useRef, useState } from "react"
import { HiPlus, HiSearch, HiX } from "react-icons/hi"
import { Model } from "../../../../../../apis/models"
import permissions from "../../../../../../permissions"
import useCurrentUser from "../../../../../../reusable/hooks/useCurrentUser"
import Input from "../../../../../../reusable/Input/Input"
import SideNav from "../../../../../../reusable/SideNav/SideNav"
import BranchViewer from "../../../../CVIViewer/BranchViewer"
import CreateApiForm from "../../../../CVIViewer/CreateApiForm"
import { AnyNode, Branch } from "../Spec"

interface ListHalfProps {
    node_name: string
    model: Model
    onlyShow?: string[]
    onClickApi?: (api: string) => Promise<void>
}

const ListHalf: FC<ListHalfProps> = ({node_name, model, onlyShow, onClickApi}) => {
    const [search, setSearch] = useState("")
    const customApiSidenav = useState(false)
    const editingCustomNode = useState<null | [string, AnyNode]>(null)

    const selectedRef = useRef<HTMLDivElement | null>(null)

    const { profile } = useCurrentUser()

    const cvi = JSON.parse(model.cvi) as {
        [key: string]: Branch
    }

    useEffect(() => {
        selectedRef.current?.scrollIntoView()
    }, [])

    const filter = useCallback(node_name => {
        if (typeof onlyShow !== "undefined" && !onlyShow.includes(node_name)) {
            return false
        }
        return node_name.toLowerCase().includes(search.toLowerCase().trim())
    }, [search, onlyShow])

    return (
        <div className="flex flex-col w-full py-4 px-6 overflow-auto h-full border-r">
            <div className="flex w-full mb-2">
                <Input
                state={[search, setSearch]}
                placeholder="Search"
                Icon={search === "" ? HiSearch : HiX}
                IconOnClick={search === "" ? undefined : (() => {
                    setSearch("")
                })}
                />
            </div>
            {permissions.MODEL(profile, model).canEdit() && (
                <div className="flex flex-col mb-2 mt-1">
                    <SideNav
                    className="flex flex-col px-4 py-3 h-full"
                    width="450px"
                    trigger={<></>}
                    state={customApiSidenav}
                    >
                        <CreateApiForm editingNode={editingCustomNode[0]} />
                    </SideNav>
                    <div
                    className="flex items-center py-1 w-full text-slate-600 text-sm border-gray-100 px-2 leading-loose select-none cursor-pointer hover:bg-slate-100"
                    onClick={() => {
                        editingCustomNode[1](null)
                        customApiSidenav[1](true)
                    }}
                    >
                        <HiPlus className="mr-1" style={{transform: "scale(1.1)"}}/>
                        <span className="text-sm">New Wishlist API</span>
                    </div>
                </div>
            )}
            <div className="flex flex-col w-full h-full overflow-auto">
                {Object.entries(cvi).map(([name, node]) => {
                    return (
                        <BranchViewer
                        selectedRef={selectedRef}
                        key={name}
                        name={name}
                        node={node}
                        activeNodePath={node_name}
                        filter={filter}
                        onClickApi={onClickApi}
                        />
                    )
                })}
            </div>
        </div>
    )
}

const ListHalfMemoized = memo(ListHalf, (prevProps, nowProps) => {
    return (
        prevProps.node_name === nowProps.node_name &&
        prevProps.model.id === nowProps.model.id &&
        JSON.stringify(prevProps.model.custom_apis) === JSON.stringify(nowProps.model.custom_apis) &&
        prevProps.model.cvi === nowProps.model.cvi &&
        JSON.stringify(prevProps.onlyShow) === JSON.stringify(nowProps.onlyShow)
    )
})

export default ListHalfMemoized