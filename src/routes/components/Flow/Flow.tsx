import { useState, useEffect } from "react";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";
import { Prototype } from "../../../apis/models";
import EAComponents from "../Analysis/EAComponents";
import DisplayImage from "../PrototypeOverview/DisplayImage";
import { FiArrowRightCircle } from "react-icons/fi";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

const SAMPLE_FLOW = {
    title: "System-of-Systems - enabled by SaaS Factory",
    subjects: ["Enterprise", "Cloud", "V2C API", "SDV", "S2S API", "Vehicle"],
    streams: [
        {
            title: "Subscrible ",
            subjects: {
                Cloud: "Subscribe to Replenishment Service",
            },
        },
        {
            title: "Detect Need",
            subjects: {
                "V2C API": "vehicle.Body.Windshield.Front.WasherFluid.IsLevelLow",
                SDV: "Detect event",
                "S2S API": "vehicle.Body.Windshield.Front.WasherFluid.IsLevelLow",
                Vehicle: "Wiper system",
            },
        },
        {
            title: "Replenish",
            subjects: {
                Cloud: "Check CRM, ERP, start shipment",
            },
        },
        {
            title: "Refill",
            subjects: {
                SDV: "Update Status",
                "S2S API": "vehicle.Body.Windshield.Front.WasherFluid.IsLevelLow",
                Vehicle: "Wiper system",
            },
        },
    ],
};

const IconResolve = ({ text }) => {
    //<i className="fa fa-camera-retro"></i>
    if (!text) return <></>;
    let ret = text
        .split(" ")
        .map((word: string) => {
            switch (word) {
                case "=>":
                    return `<i class="fa fa-arrow-right"></i>`;
                case "<=":
                    return `<i class="fa fa-arrow-left"></i>`;
                default:
                    if (word.startsWith("fa-")) {
                        return `<i class="fa ${word}"></i>`;
                    } else {
                        return word;
                    }
            }
        })
        .join(" ");
    return <div dangerouslySetInnerHTML={{ __html: ret }}></div>;
};

