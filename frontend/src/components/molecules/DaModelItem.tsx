// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import * as React from 'react'
import { Badge } from '@/components/atoms/badge'
import { Model, ModelLite } from '@/types/model.type'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/atoms/tooltip'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Link } from 'react-router-dom'
import { TbAffiliate, TbCode, TbUsers } from 'react-icons/tb'
import { cn } from '@/lib/utils'

interface DaModelItemProps {
  model: Partial<ModelLite>
  className?: string
}

const DaModelItem = ({ model, className }: DaModelItemProps) => {
  const { data: user } = useSelfProfileQuery()

  const contributorsCount =
    model?.stats?.collaboration?.contributors?.count ?? 0
  const membersCount = model?.stats?.collaboration?.members?.count ?? 0
  const totalCount = contributorsCount + membersCount

  return (
    <div
      className={cn(
        'lg:w-full lg:h-full group bg-background rounded-lg cursor-pointer',
        className,
      )}
      id={model?.id ?? ''}
    >
      <div className="flex flex-col items-center space-y-1 text-muted-foreground overflow-hidden">
        <div className="flex w-full h-full relative overflow-hidden rounded-lg">
          <img
            src={
              model?.model_home_image_file
                ? model.model_home_image_file
                : '/imgs/default_prototype_cover.jpg'
            }
            alt={model?.name || 'Model image'}
            className="w-full h-full rounded-lg aspect-video object-cover shadow border"
          />
          <div className="absolute bottom-0 w-full h-[30px] p-[1px] blur-xl bg-black/80 transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100"></div>
          <div className="absolute bottom-0 w-full h-[50px] p-[1px] transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100">
            <div className="flex h-full w-full px-3 items-center justify-between text-white rounded-b-lg ">
              <div className="flex w-fit justify-end items-center gap-2 ml-2">
                COVESA VSS {model.api_version}
              </div>
              <div className="grow"></div>
            </div>
          </div>
        </div>
        <div className="flex items-center w-full px-1 pt-0.5">
          <h3 className="text-base font-semibold line-clamp-1 text-foreground">
            {model?.name ?? ''}
          </h3>
          <div className="grow"></div>
          <div className="flex text-sm items-center gap-3">
            <TooltipProvider>
              {totalCount > 0 && (
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center font-semibold ">
                      <TbUsers className="text-primary size-4 mr-1" />
                      {totalCount}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Contributors</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {model.stats && model.stats?.apis?.used?.count > 0 && (
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center font-semibold">
                      <TbAffiliate className="text-primary size-4 mr-1" />
                      {model.stats?.apis?.used?.count || 0}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Utilized VSS Signals</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div className="flex items-center font-semibold ">
                    <TbCode className="text-primary size-4 mr-1" />
                    {model.stats?.prototypes?.count || 0}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Prototypes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DaModelItem
