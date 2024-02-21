export type RegulationSingle = {
    key: string;
    titleShort: string;
    titleLong: string;
};

export type RegulationType = {
    name: string;
    regulations: RegulationSingle[];
};

export type RegulationRegion = {
    name: string;
    types: RegulationType[];
};
