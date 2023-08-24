import { Bubble } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
  } from "chart.js";
import { Props } from "../../../reusable/types";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Model, Prototype } from "../../../apis/models";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
ChartJS.register(LinearScale, PointElement, ChartDataLabels);

const quadrants = {
    id: 'quadrants',
    beforeDraw(chart: any, args: any, options: any) {
        const {ctx, chartArea: {left, top, right, bottom}, scales: {x, y}} = chart;
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
    }
};

const options: Props<typeof Bubble>["options"] = {
    scales: {
        y: {
            title: {
                text: "Relevance",
                display: true
            },
            beginAtZero: true,
            grid: {
                display: false
            },
            ticks: {
                stepSize: 1
            },
            min: 0,
            max: 10,
        },
        x: {
            title: {
                text: "Needs addressed?",
                display: true
            },
            beginAtZero: true,
            grid: {
                display: false
            },
            ticks: {
                stepSize: 1
            },
            min: 0,
            max: 10,
        }
    },
    onHover: (event, chartElement) => {
        // @ts-ignore
        event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
    },
    aspectRatio: 2.8,
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            enabled: false
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
            padding: 0
        }
    
    },
    onClick(event, elements, chart) {
        if (elements.length === 0) return;
        window.location.href = (elements[0].element as any).$context.raw.href
    },
};

interface PortfolioProps {
    prototypes: Prototype[]
}

const Portfolio = ({prototypes}: PortfolioProps) => {
    const model = useCurrentModel() as Model
    const data = {
        datasets: [
            {
                data: prototypes
                .filter(prototype => typeof prototype.portfolio !== "undefined")
                .map(prototype => ({
                    label: prototype.name,
                    href: `/model/${model.id}/library/prototype/${prototype.id}/view/feedback`,
                    x: prototype.portfolio?.needs_addressed ?? 0,
                    y: prototype.portfolio?.relevance ?? 0,
                    r: (prototype.portfolio?.effort_estimation ?? 0) * 5
                })),
                backgroundColor: "rgb(0, 80, 114)",
            },
        ],
    };
    
    
    return (
        <div className="flex w-full h-full overflow-hidden p-10">
            <Bubble options={options} data={data} plugins={[quadrants, ChartDataLabels]} />
        </div>
    )
}

export default Portfolio