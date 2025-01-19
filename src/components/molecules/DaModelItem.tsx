import * as React from 'react'
import { DaText } from '../atoms/DaText'
import { DaTag } from '../atoms/DaTag'
import { DaImage } from '../atoms/DaImage'
import { Model, ModelLite } from '@/types/model.type'
import DaTooltip from '../atoms/DaTooltip'
import { DaAvatar } from '../atoms/DaAvatar'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Link } from 'react-router-dom'
import { TbCode, TbGauge } from 'react-icons/tb'
import { cn } from '@/lib/utils'

interface DaModelItemProps {
  model: Partial<ModelLite>
  className?: string
}

const DaModelItem = ({ model, className }: DaModelItemProps) => {
  const { data: user } = useSelfProfileQuery()

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
              <div className="grow"></div>
              {user && (
                <div className="flex w-fit justify-end items-center gap-2 ml-2">
                  <DaTooltip content="View Code" delay={300}>
                    <Link
                      to={`/model/${model?.id}/library/prototype`}
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
                      to={`/model/${model?.id}/library/prototype`}
                      className="flex"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-1 rounded-full bg-white opacity-80 hover:opacity-100">
                        <TbGauge className="size-4 !text-da-gray-dark" />
                      </div>
                    </Link>
                  </DaTooltip>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center w-full space-y-0">
          <DaText
            variant="regular-bold"
            className="line-clamp-1 !text-da-gray-dark"
          >
            {model?.name ?? ''}
          </DaText>
          <div className="grow"></div>
        </div>
      </div>
    </div>
  )
}

export default DaModelItem
