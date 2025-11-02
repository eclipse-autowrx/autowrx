// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import DaTabItem from '@/components/atoms/DaTabItem'
import { useParams } from 'react-router-dom'

interface CustomPrototypeTabsProps {
  customTabs?: Array<{
    label: string
    plugin: string
  }>
}

const CustomPrototypeTabs: FC<CustomPrototypeTabsProps> = ({ customTabs }) => {
  const { model_id, prototype_id, tab } = useParams()

  if (!customTabs || customTabs.length === 0) {
    return null
  }

  return (
    <>
      {customTabs.map((customTab, index) => (
        <DaTabItem
          key={`${customTab.plugin}-${index}`}
          active={tab === 'plug' && window.location.search.includes(`plugid=${customTab.plugin}`)}
          to={`/model/${model_id}/library/prototype/${prototype_id}/plug?plugid=${customTab.plugin}`}
        >
          {customTab.label}
        </DaTabItem>
      ))}
    </>
  )
}

export default CustomPrototypeTabs
