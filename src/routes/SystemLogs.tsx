import { useState, useEffect } from "react";
import axios from "axios";
import LoadingPage from "./components/LoadingPage";
import dayjs from "dayjs";

const SystemLogs = () => {
    const [logs, setLogs] = useState<any>([]);

    const [loading, setLoading] = useState<boolean>(false);
    const TABS = [
        { label: "User Visit", value: "visit" },
        // { label: 'Anonymous Visit', value: 'visits-anonymous' },
        { label: "Run Prototype", value: "run-prototype" },
        { label: "New Prototype", value: "new-prototype" },
        { label: "New Model", value: "new-model" },
    ];
    const [activeTab, setActiveTab] = useState<string>("visit");

    // useEffect(() => {
    //     fetchData()
    // }, [])

    useEffect(() => {
        // let filterLogs = logs.filter((log: any) => log.type.includes(activeTab))
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);

        // try {
        //     let from = dayjs().subtract(3, 'month').startOf("date").toDate()
        //     let to = dayjs().endOf("month").toDate()
        //     let res = await axios.get(`/.netlify/functions/listActivityLog?fromDate=${from}&toDate=${to}&create_by=25E5aQoekVbK0PLEjDpa7ylIswq2`)
        //     res.data.forEach((log: any) => {
        //         console.log(`${log.name} - ${log.type} - ${log.description} - ${log.created_time}`)
        //     })
        // } catch(err) {

        // }

        try {
            let from = dayjs().subtract(3, "day").startOf("date").toDate();
            let to = dayjs().endOf("month").toDate();
            let res = await axios.get(
                `/.netlify/functions/listActivityLog?fromDate=${from}&toDate=${to}&logType=${activeTab}`
            );
            if (res && res.data) {
                // console.log('cur', res.data)
                // sort res.data by created_time

                res.data.sort(
                    (a: any, b: any) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
                );
                setLogs(res.data);
            }
        } catch (err) {
            console.log(err);
        }
        setLoading(false);
    };

    if (loading) return <LoadingPage />;

    return (
        <div className="w-full min-h-[100vh] bg-white px-4 py-2 flex justify-center">
            <div className="w-[800px]">
                <div className="text-xl font-bold text-slate-700 mb-2 pl-4">System Logs</div>

                <div className="mt-4 mb-4">
                    {TABS.map((tab) => (
                        <div
                            key={tab.value}
                            className={`inline-block px-4 py-0.5 cursor-pointer hover:bg-emerald-100 ${
                                activeTab === tab.value
                                    ? "text-emerald-600 border-b-2 border-emerald-500"
                                    : "text-slate-700"
                            }`}
                            onClick={() => setActiveTab(tab.value)}
                        >
                            {tab.label}
                        </div>
                    ))}
                </div>

                <div className="">
                    {logs &&
                        logs.map((log) => (
                            <div key={log.id} className="border-b border-slate-200 px-4 py-1 mb-0.5 flex items-center">
                                <div className="text-[14px] text-slate-600 grow">{log.description}</div>
                                <div className="text-[11px] leading-none text-slate-400">
                                    {dayjs(log.created_time).format("MM/DD/YYYY HH:mm")}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default SystemLogs;
