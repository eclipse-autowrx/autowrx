// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import { RegulationRegion } from './types'

type HomologationRegulationResultListProps = {
  regulationRegions: RegulationRegion[]
}

const HomologationRegulationResultList = ({
  regulationRegions,
}: HomologationRegulationResultListProps) => {
  return (
    <>
      {regulationRegions.map((region) => (
        // Regulation Region
        <div key={region.name} className="space-y-2">
          <p className="font-bold da-label-sub-title mt-5 flex items-center justify-start gap-4">
            {region.name} Region
            <img
              src="/imgs/EU_Flag.png"
              className="h-6 object-contain"
              alt="EU Flag"
            />
          </p>
          <div className="border-t my-6 border-t-da-gray-medium" />
          <div>
            {region.types.map((type) => (
              // Regulation Type
              <div key={type.name}>
                <p className="font-bold mt-3 da-label-sub-title">{type.name}</p>
                <ul className="space-y-6 mt-4">
                  {type.regulations.map((regulation) => (
                    // Regulation
                    <li
                      key={regulation.key}
                      className="mt-3 list-disc ml-4 space-y-2"
                    >
                      <p className="da-label-regular font-bold">
                        {regulation.key}: {regulation.titleShort}
                      </p>
                      <p className="da-label-regular text-da-gray-medium">
                        {regulation.titleLong}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export default HomologationRegulationResultList
