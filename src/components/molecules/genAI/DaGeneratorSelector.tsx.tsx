import { useEffect, useRef, useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { TbSelector, TbStarFilled, TbCheck } from 'react-icons/tb'
import { AddOn } from '@/types/addon.type'
import { DaText } from '@/components/atoms/DaText'
import config from '@/configs/config'

type DaGeneratorSelectorProps = {
  builtInAddOns?: AddOn[]
  marketplaceAddOns?: AddOn[]
  onSelectedGeneratorChange: (addOn: AddOn) => void
}

const DaGeneratorSelector = ({
  builtInAddOns,
  marketplaceAddOns,
  onSelectedGeneratorChange,
}: DaGeneratorSelectorProps) => {
  const [isExpandGenerator, setIsExpandGenerator] = useState(false)
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsExpandGenerator(false)
    }
  }

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true)
    return () => {
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [])

  useEffect(() => {
    if (!selectedAddOn) {
      if (builtInAddOns && builtInAddOns.length > 0) {
        setSelectedAddOn(builtInAddOns[0])
        onSelectedGeneratorChange(builtInAddOns[0])
      } else if (marketplaceAddOns && marketplaceAddOns.length > 0) {
        setSelectedAddOn(marketplaceAddOns[0])
        onSelectedGeneratorChange(marketplaceAddOns[0])
      }
    }
  }, [builtInAddOns, marketplaceAddOns])

  useEffect(() => {
    const fetchTimeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false) // Stop loading after 5s if still loading
      }
    }, 5000)

    return () => clearTimeout(fetchTimeout)
  }, [isLoading])

  const handleAddOnSelect = (addOn: AddOn) => {
    setSelectedAddOn(addOn)
    onSelectedGeneratorChange(addOn)
    setIsExpandGenerator(false)
  }

  return (
    <div
      ref={dropdownRef}
      className="flex flex-col mb-auto relative text-da-gray-medium"
    >
      <DaButton
        variant="outline-nocolor"
        onClick={() => setIsExpandGenerator(!isExpandGenerator)}
        disabled={isLoading}
        className="mt-2 hover:bg-da-gray-light"
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center w-full">
            {selectedAddOn ? selectedAddOn.name : 'Select generator'}
            {selectedAddOn && selectedAddOn.id.includes(config.instance) && (
              <img
                src={config.instanceLogo}
                alt={config.instance}
                className="ml-2 w-10 h-10 object-contain"
              />
            )}
            {selectedAddOn && selectedAddOn.team && (
              <div className="text-xs px-1 py-0 ml-2 rounded-full bg-da-primary-100 text-da-primary-500 truncate">
                GenAI Awards : {selectedAddOn.team}
              </div>
            )}
          </div>
          <TbSelector className="w-4 h-4" />
        </div>
      </DaButton>
      {isExpandGenerator && (
        <div className="absolute flex flex-col top-14 left-0 w-full z-10 min-h-8 border bg-da-white rounded-md border-da-gray-light shadow p-1 text-sm space-y-1">
          <div className="flex flex-col max-h-[150px] overflow-y-auto scroll-gray-small px-1">
            {builtInAddOns && builtInAddOns.length > 0 && (
              <>
                <DaText variant="small-bold">Built-in Generators</DaText>
                {builtInAddOns.map((addOn) => (
                  <div
                    key={addOn.id}
                    className="flex rounded items-center justify-between cursor-pointer hover:bg-da-gray-light"
                    onClick={() => handleAddOnSelect(addOn)}
                  >
                    <div className="flex w-full h-full min-h-10 px-1 items-center justify-between">
                      <div className="flex w-full items-center">
                        {addOn.name}
                        {addOn.id.includes(config.instance) && (
                          <img
                            src={config.instanceLogo}
                            alt={config.instance}
                            className="ml-2 w-8 h-8 object-contain"
                          />
                        )}
                        {addOn.team && (
                          <div className="text-xs px-1 py-0 ml-2 rounded-full bg-da-primary-100 text-da-primary-500">
                            GenAI Awards: {addOn.team}
                          </div>
                        )}
                        {addOn.rating && (
                          <div className="flex items-center justify-center text-xs ml-3">
                            <TbStarFilled className="w-3 h-3 mr-0.5 text-yellow-400" />
                            {addOn.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                      {selectedAddOn?.id === addOn.id && (
                        <TbCheck className="w-4 h-4 text-da-gray-dark" />
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {marketplaceAddOns && (
              <>
                <DaText variant="small-bold" className="mt-2">
                  Marketplace Generators
                </DaText>

                {marketplaceAddOns.map((addOn) => (
                  <div
                    key={addOn.id}
                    className="flex rounded items-center justify-between cursor-pointer hover:bg-da-gray-light "
                    onClick={() => handleAddOnSelect(addOn)}
                  >
                    <div className="flex w-full h-full min-h-10 px-1 items-center justify-between">
                      <div className="flex w-full items-center">
                        {addOn.name}
                        {addOn.team && (
                          <div className="text-xs px-1 py-0 ml-2 rounded-full bg-da-primary-100 text-da-primary-500">
                            GenAI Awards : {addOn.team}
                          </div>
                        )}
                        {addOn.rating && (
                          <div className="flex items-center justify-center text-xs ml-3">
                            <TbStarFilled className="w-3 h-3 mr-0.5 text-yellow-400" />
                            {addOn.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <TbCheck
                        className={`w-4 h-4 text-da-gray-dark ${
                          selectedAddOn?.id === addOn.id ? '' : 'hidden'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}

            {marketplaceAddOns && marketplaceAddOns.length === 0 && (
              <div className="p-1">No marketplace generators found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DaGeneratorSelector
