// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import * as React from 'react'
import { DaImage } from '../atoms/DaImage'
import { cn } from '@/lib/utils'
import { Prototype } from '@/types/model.type'
import { TbCode, TbGauge, TbTerminal2 } from 'react-icons/tb'
import { Avatar, AvatarFallback, AvatarImage } from '../atoms/avatar'
import { Link } from 'react-router-dom'
import DaTooltip from './DaTooltip'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

interface DaPrototypeItemProps {
  prototype?: Prototype
  className?: string
}

const DaPrototypeItem = ({ prototype, className }: DaPrototypeItemProps) => {
  const { data: user } = useSelfProfileQuery()
  return (
    <div
      className={cn(
        'lg:w-full lg:h-full group bg-background rounded-lg cursor-pointer prototype-grid-item',
        className,
      )}
      data-id={`prototype-item-${prototype?.id ?? ''}`}
      aria-label={`${prototype?.name || 'Unnamed'}`}
      id={prototype?.id ?? ''}
    >
      <div className="flex flex-col items-center space-y-1 text-muted-foreground overflow-hidden">
        <div className="flex w-full h-full relative overflow-hidden rounded-lg">
          <DaImage
            src={
              prototype?.image_file
                ? prototype.image_file
                : '/imgs/default_prototype_cover.jpg'
            }
            alt="Image"
            className="w-full h-full rounded-lg aspect-video object-cover shadow border"
          />
          <div className="absolute bottom-0 w-full h-[30px] blur-xl bg-black/80 transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100"></div>
          <div className="absolute bottom-0 w-full h-[50px] transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100">
            <div className="flex h-full w-full px-3 items-center justify-between text-white rounded-b-lg ">
              {prototype?.created_by && (
                <div className="flex gap-2 items-center">
                  <Avatar className="h-7 w-7 bg-black/20 backdrop-blur">
                    <AvatarImage src={prototype.created_by?.image_file} />
                    <AvatarFallback>
                      {prototype.created_by?.name?.charAt(0)?.toUpperCase() ||
                        'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="line-clamp-1 text-xs mt-1">
                    {prototype.created_by?.name ?? ''}
                  </div>
                </div>
              )}
              <div className="grow"></div>
              {user && (
                <div className="flex w-fit justify-end items-center gap-2 ml-2">
                  <DaTooltip tooltipMessage="View Code" tooltipDelay={300}>
                    <Link
                      to={`/model/${prototype?.model_id}/library/prototype/${prototype?.id}/code`}
                      className="flex"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-1 rounded-full bg-white opacity-80 hover:opacity-100">
                        <TbCode className="size-4 text-foreground" />
                      </div>
                    </Link>
                  </DaTooltip>
                  <DaTooltip tooltipMessage="View Dashboard" tooltipDelay={300}>
                    <Link
                      to={`/model/${prototype?.model_id}/library/prototype/${prototype?.id}/dashboard`}
                      className="flex"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-1 rounded-full bg-white opacity-80 hover:opacity-100">
                        <TbGauge className="size-4 text-foreground" />
                      </div>
                    </Link>
                  </DaTooltip>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center w-full space-y-0">
          <p className="text-base font-semibold line-clamp-1 text-foreground prototype-grid-item-name">
            {prototype?.name ?? ''}
          </p>
          <div className="grow"></div>
          {Number(prototype?.executed_turns ?? 0) > 1 && (
            <DaTooltip
              tooltipMessage={`This prototype has been run ${prototype?.executed_turns} times`}
              tooltipDelay={300}
            >
              <div className="flex w-fit items-center text-sm font-semibold mx-2">
                <TbTerminal2 className="size-[18px] mr-1 text-primary" />
                {prototype?.executed_turns}
              </div>
            </DaTooltip>
          )}
        </div>
      </div>
    </div>
  )
}

export { DaPrototypeItem }
