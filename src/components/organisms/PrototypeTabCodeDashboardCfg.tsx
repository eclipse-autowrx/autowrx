import { FC, useState } from 'react'
import { shallow } from "zustand/shallow";
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type';
import DaDashboardEditor from '../molecules/DaDashboardEditor';

const PrototypeTabCodeDashboardCfg: FC = ({ }) => {
    const [prototype, setActivePrototype] = useModelStore((state) => [
        state.prototype as Prototype,
        state.setActivePrototype
    ], shallow)
    const [dashboardCfg, setDashboardCfg] = useState<string | undefined>(undefined)
    const [editable, setEditable] = useState<boolean>(true)
    const [useApis, setUseApis] = useState<any[]>([])

    const saveDashboardCfgToDb = (config: string) => {
        console.log(`saveDashboardCfgToDb`)
        console.log(config)
        let newPrototype = JSON.parse(JSON.stringify(prototype))
        newPrototype.widget_config = config || ''
        setActivePrototype(newPrototype)
    }

    if(!prototype) {
        return <></>
    }

    return <>
        <DaDashboardEditor
            widgetConfigString={prototype.widget_config}
            editable={editable}
            usedAPIs={useApis}
            onDashboardConfigChanged={saveDashboardCfgToDb}
        />
    </>
}

export default PrototypeTabCodeDashboardCfg