import { Bubble } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, PointElement } from "chart.js";
import { Props } from "../../../reusable/types";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Model, Prototype } from "../../../apis/models";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import { useEffect, useState } from "react";
ChartJS.register(LinearScale, PointElement, ChartDataLabels);
import axios from "axios";

const quadrants = {
    id: "quadrants",
    beforeDraw(chart: any, args: any, options: any) {
        const {
            ctx,
            chartArea: { left, top, right, bottom },
            scales: { x, y },
        } = chart;
        const midX = x.getPixelForValue(5);
        const midY = y.getPixelForValue(5);
        ctx.save();
        ctx.fillStyle = options.topLeft;
        ctx.fillRect(left, top, midX - left, midY - top);
        ctx.fillStyle = options.topRight;
        ctx.fillRect(midX, top, right - midX, midY - top);
        ctx.fillStyle = options.bottomRight;
        ctx.fillRect(midX, midY, right - midX, bottom - midY);
        ctx.fillStyle = options.bottomLeft;
        ctx.fillRect(left, midY, midX - left, bottom - midY);
        ctx.restore();
    },
};

const options: Props<typeof Bubble>["options"] = {
    scales: {
        y: {
            title: {
                text: "Relevance",
                display: true,
            },
            beginAtZero: true,
            grid: {
                display: false,
            },
            ticks: {
                stepSize: 1,
            },
            min: 0,
            max: 10,
        },
        x: {
            title: {
                text: "Needs addressed?",
                display: true,
            },
            beginAtZero: true,
            grid: {
                display: false,
            },
            ticks: {
                stepSize: 1,
            },
            min: 0,
            max: 10,
        },
    },
    onHover: (event, chartElement) => {
        // @ts-ignore
        event.native.target.style.cursor = chartElement[0] ? "pointer" : "default";
    },
    aspectRatio: 2.8,
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            enabled: false,
        },
        ["quadrants" as string]: {
            topLeft: "transparent",
            topRight: "transparent",
            bottomRight: "transparent",
            bottomLeft: "transparent",
        },
        ["datalabels" as string]: {
            anchor: "start",
            align: "start",
            formatter: (value: any) => value.label,
            offset: 6,
            padding: 0,
        },
    },
    onClick(event, elements, chart) {
        if (elements.length === 0) return;
        window.location.href = (elements[0].element as any).$context.raw.href;
    },
};

interface PortfolioProps {
    prototypes: Prototype[];
}

const Portfolio = ({ prototypes }: PortfolioProps) => {
    const model = useCurrentModel() as Model;
    const [allProtorypes, setAllPrototypes] = useState<any[]>([]);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (!prototypes) return;
        fetchFeedbackInfo();
    }, [prototypes]);

    const fetchFeedbackInfo = async () => {
        // console.log("fetching feedback info")
        let feedbacks = [] as any[];
        let protoData = [] as any[];
        try {
            let res = await axios.get(
                `/.netlify/functions/listFeedback?masterType=Prototype&&masterId=${prototypes
                    .map((f: any) => f.id)
                    .join(",")}`
            );
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                feedbacks = res.data;
            }
            // console.log(feedbacks)

            prototypes.forEach((prototype: any) => {
                let matchFeedbacks = feedbacks.filter((f: any) => f.master_id === prototype.id);
                // console.log("matchFeedbacks", matchFeedbacks)
                let retItem = {
                    label: prototype.name,
                    href: `/model/${model.id}/library/prototype/${prototype.id}/view/journey`,
                    x: 0,
                    y: 0,
                    r: 0,
                };
                if (matchFeedbacks.length > 0) {
                    retItem.x =
                        matchFeedbacks
                            .map((f: any) => f.score?.needAddress || 0)
                            .reduce((partialSum: number, a: number) => partialSum + a, 0) / matchFeedbacks.length ?? 0;
                    retItem.y =
                        matchFeedbacks
                            .map((f: any) => f.score?.relevance || 0)
                            .reduce((partialSum: number, a: number) => partialSum + a, 0) / matchFeedbacks.length ?? 0;
                    retItem.r =
                        matchFeedbacks
                            .map((f: any) => f.score?.easyToUse || 0)
                            .reduce((partialSum: number, a: number) => partialSum + a, 0) ?? 0;
                    protoData.push(retItem);
                } else {
                    if (prototype.portfolio) {
                        (retItem.x = prototype.portfolio?.needs_addressed ?? 0),
                            (retItem.y = prototype.portfolio?.relevance ?? 0),
                            (retItem.r = (prototype.portfolio?.effort_estimation ?? 0) * 5);
                    }
                }
                if (retItem.x + retItem.y + retItem.r > 0) {
                    protoData.push(retItem);
                }
            });
        } catch (err) {
            console.log((err as any)?.message);
        }
        setData({
            datasets: [
                {
                    data: protoData,
                    backgroundColor: "rgb(0, 80, 114)",
                },
            ],
        });
    };
    // const data = {
    //     datasets: [
    //         {
    //             data: prototypes
    //             .filter(prototype => typeof prototype.portfolio !== "undefined" && Number(prototype.portfolio?.needs_addressed) !== 0)
    //             .map(prototype => ({
    //                 label: prototype.name,
    //                 href: `/model/${model.id}/library/prototype/${prototype.id}/view/journey`,
    //                 x: prototype.portfolio?.needs_addressed ?? 0,
    //                 y: prototype.portfolio?.relevance ?? 0,
    //                 r: (prototype.portfolio?.effort_estimation ?? 0) * 5
    //             })),
    //             backgroundColor: "rgb(0, 80, 114)",
    //         },
    //     ],
    // };

    return (
        <div className="flex w-full h-full overflow-hidden p-10">
            {data && <Bubble options={options} data={data} plugins={[quadrants, ChartDataLabels]} />}
        </div>
    );
};

export default Portfolio;
