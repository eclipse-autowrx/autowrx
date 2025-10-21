// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio'

const AspectRatio = AspectRatioPrimitive.Root

interface DaImageRatioProps {
  src: string
  alt?: string
  ratio: number
  maxWidth: string
  className?: string
}

const DaImageRatio = ({
  src,
  alt,
  ratio,
  maxWidth,
  className = '',
}: DaImageRatioProps) => {
  return (
    <div className={`${className} h-fit w-full`} style={{ maxWidth: maxWidth }}>
      <AspectRatio ratio={ratio}>
        <img
          src={src}
          alt={alt ? alt : 'Image'}
          className="rounded-md object-cover h-full w-full"
        />
      </AspectRatio>
    </div>
  )
}

export { DaImageRatio }
