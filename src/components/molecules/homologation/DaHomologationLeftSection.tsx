// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import DaHomologationUsedAPIs from './DaHomologationUsedAPIs'
import HomologationVehicleProperties from './DaHomologationVehicleProperties'
import { headerHeight } from './constants'
import HomologationPoweredBy from './DaHomologationPoweredBy'
import { VehicleAPI } from '@/types/api.type'
import { useEffect } from 'react'

type HomologationLeftSectionProps = {
  selectedAPIs: Set<VehicleAPI>
  setSelectedAPIs: (apis: Set<VehicleAPI>) => void
}

const HomologationLeftSection = ({
  selectedAPIs,
  setSelectedAPIs,
}: HomologationLeftSectionProps) => {
  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto pt-5 pl-5">
      <div className="flex-[3] min-h-0">
        <DaHomologationUsedAPIs
          selectedAPIs={selectedAPIs}
          setSelectedAPIs={setSelectedAPIs}
        />
      </div>
      <div className="flex-[2] mt-5 min-h-0">
        <HomologationVehicleProperties />
      </div>
      <div className="h-fit flex-shrink-0 mt-4 flex flex-col">
        <p className="da-label-tiny text-center flex-shrink-0 text-da-gray-medium">
          This prototype is powered by
        </p>
        <HomologationPoweredBy />
      </div>
    </div>
  )
}

export default HomologationLeftSection
