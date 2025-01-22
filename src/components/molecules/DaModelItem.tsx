import * as React from 'react'
import { DaText } from '../atoms/DaText'
import { DaTag } from '../atoms/DaTag'
import { DaImage } from '../atoms/DaImage'
import { Model, ModelLite } from '@/types/model.type'
import DaTooltip from '../atoms/DaTooltip'
import { DaAvatar } from '../atoms/DaAvatar'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Link } from 'react-router-dom'
import {
  TbAffiliate,
  TbCategory,
  TbCode,
  TbGauge,
  TbStack,
  TbStackFilled,
  TbUsers,
} from 'react-icons/tb'
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
        'lg:w-full lg:h-full group bg-white rounded-lg cursor-pointer',
        className,
      )}
      id={model?.id ?? ''}
    >
      <div className="flex flex-col items-center space-y-1 text-da-gray-medium overflow-hidden">
        <div className="flex w-full h-full relative overflow-hidden rounded-lg">
          <DaImage
            src={
              model?.model_home_image_file
                ? model.model_home_image_file
                : '/imgs/default_prototype_cover.jpg'
            }
            alt="Image"
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
          <DaText
            variant="regular-bold"
            className="line-clamp-1 !text-da-gray-dark"
          >
            {model?.name ?? ''}
          </DaText>
          <div className="grow"></div>
          <div className="flex text-sm items-center gap-3">
            {totalCount > 0 && (
              <DaTooltip content="Contributors" delay={300}>
                <div className="flex items-center font-semibold ">
                  <TbUsers className="text-da-primary-500 size-4 mr-1" />
                  {totalCount}
                </div>
              </DaTooltip>
            )}
            <DaTooltip content="Utilized VSS Signals" delay={300}>
              <div className="flex items-center font-semibold">
                <TbAffiliate className="text-da-primary-500 size-4 mr-1" />
                {model.stats?.apis?.used?.count || 0}
              </div>
            </DaTooltip>
            <DaTooltip content="Prototypes" delay={300}>
              <div className="flex items-center font-semibold ">
                <TbCode className="text-da-primary-500 size-4 mr-1" />
                {model.stats?.prototypes?.count || 0}
              </div>
            </DaTooltip>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DaModelItem
