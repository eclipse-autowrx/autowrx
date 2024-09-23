import DaHomologationUsedAPIs from './DaHomologationUsedAPIs'
import HomologationVehicleProperties from './DaHomologationVehicleProperties'
import { headerHeight } from './constants'
import HomologationPoweredBy from './DaHomologationPoweredBy'
import { VehicleAPI } from '@/types/api.type'
import DaGenAI_HomologationUsedAPIs from './DaGenAI_HomologationUsedAPIs'
import { useEffect } from 'react'

type HomologationLeftSectionProps = {
  selectedAPIs: Set<VehicleAPI>
  setSelectedAPIs: (apis: Set<VehicleAPI>) => void
  isWizard?: boolean
}

const HomologationLeftSection = ({
  selectedAPIs,
  setSelectedAPIs,
  isWizard,
}: HomologationLeftSectionProps) => {
  return (
    <div
      className="flex flex-1 flex-col pt-5 pl-5"
      style={{
        height: `calc(100vh - ${headerHeight}px)`,
      }}
    >
      <div className="flex-[3] min-h-0">
        {!isWizard ? (
          <DaHomologationUsedAPIs
            selectedAPIs={selectedAPIs}
            setSelectedAPIs={setSelectedAPIs}
          />
        ) : (
          <DaGenAI_HomologationUsedAPIs
            selectedAPIs={selectedAPIs}
            setSelectedAPIs={setSelectedAPIs}
          />
        )}
      </div>
      <div className="flex-[2] mt-5 min-h-0">
        <HomologationVehicleProperties />
      </div>
      {!isWizard && (
        <div className="h-fit flex-shrink-0 mt-4 flex flex-col">
          <p className="da-label-tiny text-center flex-shrink-0 text-da-gray-medium">
            This prototype is powered by
          </p>
          <HomologationPoweredBy />
        </div>
      )}
    </div>
  )
}

export default HomologationLeftSection
