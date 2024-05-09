/*
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, registerables, ChartOptions } from "chart.js";
import { ENDUSER_FEATURES, ENDUSER_FEATURES_NAME } from ".";
import Button from "../../reusable/Button";
import { TbSelector } from "react-icons/tb";

Chart.register(...registerables);

export interface FeatureAnalysisProps {
    data: any;
    rawLogData: any;
}

const FeatureAnalysis = ({ data, rawLogData }: FeatureAnalysisProps) => {
    const [filteredData, setFilteredData] = useState(data);
    const [isExpanded, setIsExpanded] = useState(false);
    const TIME_FILTER = ["All time", "Yesterday", "Last week", "Last month", "Last year"];
    const [timeFilter, setTimeFilter] = useState(TIME_FILTER[0]);

    const filterDataByTimeFrame = (data, timeFrame) => {
        // Check if data is an array
        if (!Array.isArray(rawLogData)) {
            console.error("Data is not an array:", rawLogData);
            return []; // Return an empty array or handle accordingly
        }

        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        return rawLogData.filter((entry) => {
            const createdDate = new Date(entry.created_time);
            const timeDifference = now.getTime() - createdDate.getTime();
            const daysDifference = timeDifference / (24 * 60 * 60 * 1000); // milliseconds in a day

            switch (timeFrame) {
                case "Yesterday":
                    return createdDate.toDateString() === yesterday.toDateString();
                case "Last week":
                    return daysDifference <= 7;
                case "Last month":
                    return daysDifference <= 30;
                case "Last year":
                    return daysDifference <= 365;
                case "All time":
                default:
                    return true;
            }
        });
    };

    useEffect(() => {
        const filteredRawData = filterDataByTimeFrame(rawLogData, timeFilter);

        // Process data to get counts of end-user features
        let processData = filteredRawData.reduce((acc, curr) => {
            if (Object.keys(ENDUSER_FEATURES).includes(curr.type)) {
                const featureName = ENDUSER_FEATURES_NAME[curr.type];
                acc[featureName] = (acc[featureName] || 0) + 1;
            }
            return acc;
        }, {});
        // Update filteredData state
        setFilteredData(processData);
    }, [rawLogData, timeFilter]);

    const hexToRGBA = (hex, alpha = 1) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const colorScheme = ["#ced4da"].map((color) => hexToRGBA(color));

    const chartData = {
        labels: Object.keys(filteredData),
        datasets: [
            {
                label: "Used",
                data: Object.values(filteredData),
                backgroundColor: Object.keys(filteredData).map((_, index) => colorScheme[index % colorScheme.length]),
                borderWidth: 1,
            },
        ],
    };

    const chartOptions: ChartOptions<"bar"> = {
        layout: {
            padding: {
                top: 20, // Adjust this value as needed
            },
        },
        plugins: {
            datalabels: {
                anchor: "end",
                align: "end",
            },
            legend: {
                display: false,
            },
        },
    };

    return (
        <div className="flex flex-col w-full h-full items-center justify-center">
            <div className="flex w-full px-4 justify-end relative">
                <Button
                    variant="white"
                    className="flex bg-white justify-end hover:text-aiot-blue w-fit"
                    icon={TbSelector}
                    onClick={() => {
                        setIsExpanded(!isExpanded);
                    }}
                >
                    {timeFilter}
                </Button>
                {isExpanded && (
                    <div className="absolute flex flex-col top-10 right-4 bg-white z-10 rounded border border-gray-200 shadow-sm cursor-pointer">
                        {TIME_FILTER.map((time) => (
                            <div
                                className="flex h-50% rounded hover:bg-gray-100 items-center text-gray-600 group justify-between px-2 py-1 m-1"
                                key={time}
                                onClick={() => {
                                    setTimeFilter(time);
                                    setIsExpanded(false);
                                }}
                            >
                                <div className="flex text-sm mr-2">{time}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex pt-2 w-[90%] h-auto">
                <Bar data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default FeatureAnalysis;

*/

export default {}
