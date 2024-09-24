import { useState } from 'react'
import HomologationLeftSection from './DaHomologationLeftSection'
import HomologationRegulationResult from './DaHomologationRegulationResult'
import { VehicleAPI } from '@/types/api.type'

interface HomologationProps {
  isWizard?: boolean
}

const Homologation = ({ isWizard }: HomologationProps) => {
  const [selectedAPIs, setSelectedAPIs] = useState<Set<VehicleAPI>>(new Set([]))

  return (
    <div className="flex h-full w-full">
      <div className="flex gap-5 w-1/2">
        {/* Left section */}
        <HomologationLeftSection
          selectedAPIs={selectedAPIs}
          setSelectedAPIs={setSelectedAPIs}
          isWizard={isWizard}
        />
        {/* Divider */}
        <div className="border-r mt-5 mb-2  border-r-gray-200" />
      </div>
      {/* Right section */}
      <div className="flex w-1/2 pl-5 h-full">
        <HomologationRegulationResult selectedAPIs={selectedAPIs} />
      </div>
    </div>
  )
}

export default Homologation
