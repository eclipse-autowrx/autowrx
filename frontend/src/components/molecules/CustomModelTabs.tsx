// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import DaTabItem from '@/components/atoms/DaTabItem'
import { useParams, useLocation } from 'react-router-dom'

interface CustomModelTabsProps {
  customTabs?: Array<{
    label: string
    plugin: string
  }>
}

const CustomModelTabs: FC<CustomModelTabsProps> = ({ customTabs }) => {
  const { model_id } = useParams()
  const location = useLocation()

  if (!customTabs || customTabs.length === 0) {
    return null
  }

  return (
    <>
      {customTabs.map((customTab, index) => (
        <DaTabItem
          key={`${customTab.plugin}-${index}`}
          active={location.pathname.includes('/plugin') && location.search.includes(`plugid=${customTab.plugin}`)}
          to={`/model/${model_id}/plugin?plugid=${customTab.plugin}`}
        >
          {customTab.label}
        </DaTabItem>
      ))}
    </>
  )
}

export default CustomModelTabs
