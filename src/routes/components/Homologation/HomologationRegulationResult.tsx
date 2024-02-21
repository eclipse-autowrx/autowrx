import React, { useCallback, useEffect, useState } from "react";
import LoadingPage from "../LoadingPage";
import {
    CertivityCredentials,
    Regulation,
    getCertivityCredentialsService,
    getCertivityRegulationsService,
    supportedCertivityApis,
} from "../../../apis/backend/certivityApi";
import { headerHeight } from "./constants";
import clsx from "clsx";
import dayjs, { Dayjs } from "dayjs";
import { RegulationRegion } from "./types";
import { API } from "../../../apis/backend/vehicleApi";
import HomologationRegulationResultList from "./HomologationRegulationResultList";

type HomologationRegulationResultProps = {
    selectedAPIs: Set<API>;
};

const HomologationRegulationResult = ({ selectedAPIs }: HomologationRegulationResultProps) => {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [regulationRegions, setRegulationRegions] = useState<RegulationRegion[]>([]);

    // Separate regulations by region, type and regulation
    const formatRegulations = (regulations: Regulation[]) => {
        let formattedRegulations: RegulationRegion[] = [];

        regulations.forEach((regulation) => {
            // Regulation Region
            let region = formattedRegulations.find((r) => r.name === regulation.region);
            if (!region) {
                region = {
                    name: regulation.region,
                    types: [],
                };
                formattedRegulations.push(region);
            }

            // Regulation Type
            let type = region.types.find((t) => t.name === regulation.type);
            if (!type) {
                type = {
                    name: regulation.type,
                    regulations: [],
                };
                region.types.push(type);
            }

            // Regulation
            type.regulations.push({
                key: regulation.key,
                titleShort: regulation.titleShort,
                titleLong: regulation.titleLong,
            });
        });

        // Sort regulations by key
        formattedRegulations.forEach((region) => {
            region.types.forEach((type) => {
                type.regulations.sort((a, b) => {
                    try {
                        const aNum = parseInt(a.key.replace(/^[^0-9]+/g, ""));
                        const bNum = parseInt(b.key.replace(/^[^0-9]+/g, ""));
                        return aNum - bNum;
                    } catch (error) {
                        return a.key.localeCompare(b.key);
                    }
                });
            });
        });

        return formattedRegulations;
    };

    const retrieveCertivityCredentials = useCallback(async () => {
        let cre: CertivityCredentials | null = null;
        let lastCredentialsTime: Dayjs | null = null;

        // Try to retrieve data from local storage
        const localCre = localStorage.getItem("certivity-credentials");
        if (localCre) {
            cre = JSON.parse(localCre);
        }
        const localCreTime = localStorage.getItem("certivity-credentials-time");
        if (localCreTime) {
            lastCredentialsTime = dayjs(localCreTime);
        }

        if (!cre || !lastCredentialsTime || lastCredentialsTime.add(cre.expires_in - 5, "seconds").isBefore(dayjs())) {
            cre = await getCertivityCredentialsService();
            localStorage.setItem("certivity-credentials", JSON.stringify(cre));
            localStorage.setItem("certivity-credentials-time", dayjs().toISOString());
        }
        if (!cre) throw new Error("No credentials found");
        return cre;
    }, []);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);

                // Fetch regulations based on used APIs
                if (selectedAPIs.size > 0) {
                    const credentials = await retrieveCertivityCredentials();

                    const regulationsResponse = await getCertivityRegulationsService(
                        credentials.access_token,
                        Array.from(selectedAPIs.values())
                            .map((api) => api.name)
                            .filter((value) => supportedCertivityApis.has(value))
                    );
                    if (!regulationsResponse) throw new Error("No regulations found");
                    setRegulationRegions(formatRegulations(regulationsResponse));

                    setErrorMsg("");
                } else {
                    setRegulationRegions([]);
                }
            } catch (error) {
                setErrorMsg("Error fetching regulations");
                console.error(error);
            } finally {
                setLoading(false);
            }
        })();
    }, [retrieveCertivityCredentials, selectedAPIs]);

    return (
        <div
            className="scroll-gray flex-1 overflow-y-auto pr-5"
            style={{
                height: `calc(100vh - ${headerHeight}px)`,
            }}
        >
            <div className="h-5" />
            <div
                className={clsx(
                    "bg-gray-50 p-5 min-h-[calc(100%-40px)] rounded-3xl",
                    (errorMsg || regulationRegions.length === 0 || loading) && "h-[calc(100%-40px)]"
                )}
            >
                <h1 className="font-bold text-3xl mb-2">Regulatory Compliance</h1>
                {loading ? (
                    <div className="flex items-center justify-center h-[calc(100%-50px)]">
                        <LoadingPage />
                    </div>
                ) : (
                    <div
                        className={clsx(
                            "space-y-7 mt-4",
                            (errorMsg || regulationRegions.length === 0) &&
                                "flex items-center justify-center h-[calc(100%-60px)]"
                        )}
                    >
                        {errorMsg ? (
                            <div className="h-full w-full flex items-center justify-center italic text-gray-600">
                                {"<" + errorMsg + ">"}
                            </div>
                        ) : regulationRegions.length === 0 ? (
                            <div className="h-full w-full flex items-center justify-center italic text-gray-600">
                                {"<Please select a supported API>"}
                            </div>
                        ) : (
                            <HomologationRegulationResultList regulationRegions={regulationRegions} />
                        )}
                    </div>
                )}
            </div>
            <div className="h-3" />
        </div>
    );
};

export default HomologationRegulationResult;
