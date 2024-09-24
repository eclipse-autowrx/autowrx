import { useEffect, useState } from 'react'
import { TbStarFilled, TbCheck } from 'react-icons/tb'
import { AddOn } from '@/types/addon.type'
import { DaText } from '@/components/atoms/DaText'
import config from '@/configs/config'
import { cn } from '@/lib/utils'

type DaGeneratorSelectorProps = {
  builtInAddOns?: AddOn[]
  marketplaceAddOns?: AddOn[]
  onSelectedGeneratorChange: (addOn: AddOn) => void
  onClick?: () => void
}

const DaGeneratorSelectPopup = ({
  builtInAddOns,
  marketplaceAddOns,
  onSelectedGeneratorChange,
  onClick,
}: DaGeneratorSelectorProps) => {
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Function to save the selected generator to localStorage
  const saveSelectedGeneratorToLocalStorage = (addOn: AddOn) => {
    localStorage.setItem('lastUsedGenAIWizardGenerator', JSON.stringify(addOn))
  }

  // Function to retrieve the selected generator from localStorage
  const getSelectedGeneratorFromLocalStorage = (): AddOn | null => {
    const storedAddOn = localStorage.getItem('lastUsedGenAIWizardGenerator')
    return storedAddOn ? JSON.parse(storedAddOn) : null
  }

  useEffect(() => {
    const lastUsedGenAI = getSelectedGeneratorFromLocalStorage()
    // console.log('lastUsedGenAI', lastUsedGenAI)
    if (lastUsedGenAI) {
      setSelectedAddOn(lastUsedGenAI)
    }
  }, [])

  useEffect(() => {
    if (selectedAddOn) {
      // If we already have a selected add-on, we don't need to run this effect
      return
    }

    // Check localStorage for a saved generator
    const storedAddOn = getSelectedGeneratorFromLocalStorage()
    if (storedAddOn) {
      // If there's a stored generator, use that
      setSelectedAddOn(storedAddOn)
      onSelectedGeneratorChange(storedAddOn)
      return
    }

    // Otherwise, fall back to selecting the first available generator
    if (builtInAddOns && builtInAddOns.length > 0) {
      setSelectedAddOn(builtInAddOns[0])
      onSelectedGeneratorChange(builtInAddOns[0])
      saveSelectedGeneratorToLocalStorage(builtInAddOns[0]) // Save to localStorage
    } else if (marketplaceAddOns && marketplaceAddOns.length > 0) {
      setSelectedAddOn(marketplaceAddOns[0])
      onSelectedGeneratorChange(marketplaceAddOns[0])
      saveSelectedGeneratorToLocalStorage(marketplaceAddOns[0]) // Save to localStorage
    }
  }, [
    builtInAddOns,
    marketplaceAddOns,
    selectedAddOn,
    onSelectedGeneratorChange,
  ])

  useEffect(() => {
    const fetchTimeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false)
      }
    }, 5000)

    return () => clearTimeout(fetchTimeout)
  }, [isLoading])

  const handleAddOnSelect = (addOn: AddOn) => {
    setSelectedAddOn(addOn)
    onSelectedGeneratorChange(addOn)
    saveSelectedGeneratorToLocalStorage(addOn) // Save the new selection to localStorage
  }

  return (
    <div className="relative flex flex-col text-da-gray-medium">
      <div className="flex mt-2 min-h-8 w-full flex-col space-y-1 rounded-md bg-da-white text-sm">
        <div className="flex h-[80vh] max-h-[500px] pr-3 flex-col overflow-y-auto">
          {builtInAddOns && builtInAddOns.length > 0 && (
            <div className="flex flex-col h-1/2 ">
              <DaText variant="small-bold" className="p-1 border-b">
                Built-in AI Generators
              </DaText>
              <div className="flex flex-col h-full overflow-y-auto pr-2 mt-2">
                {builtInAddOns.map((addOn) => (
                  <div
                    key={addOn.id}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded hover:bg-da-gray-light',
                      selectedAddOn?.id === addOn.id && 'bg-gray-100',
                    )}
                    onClick={() => {
                      handleAddOnSelect(addOn)
                      onClick && onClick()
                    }}
                  >
                    <div className="flex h-full min-h-10 w-full items-center justify-between px-1">
                      <div className="flex w-full items-center">
                        {addOn.name}
                        {addOn.id.includes(config.instance) && (
                          <img
                            src={config.instanceLogo}
                            alt={config.instance}
                            className="ml-2 h-8 w-8 object-contain"
                          />
                        )}
                        {addOn.team && (
                          <div className="ml-2 rounded-full bg-da-primary-100 px-1 py-0 text-xs text-da-primary-500">
                            GenAI Awards: {addOn.team}
                          </div>
                        )}
                        {addOn.rating && (
                          <div className="ml-3 flex items-center justify-center text-xs">
                            <TbStarFilled className="mr-0.5 h-3 w-3 text-yellow-400" />
                            {addOn.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                      {selectedAddOn?.id === addOn.id && (
                        <TbCheck className="h-4 w-4 text-da-primary-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!config?.genAI?.hideMarketplace && (
            <>
              {marketplaceAddOns && (
                <div className="flex flex-col h-1/2">
                  <DaText variant="small-bold" className="mt-4 p-1 border-b">
                    Marketplace AI Generators
                  </DaText>

                  <div className="flex flex-col h-full overflow-y-auto pr-2 mt-2">
                    {marketplaceAddOns.map((addOn) => (
                      <div
                        key={addOn.id}
                        className={cn(
                          'flex cursor-pointer items-center justify-between rounded hover:bg-da-gray-light',
                          selectedAddOn?.id === addOn.id && 'bg-gray-100',
                        )}
                        onClick={() => {
                          handleAddOnSelect(addOn)
                          onClick && onClick()
                        }}
                      >
                        <div className="flex h-full min-h-10 w-full items-center justify-between px-1">
                          <div className="flex w-full items-center">
                            {addOn.name}
                            {addOn.team && (
                              <div className="ml-2 rounded-full bg-da-primary-100 px-1 py-0 text-xs text-da-primary-500">
                                GenAI Awards : {addOn.team}
                              </div>
                            )}
                            {addOn.rating && (
                              <div className="ml-3 flex items-center justify-center text-xs">
                                <TbStarFilled className="mr-0.5 h-3 w-3 text-yellow-400" />
                                {addOn.rating.toFixed(1)}
                              </div>
                            )}
                          </div>
                          <TbCheck
                            className={`h-4 w-4 text-da-primary-500 ${
                              selectedAddOn?.id === addOn.id ? '' : 'hidden'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {marketplaceAddOns && marketplaceAddOns.length === 0 && (
                <div className="flex w-full h-1/2 justify-center">
                  No marketplace AI generators found
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DaGeneratorSelectPopup
