 import { FC } from "react"
 import useModelStore from "@/stores/modelStore";
import { Prototype } from "@/types/model.type";
import { DaButton } from "@/components/atoms/DaButton";

interface TabItemProps {
    children: any,
    active?: boolean
}

const TabItem : FC<TabItemProps> = ({children, active}) => {
    return <div className={`text-da-primary-500 da-label-regular py-1 px-4 min-w-20 
        cursor-pointer hover:opacity-70 hover:border-b-2 hover:border-da-primary-500
        ${active && 'border-b-2 border-da-primary-500'}`}>
        {children}
    </div>
}

const PagePrototypeDetail: FC = ({}) => {
    const [prototype] = useModelStore(
        (state) => [state.prototype as Prototype]
      );

    if (!prototype) {
    return <div className="container grid place-items-center">
        <div className="p-8 text-da-gray-dark da-label-huge">Prototype not found</div>
    </div>
    }
    
    return <div className="">
        <div className="px-4 py-2 flex bg-da-primary-500 text-da-white da-label-sub-title">
            {prototype.name}
            <div className="grow"></div>
        </div>
        <div className="flex px-6 py-0 bg-da-gray-light min-h-8">
            <TabItem>Journey</TabItem>
            <TabItem active>Architecture</TabItem>
            <TabItem>Code</TabItem>
            <TabItem>Flow</TabItem>
            <TabItem>Dashboard</TabItem>
            <TabItem>Homologation</TabItem>
            <TabItem>Feedback</TabItem>
        </div>
    </div>
}

export default PagePrototypeDetail