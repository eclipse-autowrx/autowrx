import * as React from 'react'
import { DaImage } from '../atoms/DaImage'
import { DaText } from '../atoms/DaText'
import { cn } from '@/lib/utils'
import { Prototype } from '@/types/model.type'
import { TbCode, TbGauge, TbTerminal2 } from 'react-icons/tb'
import { DaAvatar } from '../atoms/DaAvatar'
import { Link } from 'react-router-dom'
import DaTooltip from '../atoms/DaTooltip'

interface DaPrototypeItemProps {
  prototype?: Prototype // Make prototype optional
  className?: string
}

const DaPrototypeItem = ({ prototype, className }: DaPrototypeItemProps) => {
  return (
    <div
      className={cn(
        'lg:w-full lg:h-full group bg-white rounded-lg cursor-pointer',
        className,
      )}
      id={prototype?.id ?? ''}
    >
      <div className="flex flex-col items-center space-y-1 text-da-gray-medium overflow-hidden">
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
          <div className="absolute bottom-0 w-full h-[30px] p-[1px] blur-xl bg-black/80 transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100"></div>
          <div className="absolute bottom-0 w-full h-[50px] p-[1px] transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100">
            <div className="flex h-full w-full px-3 items-center justify-between text-white rounded-b-lg ">
              {prototype?.created_by && (
                <div className="flex gap-2 items-center">
                  <DaAvatar
                    className="h-7 w-7 bg-black/20 backdrop-blur "
                    src={prototype.created_by?.image_file}
                  />

                  <div className="line-clamp-1 text-xs mt-1">
                    {prototype.created_by?.name ?? ''}
                  </div>
                </div>
              )}
              <div className="grow"></div>
              <div className="flex w-fit justify-end items-center gap-2 ml-2">
                <DaTooltip content="View Code" delay={300}>
                  <Link
                    to={`/model/${prototype?.model_id}/library/prototype/${prototype?.id}/code`}
                    className="flex"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-1 rounded-full bg-white opacity-80 hover:opacity-100">
                      <TbCode className="size-4 !text-da-gray-dark" />
                    </div>
                  </Link>
                </DaTooltip>
                <DaTooltip content="View Dashboard" delay={300}>
                  <Link
                    to={`/model/${prototype?.model_id}/library/prototype/${prototype?.id}/dashboard`}
                    className="flex"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-1 rounded-full bg-white opacity-80 hover:opacity-100">
                      <TbGauge className="size-4 !text-da-gray-dark" />
                    </div>
                  </Link>
                </DaTooltip>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center w-full space-y-0">
          <DaText
            variant="regular-bold"
            className="line-clamp-1 !text-da-gray-dark"
          >
            {prototype?.name ?? ''}
          </DaText>
          <div className="grow"></div>
          <DaTooltip
            content={`This prototype has been run ${prototype?.executed_turns} times`}
            delay={300}
          >
            {Number(prototype?.executed_turns ?? 0) > 1 && (
              <div className="flex w-fit items-center text-sm font-semibold mx-2">
                <TbTerminal2 className="size-[18px] mr-1 text-da-primary-500" />
                {prototype?.executed_turns}
              </div>
            )}
          </DaTooltip>
        </div>
      </div>
    </div>
  )
}

export { DaPrototypeItem }
