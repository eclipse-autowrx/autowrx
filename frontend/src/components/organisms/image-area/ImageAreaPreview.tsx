// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT
//
// Portions derived from @mekong89/image-area-lib (MIT, (c) Chieucasmen).
// See NOTICE.md in this folder.

import { useEffect, useState } from 'react'
import ImageAreaStage from './ImageAreaStage'
import { SHAPE, type ImageAreaPreviewProps, type ImageAreaShape } from './types'

const ImageAreaPreview = ({
  shapes,
  bgImage,
  bgColor,
  navigate,
}: ImageAreaPreviewProps) => {
  const [displayShapes, setDisplayShapes] = useState<ImageAreaShape[]>([])
  const [displayBgColor, setDisplayBgColor] = useState<string | undefined>(undefined)
  const [loaded, setLoaded] = useState(true)

  useEffect(() => {
    setDisplayShapes(shapes && shapes.length > 0 ? shapes : [])
  }, [shapes])

  useEffect(() => {
    setDisplayBgColor(bgColor)
  }, [bgColor])

  useEffect(() => {
    setLoaded(!bgImage)
  }, [bgImage])

  return (
    <div className="flex w-full h-full">
      <ImageAreaStage
        viewOnly
        shapes={displayShapes}
        bgImage={bgImage}
        bgColor={displayBgColor}
        sourceType={SHAPE.RECTANGLE}
        loaded={loaded}
        onImageLoaded={() => setLoaded(true)}
        navigate={navigate}
        onChangeShapes={() => {}}
        onSelectShape={() => {}}
        onDeleteShape={() => {}}
      />
    </div>
  )
}

export default ImageAreaPreview
