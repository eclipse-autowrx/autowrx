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
    <div className="w-full overflow-y-auto scroll-gray">
      <div className="flex gap-5 min-h-[calc(100%-20px)]">
        {/* Left section */}
        <HomologationLeftSection
          selectedAPIs={selectedAPIs}
          setSelectedAPIs={setSelectedAPIs}
          isWizard={isWizard}
        />

        {/* Divider */}
        <div className="border-r mt-5 mb-2  border-r-gray-200" />

        {/* Right section */}
        <HomologationRegulationResult selectedAPIs={selectedAPIs} />
      </div>
    </div>
  )
}

export default Homologation
