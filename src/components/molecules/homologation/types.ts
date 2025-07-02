// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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
