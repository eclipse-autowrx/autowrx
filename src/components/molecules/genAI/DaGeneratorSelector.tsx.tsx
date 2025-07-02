// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useRef, useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { TbSelector, TbStarFilled, TbCheck } from 'react-icons/tb'
import { AddOn } from '@/types/addon.type'
import { DaText } from '@/components/atoms/DaText'
import config from '@/configs/config'

type DaGeneratorSelectorProps = {
  builtInAddOns?: AddOn[]
  marketplaceAddOns?: AddOn[]
  userAIAddons?: AddOn[]
  onSelectedGeneratorChange: (addOn: AddOn) => void
}

const DaGeneratorSelector = ({
  builtInAddOns,
  marketplaceAddOns,
  userAIAddons,
  onSelectedGeneratorChange,
}: DaGeneratorSelectorProps) => {
  const [isExpandGenerator, setIsExpandGenerator] = useState(false)
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // useEffect(() => {
  //   console.log(`selectedAddOn`)
  //   console.log(selectedAddOn)
  // }, [selectedAddOn])

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
      if (userAIAddons && userAIAddons.length > 0) {
        setSelectedAddOn(userAIAddons[0])
        onSelectedGeneratorChange(userAIAddons[0])
      } else if (builtInAddOns && builtInAddOns.length > 0) {
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
      className="relative flex flex-col w-full text-da-gray-medium"
    >
      <DaButton
        variant="outline-nocolor"
        onClick={() => setIsExpandGenerator(!isExpandGenerator)}
        disabled={isLoading}
        className="mt-2 !shadow-sm hover:bg-da-gray-light"
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex w-full items-center">
            {selectedAddOn ? selectedAddOn.name : 'Select generator'}
            {selectedAddOn && selectedAddOn.id.includes(config.instance) && (
              <img
                src={config.instanceLogo}
                alt={config.instance}
                className="ml-2 h-10 w-10 object-contain"
              />
            )}
            {selectedAddOn && selectedAddOn.team && (
              <div className="ml-2 truncate rounded-full bg-da-primary-100 px-1 py-0 text-xs text-da-primary-500">
                GenAI Awards : {selectedAddOn.team}
              </div>
            )}
          </div>
          <TbSelector className="h-4 w-4" />
        </div>
      </DaButton>
      {isExpandGenerator && (
        <div className="absolute left-0 top-14 z-10 flex min-h-8 w-full flex-col space-y-1 rounded-md border border-da-gray-light bg-da-white p-1 text-sm">
          <div className="scroll-gray-small flex max-h-[150px] flex-col overflow-y-auto px-1">


            {userAIAddons && userAIAddons.length > 0 && <>
              <DaText variant="small-bold" className="p-1">
                My Generators
              </DaText>
              {userAIAddons.map((addOn) => (
                <div
                  key={addOn.id}
                  className="flex cursor-pointer items-center justify-between rounded hover:bg-da-gray-light"
                  onClick={() => handleAddOnSelect(addOn)}
                >
                  <div className="flex h-full min-h-10 w-full items-center justify-between px-1">
                    <div className="flex w-full items-center">
                      {addOn.name}
                    </div>
                    {selectedAddOn?.id === addOn.id && (
                      <TbCheck className="h-4 w-4 text-da-primary-500" />
                    )}
                  </div>
                </div>
              ))}
            </>
            }


            {builtInAddOns && builtInAddOns.length > 0 && <>
              <DaText variant="small-bold" className="p-1">
                Built-in Generators
              </DaText>
              {builtInAddOns.map((addOn) => (
                <div
                  key={addOn.id}
                  className="flex cursor-pointer items-center justify-between rounded hover:bg-da-gray-light"
                  onClick={() => handleAddOnSelect(addOn)}
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
            </>
            }

            {!config?.genAI?.hideMarketplace && (
              <>
                {marketplaceAddOns && marketplaceAddOns.length > 0 && (
                  <>
                    <DaText variant="small-bold" className="mt-1 p-1">
                      Marketplace Generators
                    </DaText>

                    {marketplaceAddOns.map((addOn) => (
                      <div
                        key={addOn.id}
                        className="flex cursor-pointer items-center justify-between rounded hover:bg-da-gray-light"
                        onClick={() => handleAddOnSelect(addOn)}
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
                            className={`h-4 w-4 text-da-gray-dark ${selectedAddOn?.id === addOn.id ? '' : 'hidden'
                              }`}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* {marketplaceAddOns && marketplaceAddOns.length === 0 && (
                  <div className="p-1">No marketplace generators found</div>
                )} */}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DaGeneratorSelector
