// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import useSearchPrototypesBySignal from '@/hooks/useSearchPrototypesBySignal'
import { DaImage } from '../atoms/DaImage'
import { CSSProperties, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/atoms/button'
import { TbChevronDown } from 'react-icons/tb'
import clsx from 'clsx'
import { Spinner } from '@/components/atoms/spinner'

type DaRelatedPrototypesProps = {
  signal?: string
}

const DaRelatedPrototypes = ({ signal }: DaRelatedPrototypesProps) => {
  const [expanded, setExpanded] = useState(false)
  const { data: prototypes, isLoading } = useSearchPrototypesBySignal(signal)

  const truncatedPrototypes = prototypes?.slice(
    0,
    expanded ? prototypes.length : 3,
  )

  if (isLoading)
    return (
      <div className="w-full h-[100px] flex">
        <Spinner className="my-auto" />
      </div>
    )

  return (
    <div className="mt-2">
      <div className="text-sm font-medium text-foreground">
        Dependencies
      </div>
      {prototypes &&
      prototypes.length > 0 &&
      truncatedPrototypes &&
      truncatedPrototypes.length > 0 ? (
        <>
          <div className="text-sm font-medium text-muted-foreground">Used by these vehicle app</div>
          <div
            className="autofill mt-2 gap-4"
            style={
              {
                '--grid-min-width': '240px',
              } as CSSProperties
            }
          >
            {truncatedPrototypes?.map((prototype) => (
              <Link
                to={`/model/${prototype.model?.id}/library/prototype/${prototype.id}/code`}
                key={prototype.id}
                className="border rounded-md p-2 cursor-pointer hover:border-primary relative"
              >
                <DaImage
                  src={prototype.image_file}
                  className="w-full aspect-video object-cover rounded-md"
                />
                <div className="text-sm font-medium mt-1 block w-full truncate">
                  {prototype.name}
                </div>
                {prototype.model?.name && (
                  <div className="text-xs font-medium max-w-[160px] truncate absolute py-0.5 px-2 rounded-full bg-white border border-border top-3 right-3">
                    {prototype.model.name}
                  </div>
                )}
              </Link>
            ))}
          </div>
          {prototypes.length > 3 && (
            <Button
              onClick={() => setExpanded((prev) => !prev)}
              variant="ghost"
              size="sm"
              className="mt-1 px-0"
            >
              {expanded ? 'Show less' : `Show ${prototypes.length - 3} more`}{' '}
              <TbChevronDown
                className={clsx('ml-1', expanded && 'rotate-180')}
              />
            </Button>
          )}
        </>
      ) : (
        <div className="text-sm font-medium text-muted-foreground">N/A</div>
      )}
    </div>
  )
}

export default DaRelatedPrototypes
