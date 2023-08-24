import { MonitorType } from "../../../hooks/useCviApiMonitor"

interface CVIApiMonitorProps {
    monitor: MonitorType
}

const CVIApiMonitor = ({monitor}: CVIApiMonitorProps) => {    
    return (
        <div className="border-t border-gray-700 px-5 bg-gray-800 text-white h-full overflow-auto scroll-gray">
            <div className="flex pb-2 pt-4">
                <table className="table-auto w-full h-fit text-xs">
                    <thead>
                        <tr>
                            <td className="bg-gray-700 p-2">VSS API</td>
                            <td className="bg-gray-700 p-2">Last value</td>
                            <td className="bg-gray-700 p-2">#times called</td>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(monitor).map(([n, {value, called}]) => {
                            return (
                                <tr key={n}>
                                    <td className="p-2">{n}</td>
                                    <td className="p-2">{typeof value !== "boolean" ? value : (value ? "True" : "False")}</td>
                                    <td className="p-2">{called}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default CVIApiMonitor