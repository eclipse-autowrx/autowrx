import { useState, useEffect } from "react";
import axios from "axios";
import LoadingPage from "./components/LoadingPage";
import dayjs from "dayjs";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

const BarChart = ({ data, title }) => {
    ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

    const options: ChartOptions<"bar"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
                position: "bottom",
            },
            title: {
                display: true,
                text: title || "",
            },
        },
    };

    if (!data) return <LoadingPage />;

    return <Bar options={options} data={data} />;
};

const Percent = ({ cur, pre }) => {
    const [percent, setPercent] = useState<number>(0);
    useEffect(() => {
        if (!pre) {
            setPercent(Math.round(cur * 100));
            return;
        }
        return setPercent(Math.round(((cur - pre) / pre) * 100));
    }, [cur, pre]);
    return (
        <>
            {percent > 0 && <span className="text-green-500 text-sm font-normal ml-2">+{percent}%</span>}
            {percent == 0 && <span className="text-gray-500 text-sm font-normal ml-2">{percent}%</span>}
            {percent < 0 && <span className="text-red-500 text-sm font-normal ml-2">{percent}%</span>}
        </>
    );
};

const Dashboard = () => {
    const [timeMode, setTimeMode] = useState<"week" | "month">("month");

    const [totalUsers, setTotalUsers] = useState<any>([]);
    const [totalModels, setTotalModels] = useState<any>([]);
    const [totalPrototypes, setTotalPrototypes] = useState<any>([]);
    const [totalVisits, setTotalVisits] = useState<any>([]);
    const [totalRuns, setTotalRuns] = useState<any>([]);

    const [users, setUsers] = useState<any>([]);
    const [models, setModels] = useState<any>([]);
    const [prototypes, setPrototypes] = useState<any>([]);
    const [visits, setVisits] = useState<any>([]);
    const [runs, setRuns] = useState<any>([]);

    const [usersPre, setUsersPre] = useState<any>([]);
    const [modelsPre, setModelsPre] = useState<any>([]);
    const [prototypesPre, setPrototypesPre] = useState<any>([]);
    const [visitsPre, setVisitsPre] = useState<any>([]);
    const [runsPre, setRunsPre] = useState<any>([]);

    const [usersPrePre, setUsersPrePre] = useState<any>([]);
    const [modelsPrePre, setModelsPrePre] = useState<any>([]);
    const [prototypesPrePre, setPrototypesPrePre] = useState<any>([]);
    const [visitsPrePre, setVisitsPrePre] = useState<any>([]);
    const [runsPrePre, setRunsPrePre] = useState<any>([]);

    const [loading, setLoading] = useState<boolean>(false);

    const [checkedArray, setCheckedArray] = useState(["New Prototype", "Run Prototype", "Visit"]);

    const [visitChartData, setVisitChartData] = useState<any>({ labels: [], datasets: [] });
    const [runChartData, setRunChartData] = useState<any>({ labels: [], datasets: [] });
    const [userChartData, setUserChartData] = useState<any>({ labels: [], datasets: [] });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setVisitChartData(generateChartData([...visitsPre, ...visits], "Visit"));
        setRunChartData(generateChartData([...runsPre, ...runs], "Run"));
        setUserChartData(generateChartData([...usersPre, ...users], "User"));
    }, [visitsPre, visits]);

    useEffect(() => {
        setTotalModels([...modelsPrePre, ...modelsPre, ...models]);
        setTotalUsers([...usersPrePre, ...usersPre, ...users]);
        setTotalPrototypes([...prototypesPrePre, ...prototypesPre, ...prototypes]);
        setTotalVisits([...visitsPrePre, ...visitsPre, ...visits]);
        setTotalRuns([...runsPrePre, ...runsPre, ...runs]);
    }, [runsPrePre, runsPre, runs]);

    const fetchData = async () => {
        setLoading(true);

        try {
            let from = dayjs().startOf("month").toDate();
            let to = dayjs().endOf("month").toDate();
            let res = await axios.get(`/.netlify/functions/summaryListData?fromDate=${from}&toDate=${to}`);
            if (res && res.data) {
                setModels(res.data.models);
                setUsers(res.data.users);
                setPrototypes(res.data.prototypes);
                setVisits(res.data.visits);
                setRuns(res.data.runs);
            }
        } catch (err) {
            console.log(err);
        }

        try {
            let from = dayjs().subtract(1, "months").startOf("month").toDate();
            let to = dayjs().subtract(1, "months").endOf("month").toDate();
            let res = await axios.get(`/.netlify/functions/summaryListData?fromDate=${from}&toDate=${to}`);
            if (res && res.data) {
                setModelsPre(res.data.models);
                setUsersPre(res.data.users);
                setPrototypesPre(res.data.prototypes);
                setVisitsPre(res.data.visits);
                setRunsPre(res.data.runs);
            }
        } catch (err) {
            console.log(err);
        }

        try {
            // let from = dayjs("2000-01-01").toDate()
            // let to = dayjs("3000-01-01").toDate()
            let from = dayjs().subtract(2, "months").startOf("month").toDate();
            let to = dayjs().subtract(2, "months").endOf("month").toDate();
            let res = await axios.get(`/.netlify/functions/summaryListData?fromDate=${from}&toDate=${to}`);
            if (res && res.data) {
                setModelsPrePre(res.data.models);
                setUsersPrePre(res.data.users);
                setPrototypesPrePre(res.data.prototypes);
                setVisitsPrePre(res.data.visits);
                setRunsPrePre(res.data.runs);
            }
        } catch (err) {
            console.log(err);
        }

        setLoading(false);
    };

    const generateChartData = (datas, label) => {
        if (!datas) return { labels: [], datasets: [] };
        let labels: string[] = [];
        let datasets: any[] = [
            {
                label: label,
                data: [],
                backgroundColor: "#aebd38",
                borderRadius: 4,
            },
        ];

        datas.forEach((data) => {
            data.created_time = new Date(data.created_time);
        });

        for (let i = 30; i >= 0; i--) {
            let dateObj = dayjs().subtract(i, "d");
            let from = dateObj.startOf("day").toDate();
            let to = dateObj.endOf("day").toDate();
            let label = dateObj.format("MMM DD");
            labels.push(label);
            let count = datas.filter((data) => data.created_time >= from && data.created_time <= to).length;
            datasets[0].data.push(count);
        }

        const data = {
            labels: labels,
            datasets: datasets,
        };

        return data;
    };

    if (loading) return <LoadingPage />;

    return (
        <div className="w-full min-h-[100vh] bg-slate-100 px-4 py-2">
            <div className="text-xl font-bold text-slate-700 mb-2 pl-4">Last 3 months</div>

            <div className="grid grid-cols-5 justify-center">
                <div className="h-[100px] bg-white rounded shadow-lg m-2 flex flex-col justify-center items-center">
                    <div className="text-4xl font-bold text-slate-600">{(totalModels && totalModels.length) || 0}</div>
                    <div className="text-lg text-slate-500">Total Models</div>
                </div>

                <div className="h-[100px] bg-white rounded shadow-lg m-2 flex flex-col justify-center items-center">
                    <div className="text-4xl font-bold text-slate-600">
                        {(totalPrototypes && totalPrototypes.length) || 0}
                    </div>
                    <div className="text-lg text-slate-500">Total Prototypes</div>
                </div>

                <div className="h-[100px] bg-white rounded shadow-lg m-2 flex flex-col justify-center items-center">
                    <div className="text-4xl font-bold text-slate-600">{(totalRuns && totalRuns.length) || 0}</div>
                    <div className="text-lg text-slate-500">Prototype Run Count</div>
                </div>

                <div className="h-[100px] bg-white rounded shadow-lg m-2 flex flex-col justify-center items-center">
                    <div className="text-4xl font-bold text-slate-600">{(totalUsers && totalUsers.length) || 0}</div>
                    <div className="text-lg text-slate-500">Total Users</div>
                </div>

                <div className="h-[100px] bg-white rounded shadow-lg m-2 flex flex-col justify-center items-center">
                    <div className="text-4xl font-bold text-slate-600">{(totalVisits && totalVisits.length) || 0}</div>
                    <div className="text-lg text-slate-500">Total Visit</div>
                </div>
            </div>

            <div className="text-xl font-bold text-slate-700 mt-6 mb-2 pl-4">This month</div>

            <div className="grid grid-cols-5 justify-center">
                <div className="h-[100px] bg-white rounded shadow-lg m-2 flex flex-col justify-center items-center">
                    <div className="text-4xl font-bold text-slate-600">
                        {(models && models.length) || 0}
                        <Percent cur={(models && models.length) || 0} pre={(modelsPre && modelsPre.length) || 0} />
                    </div>
                    <div className="text-lg text-slate-500">New Models</div>
                </div>

                <div className="h-[100px] bg-white rounded shadow-lg m-2 flex flex-col justify-center items-center">
                    <div className="text-4xl font-bold text-slate-600">
                        {(prototypes && prototypes.length) || 0}
                        <Percent
                            cur={(prototypes && prototypes.length) || 0}
                            pre={(prototypesPre && prototypesPre.length) || 0}
                        />
                    </div>
                    <div className="text-lg text-slate-500">New Prototypes</div>
                </div>

                <div className="h-[100px] bg-white rounded shadow-lg m-2 flex flex-col justify-center items-center">
                    <div className="text-4xl font-bold text-slate-600">
                        {(runs && runs.length) || 0}
                        <Percent cur={(runs && runs.length) || 0} pre={(runsPre && runsPre.length) || 200} />
                    </div>
                    <div className="text-lg text-slate-500">Prototype Run Count</div>
                </div>

                <div className="h-[100px] bg-white rounded shadow-lg m-2 flex flex-col justify-center items-center">
                    <div className="text-4xl font-bold text-slate-600">
                        {(users && users.length) || 0}
                        <Percent cur={(users && users.length) || 0} pre={(usersPre && usersPre.length) || 0} />
                    </div>
                    <div className="text-lg text-slate-500">New Users</div>
                </div>

                <div className="h-[100px] bg-white rounded shadow-lg m-2 flex flex-col justify-center items-center">
                    <div className="text-4xl font-bold text-slate-600">
                        {(visits && visits.length) || 0}
                        <Percent cur={(visits && visits.length) || 0} pre={(visitsPre && visitsPre.length) || 200} />
                    </div>
                    <div className="text-lg text-slate-500">New Visit</div>
                </div>
            </div>

            <div className="px-2">
                <div className="h-[220px] mt-4 bg-white px-4 py-2 rounded shadow-lg">
                    <BarChart data={visitChartData} title="Visit history" />
                </div>
            </div>

            <div className="px-2">
                <div className="h-[220px] mt-4 bg-white px-4 py-2 rounded shadow-lg">
                    <BarChart data={runChartData} title="Prototype Run History" />
                </div>
            </div>

            <div className="px-2">
                <div className="h-[220px] mt-4 bg-white px-4 py-2 rounded shadow-lg">
                    <BarChart data={userChartData} title="New User History" />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
