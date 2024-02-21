import { useState, useEffect } from "react";
import axios from "axios";
import LoadingPage from "./components/LoadingPage";
import dayjs from "dayjs";
import { DateRangePicker } from "react-date-range";
import Dropdown from "../reusable/Dropdown";

{
    /* <DateRangePicker
        ranges={[selectionRange]}
        onChange={onDateRangeChange}
    /> 

    const selectionRange = {
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection',
    }

    const onDateRangeChange = () => {

    }
*/
}

const DateRange = ({ onDateChange }) => {
    const [range, setRange] = useState<any>(null);
    const [mode, setMode] = useState<string>("week");
    const [activeState, setActiveState] = useState<string>("");

    const OPTIONS = ["This month", "Last month", "This week", "Last week"]; // "Custom"

    useEffect(() => {
        if (mode === "month") {
            setActiveState("This month");
        } else if (mode === "week") {
            setActiveState("This week");
        } else if (mode === "custom") {
            setActiveState("Custom");
        }
    }, []);

    useEffect(() => {
        if (range && onDateChange) {
            onDateChange(range);
        }
    }, [range]);

    useEffect(() => {
        switch (activeState) {
            case "This month":
                setRange({
                    startDate: dayjs().startOf("month").toDate(),
                    endDate: dayjs().endOf("month").toDate(),
                });
                break;
            case "Last month":
                setRange({
                    startDate: dayjs().add(-1, "month").startOf("month").toDate(),
                    endDate: dayjs().add(-1, "month").endOf("month").toDate(),
                });
                break;
            case "This week":
                setRange({
                    startDate: dayjs().startOf("week").toDate(),
                    endDate: dayjs().endOf("week").toDate(),
                });
                break;
            case "Last week":
                setRange({
                    startDate: dayjs().add(-1, "week").startOf("week").toDate(),
                    endDate: dayjs().add(-1, "week").endOf("week").toDate(),
                });
                break;
            case "Custom":
                // setRange({
                //     startDate: dayjs().add(-1,"week").startOf("week").toDate(),
                //     endDate: dayjs().add(-1,"week").endOf("week").toDate()
                // })
                break;
            default:
                break;
        }
    }, [activeState]);

    return (
        <Dropdown
            trigger={
                <div
                    className="w-[320px] py-1 flex font-semibold bg-slate-100 rounded 
                text-slate-500 text-sm justify-center items-center cursor-pointer
                hover:bg-slate-200"
                >
                    <div className="font-bold font-mono mr-2">{activeState}</div>
                    {range && (
                        <div className="font-mono">
                            {range.startDate.toLocaleDateString()} - {range.endDate.toLocaleDateString()}
                        </div>
                    )}
                </div>
            }
        >
            <div className="w-full p-2 bg-slate-100 font-mono text-sm">
                {OPTIONS.map((option, index) => (
                    <div
                        key={index}
                        onClick={() => {
                            setActiveState(option);
                        }}
                        className="px-4 py-1 bg-slate-100 hover:bg-slate-300 cursor-pointer border-b"
                    >
                        {option}
                    </div>
                ))}
            </div>
        </Dropdown>
    );
};

