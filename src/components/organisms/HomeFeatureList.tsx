// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { ReactNode } from 'react'
import { DaCardIntroBig } from '../molecules/DaCardIntroBigAlt'

type HomeFeatureListProps = {
  items?: { title?: string; description?: string; children?: ReactNode }[]
}

const HomeFeatureList = ({ items }: HomeFeatureListProps) => {
  return (
    <div className="container flex w-full flex-col justify-center">
      <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-3">
        {items?.map((card, index) => (
          <div key={index} className="flex w-full items-center justify-center">
            <DaCardIntroBig
              key={index}
              title={card.title || ''}
              content={card.description || ''}
              children={card.children}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default HomeFeatureList
