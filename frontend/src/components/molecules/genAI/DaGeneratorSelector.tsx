// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/atoms/button'
import { TbSelector, TbStarFilled, TbCheck } from 'react-icons/tb'
import { AddOn } from '@/types/addon.type'
import { cn } from '@/lib/utils'
import { getConfig } from '@/utils/siteConfig'

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
  const [instanceLogo, setInstanceLogo] = useState<string>('')
  const [marketplaceUrl, setMarketplaceUrl] = useState<string>('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load site config for instance logo and marketplace URL
  useEffect(() => {
    const loadConfig = async () => {
      const logo = await getConfig('SITE_LOGO_WIDE', 'site', undefined, '')
      const marketplace = await getConfig('GENAI_MARKETPLACE_URL', 'site', undefined, '')
      setInstanceLogo(logo)
      setMarketplaceUrl(marketplace)
    }
    loadConfig()
  }, [])

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
  }, [builtInAddOns, marketplaceAddOns, userAIAddons, onSelectedGeneratorChange])

  const handleAddOnSelect = (addOn: AddOn) => {
    setSelectedAddOn(addOn)
    onSelectedGeneratorChange(addOn)
    setIsExpandGenerator(false)
  }

  return (
    <div
      ref={dropdownRef}
      className="relative flex flex-col w-full text-muted-foreground"
    >
      <Button
        variant="outline"
        onClick={() => setIsExpandGenerator(!isExpandGenerator)}
        className="mt-2 shadow-sm hover:bg-muted"
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex w-full items-center">
            {selectedAddOn ? selectedAddOn.name : 'Select generator'}
            {selectedAddOn && instanceLogo && selectedAddOn.id.includes('autowrx') && (
              <img
                src={instanceLogo}
                alt="instance"
                className="ml-2 h-10 w-10 object-contain"
              />
            )}
            {selectedAddOn && selectedAddOn.team && (
              <div className="ml-2 truncate rounded-full bg-primary/10 px-1 py-0 text-xs text-primary">
                GenAI Awards : {selectedAddOn.team}
              </div>
            )}
          </div>
          <TbSelector className="h-4 w-4" />
        </div>
      </Button>
      {isExpandGenerator && (
        <div className="absolute left-0 top-14 z-10 flex min-h-8 w-full flex-col space-y-1 rounded-md border border-border bg-background p-1 text-sm shadow-lg">
          <div className="flex max-h-[150px] flex-col overflow-y-auto px-1">
            {userAIAddons && userAIAddons.length > 0 && (
              <>
                <div className="p-1 text-sm font-semibold text-foreground">
                  My Generators
                </div>
                {userAIAddons.map((addOn) => (
                  <div
                    key={addOn.id}
                    className="flex cursor-pointer items-center justify-between rounded hover:bg-muted"
                    onClick={() => handleAddOnSelect(addOn)}
                  >
                    <div className="flex h-full min-h-10 w-full items-center justify-between px-1">
                      <div className="flex w-full items-center">
                        {addOn.name}
                      </div>
                      {selectedAddOn?.id === addOn.id && (
                        <TbCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {builtInAddOns && builtInAddOns.length > 0 && (
              <>
                <div className="p-1 text-sm font-semibold text-foreground">
                  Built-in Generators
                </div>
                {builtInAddOns.map((addOn) => (
                  <div
                    key={addOn.id}
                    className="flex cursor-pointer items-center justify-between rounded hover:bg-muted"
                    onClick={() => handleAddOnSelect(addOn)}
                  >
                    <div className="flex h-full min-h-10 w-full items-center justify-between px-1">
                      <div className="flex w-full items-center">
                        {addOn.name}
                        {instanceLogo && addOn.id.includes('autowrx') && (
                          <img
                            src={instanceLogo}
                            alt="instance"
                            className="ml-2 h-8 w-8 object-contain"
                          />
                        )}
                        {addOn.team && (
                          <div className="ml-2 rounded-full bg-primary/10 px-1 py-0 text-xs text-primary">
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
                        <TbCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {marketplaceUrl && marketplaceUrl.trim() !== '' && (
              <>
                {marketplaceAddOns && marketplaceAddOns.length > 0 && (
                  <>
                    <div className="mt-1 p-1 text-sm font-semibold text-foreground">
                      Marketplace Generators
                    </div>

                    {marketplaceAddOns.map((addOn) => (
                      <div
                        key={addOn.id}
                        className="flex cursor-pointer items-center justify-between rounded hover:bg-muted"
                        onClick={() => handleAddOnSelect(addOn)}
                      >
                        <div className="flex h-full min-h-10 w-full items-center justify-between px-1">
                          <div className="flex w-full items-center">
                            {addOn.name}
                            {addOn.team && (
                              <div className="ml-2 rounded-full bg-primary/10 px-1 py-0 text-xs text-primary">
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
                            className={cn(
                              'h-4 w-4 text-muted-foreground',
                              selectedAddOn?.id === addOn.id ? 'text-primary' : 'hidden'
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DaGeneratorSelector