const Flow = ({ appCode }) => {
    const DEFAULT_TITLE = "System-of-Systems";
    const DEFAULT_SUBJECT = ["Enterprise", "Cloud", "<= V2C API =>", "SDV", "<= S2S API =>", "Vehicle"];

    const prototype = useCurrentPrototype() as Prototype;
    const [flowTitle, setFlowTitle] = useState<string>(DEFAULT_TITLE);

    const [flowSubjects, setFlowSubjects] = useState<any>(DEFAULT_SUBJECT);
    const [streamNames, setStreamNames] = useState<string[] | null>(null);
    const [streams, setStreams] = useState<string[] | null>(null);

    useEffect(() => {
        if (!appCode) {
            return;
        }
        if (!streamNames) {
            return;
        }
        let tmpStreams: any[] = [];
        streamNames.forEach((streamName: string) => {
            let stream = {
                title: streamName,
                subjects: {} as any,
                ordered_subjects: [] as any[],
            };
            tmpStreams.push(stream);
        });

        if (appCode) {
            let appCodeLines = appCode.split("\n");
            let curSlowSubjects = flowSubjects;
            tmpStreams.forEach((tmpStream: any) => {
                let streamName = tmpStream.title;
                if (!tmpStream) return;

                appCodeLines.forEach((line: string, index: number) => {
                    let tmpLine = String(line).trim();
                    if (tmpLine.startsWith(`## SoS:`)) {
                        let lineSubs = tmpLine
                            .substring(tmpLine.indexOf(":") + 1)
                            .trim()
                            .split(",");
                        if (lineSubs.length >= 0) {
                            lineSubs = lineSubs.map((subject: string) => {
                                return subject.trim();
                            });
                        }
                        curSlowSubjects = lineSubs || curSlowSubjects;
                        setFlowSubjects(curSlowSubjects);
                    }

                    if (tmpLine.startsWith(`## (${streamName})[`)) {
                        let indexOfCloseBracket = tmpLine.indexOf("]");
                        if (indexOfCloseBracket < 0) return;
                        let tmpSubject = tmpLine.substring(tmpLine.indexOf("[") + 1, indexOfCloseBracket);
                        if (tmpSubject && curSlowSubjects.includes(tmpSubject)) {
                            let content = tmpLine.substring(indexOfCloseBracket + 1).trim();
                            if (content.length <= 0) {
                                content = appCodeLines[index + 1] || "";
                            }
                            tmpStream.subjects[tmpSubject] = content;
                            tmpStream.ordered_subjects.push({
                                subject: tmpSubject,
                                content: content,
                            });
                        } else {
                            console.log(`curSlowSubjects not includes ${tmpSubject}`);
                        }
                    }
                });
            });
        }

        setStreams(tmpStreams);
    }, [streamNames, appCode]);

    useEffect(() => {
        if (!prototype.customer_journey) {
            setStreamNames(null);
            return;
        }
        const streamsName = findStreamFromCustomerJourney(prototype.customer_journey);
        if (!streamsName || streamsName.length === 0) {
            setStreamNames(null);
            return;
        }
        setStreamNames(streamsName);
    }, [prototype.customer_journey]);

    const findStreamFromCustomerJourney = (customer_journey: string) => {
        if (!customer_journey) {
            return [];
        }
        let lines = customer_journey.split("\n");
        let streams = [] as string[];
        lines.forEach((line: string) => {
            let tmpLine = String(line).trim();
            if (tmpLine.startsWith("#")) {
                streams.push(tmpLine.substring(1).trim());
            }
        });

        return streams;
    };

    const getColumnBgColor = (subject: string) => {
        if (subject && subject.toLowerCase().includes("api")) {
            return "bg-[#93A45A44]";
        }
        return "";
    };
    return (
        <div className="flex flex-col relative w-full h-full p-0 md:p-4">
            {prototype && (
                <>
                    {streams && streams.length > 0 && (
                        <div className="w-full h-full text-gray-800">
                            <div className="w-full py-0 px-4 text-[22px] border-2 bg-gray-200 font-bold text-center truncate select-none">
                                {flowTitle}
                            </div>

                            <table className="w-full table-fixed text-md bg-gray-50">
                                <thead>
                                    <tr className="text-[18px]">
                                        <th className="py-1 px-1 text-center w-[40px]"></th>
                                        {flowSubjects &&
                                            flowSubjects.map((subject: any, sIndex: number) => (
                                                <th
                                                    key={sIndex}
                                                    className={`border-2 py-1 px-1 text-center ${getColumnBgColor(
                                                        subject
                                                    )}`}
                                                >
                                                    <div className="flex items-center justify-center">
                                                        <IconResolve text={subject} />
                                                    </div>
                                                </th>
                                            ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {streams &&
                                        streams.map((stream: any, sIndex: number) => (
                                            <>
                                                <tr key={sIndex} className="text-[18px] font-bold text-white truncate">
                                                    <td
                                                        colSpan={flowSubjects.length + 1}
                                                        className="px-4 py-2 border-2 bg-gradient-to-r from-aiot-blue to-aiot-blue-l"
                                                    >
                                                        <div className="flex items-center">
                                                            <FiArrowRightCircle size={26} />
                                                            <div className="ml-4 truncate grow">
                                                                {/* {stream.title} */}
                                                                <IconResolve text={stream.title} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {stream.ordered_subjects.length > 0 ? (
                                                    <>
                                                        {stream.ordered_subjects.map((row: any, sIndex: number) => {
                                                            let matchSubject = null;
                                                            let matchCol = -1;
                                                            flowSubjects.forEach(
                                                                (flowSubject: any, flowIndex: number) => {
                                                                    if (flowSubject === row.subject) {
                                                                        matchCol = flowIndex;
                                                                    }
                                                                }
                                                            );
                                                            if (matchCol == -1) return <></>;
                                                            return (
                                                                <tr
                                                                    key={sIndex}
                                                                    className="min-h-[60px] text-gray-900 text-[14px] font-normal"
                                                                >
                                                                    <td></td>
                                                                    {[...Array(matchCol).keys()].map(
                                                                        (item: any, iIndex: number) => (
                                                                            <td
                                                                                className={`py-1 px-2 text-left border-2 ${getColumnBgColor(
                                                                                    flowSubjects[iIndex]
                                                                                )}`}
                                                                                key={iIndex}
                                                                            ></td>
                                                                        )
                                                                    )}
                                                                    <td
                                                                        className={`py-1 px-2 text-left border-2 ${getColumnBgColor(
                                                                            flowSubjects[matchCol]
                                                                        )}`}
                                                                    >
                                                                        <div className="min-h-[30px] leading-tight break-all">
                                                                            <IconResolve text={row.content || ""} />
                                                                        </div>
                                                                    </td>
                                                                    {[
                                                                        ...Array(
                                                                            flowSubjects.length - matchCol - 1
                                                                        ).keys(),
                                                                    ].map((item: any, iIndex: number) => (
                                                                        <td
                                                                            className={`py-1 px-2 text-left border-2 ${getColumnBgColor(
                                                                                flowSubjects[matchCol + iIndex + 1]
                                                                            )}`}
                                                                            key={iIndex}
                                                                        ></td>
                                                                    ))}
                                                                </tr>
                                                            );
                                                        })}

                                                        {/* // {flowSubjects && flowSubjects.map((subject: any, sIndex: number) => {
                                        //     if (stream.subjects && stream.subjects[subject]) {
                                        //         return <tr key={sIndex + 0.01} className="min-h-[60px] text-gray-900 text-[14px] font-normal">
                                        //             <td></td>
                                        //             {[...Array(sIndex).keys()].map((item: any, iIndex: number) => <td className='py-1 px-2 text-left border-2' key={iIndex}></td>)}
                                        //             <td className='py-1 px-2 text-left border-2'>
                                        //                 <div className='min-h-[30px] leading-tight break-all'>
                                        //                     <IconResolve text={stream.subjects[subject] || ''}/>
                                        //                 </div>
                                        //             </td>
                                        //             {[...Array(flowSubjects.length - sIndex - 1).keys()].map((item: any, iIndex: number) => <td className='py-1 px-2 text-left border-2' key={iIndex}></td>)}
                                        //         </tr>
                                        //     }
                                        // })} */}
                                                    </>
                                                ) : (
                                                    <tr>
                                                        <td></td>
                                                        {flowSubjects &&
                                                            flowSubjects.map((subject: any, sIndex: number) => (
                                                                <td
                                                                    key={sIndex}
                                                                    className={`border-2 py-1 px-2 text-left select-none ${getColumnBgColor(
                                                                        subject
                                                                    )}`}
                                                                >
                                                                    <div className="min-h-[60px] leading-tight break-words"></div>
                                                                </td>
                                                            ))}
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {(!streams || streams.length == 0) && prototype.analysis_image_file && (
                        <div className="flex relative mx-auto mt-8">
                            <DisplayImage image_file={prototype.analysis_image_file ?? ""} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Flow;
