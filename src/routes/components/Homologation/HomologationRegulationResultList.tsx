import React from "react";
import { RegulationRegion } from "./types";

type HomologationRegulationResultListProps = {
    regulationRegions: RegulationRegion[];
};

const HomologationRegulationResultList = ({ regulationRegions }: HomologationRegulationResultListProps) => {
    return (
        <>
            {regulationRegions.map((region) => (
                // Regulation Region
                <div key={region.name} className="space-y-2">
                    <p className="font-bold text-xl mt-5 flex items-center justify-start gap-4">
                        {region.name} Region
                        <img src="/imgs/EU_Flag.png" className="h-6 object-contain" alt="EU Flag" />
                    </p>
                    <div className="border-t my-6 border-t-400" />
                    <div>
                        {region.types.map((type) => (
                            // Regulation Type
                            <div key={type.name}>
                                <p className="font-bold mt-3 text-xl">{type.name}</p>
                                <ul className="space-y-6 mt-4">
                                    {type.regulations.map((regulation) => (
                                        // Regulation
                                        <li key={regulation.key} className="mt-3 list-disc ml-4 space-y-2">
                                            <p className="text-base font-bold">
                                                {regulation.key}: {regulation.titleShort}
                                            </p>
                                            <p className="text-base text-gray-600">{regulation.titleLong}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </>
    );
};

export default HomologationRegulationResultList;