const UseMetrix = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [range, setRange] = useState<any>(null);
    const [logs, setLogs] = useState<any>([]);
    const [userActivities, setUserActivities] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    /*
        TYPE
        visit
        visits-anonymous
        run-prototype
        new-prototype
        new-model
    */

    useEffect(() => {
        if (range && users.length > 0) {
            fetchAllData(range.startDate, range.endDate);
        }
    }, [range, users]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchDataForDateRange = async (from: Date, to: Date) => {
        if (!from || !to) return;

        try {
            let res = await axios.get(`/.netlify/functions/listActivityLog?fromDate=${from}&toDate=${to}`);
            if (res && res.data) {
                // res.data.sort((a: any,b:any) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime())
                return res.data;
            }
        } catch (err) {
            console.log(err);
        }
        return [];
    };

    const fetchUsers = async () => {
        try {
            let res = await axios.get(`/.netlify/functions/listAllUserBasic`);
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                // console.log("users", res.data)
                setUsers(res.data);
            }
        } catch (err) {
            console.log(err);
        }
    };

    const fetchAllData = async (from: Date, to: Date) => {
        if (!from || !to) return;
        setLoading(true);
        setUserActivities([]);
        const numOfDate = Math.ceil(dayjs(to).diff(dayjs(from), "day", true));
        // console.log(`numOfDate: ${numOfDate}`)
        let dayPerPack = 4;
        let numOfPack = Math.ceil(numOfDate / dayPerPack);
        // console.log(`numOfPack: ${numOfPack}`)

        let totalLogs = [];
        // if(!users || users.length === 0) {
        //     await fetchUsers()
        //     await new Promise(resolve => setTimeout(resolve, 200))
        // }

        for (let i = 0; i < numOfPack; i++) {
            // console.log(`${i*dayPerPack} - ${(i+1)*dayPerPack}`)
            let subFrom = dayjs(from)
                .add(i * dayPerPack, "day")
                .startOf("date")
                .toDate();
            let subTo = dayjs(from)
                .add((i + 1) * dayPerPack, "day")
                .startOf("date")
                .toDate();
            if (i === numOfPack - 1) {
                subTo = dayjs(to).endOf("date").toDate();
            }
            // console.log(`[${i}] subRange: ${subFrom} - ${subTo}}`)
            let subLogs = await fetchDataForDateRange(subFrom, subTo);
            // console.log(`numOfLog ${subLogs.length}`)
            totalLogs = totalLogs.concat(subLogs);
            // setLogs(totalLogs)
        }

        processLogData(totalLogs);

        setLoading(false);
    };

    const increaseCount = (log: any, item: any) => {
        if (log.type === "visit") {
            item.visit++;
        }
        if (log.type === "visits-anonymous") {
            item.visits_anonymous++;
        }
        if (log.type === "run-prototype") {
            item.run_prototype++;
        }
        if (log.type === "new-model") {
            item.new_model++;
        }
        if (log.type === "new-model") {
            item.new_model++;
        }
    };

    const processLogData = (logs: any[]) => {
        let userItems = [] as any[];
        if (!logs && !Array.isArray(logs)) {
            setUserActivities(userItems);
        }

        logs.forEach((log: any) => {
            let matchUser = userItems.find((item: any) => item.create_by === log.create_by) as any;
            if (matchUser) {
                // matchUser.logs.push(log)
                matchUser.logsCount++;
                increaseCount(log, matchUser);
            } else {
                let matchUser = users.find((user: any) => user.uid === log.create_by);
                let userItem = {
                    create_by: log.create_by,
                    logsCount: 1,
                    visit: 0,
                    run_prototype: 0,
                    new_model: 0,
                    new_prototype: 0,
                    visits_anonymous: 0,
                } as any;
                if (matchUser) {
                    userItem.name = matchUser.name;
                    userItem.email = matchUser.email;
                    userItem.provider = matchUser.provider;
                    userItem.image_file = matchUser.image_file;
                } else {
                    console.log(`user not ${log.create_by} match ${users.length}`);
                }
                increaseCount(log, userItem);

                userItems.push(userItem);
            }
        });
        userItems.sort((a: any, b: any) => b.logsCount - a.logsCount);
        // console.log(userItems)
        setUserActivities(userItems);
    };

    return (
        <div className="w-full flex justify-center pt-2">
            <div className="w-full max-w-[1280px]">
                <div className="text-bold text-2xl text-slate-700 flex font-bold items-center border-b border-slate-300 py-1 px-4">
                    <div className="w-[200px]">Use Metrix</div>
                    <div className="grow font-normal text-lg"> Users: {users.length}</div>
                    <div>
                        <DateRange onDateChange={setRange} />
                    </div>
                </div>

                <div className="mt-4">
                    <div className="w-full flex items-center justify-center text-sm bg-slate-100 py-2">
                        <div className="w-[500px]">User</div>
                        <div className="w-[140px] text-right">Activity</div>
                        <div className="w-[140px] text-right">Visit</div>
                        <div className="w-[140px] text-right">Run Prototype</div>
                        <div className="w-[140px] text-right">New Model</div>
                        <div className="w-[140px] text-right">New Prototype</div>
                    </div>

                    {loading && <LoadingPage />}
                    <div className="max-h-[75vh] overflow-auto">
                        {userActivities &&
                            userActivities.map((item: any) => (
                                <div
                                    key={item.create_by}
                                    className="w-full flex items-center justify-center py-1 border-b"
                                >
                                    <div className="w-[500px] flex items-center">
                                        <div className="w-[48px] h-[48px]">
                                            <img
                                                className="w-full h-full rounded-sm"
                                                src={item.image_file || "/imgs/profile.png"}
                                                style={{ objectFit: "cover" }}
                                                onError={({ currentTarget }) => {
                                                    currentTarget.onerror = null; // prevents looping
                                                    currentTarget.src = "/imgs/profile.png";
                                                }}
                                            />
                                        </div>
                                        <div className="grow px-2">
                                            <div className="font-bold">{item.name || item.create_by}</div>
                                            <div className="text-sm">{item.email}</div>
                                        </div>
                                    </div>
                                    <div className="w-[140px] text-right">{item.logsCount}</div>
                                    <div className="w-[140px] text-right">{item.visit}</div>
                                    <div className="w-[140px] text-right">{item.run_prototype}</div>
                                    <div className="w-[140px] text-right">{item.new_model}</div>
                                    <div className="w-[140px] text-right">{item.new_prototype}</div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UseMetrix;
