// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { HomePartners } from '@/components/organisms/HomePartners'
import HomeHeroSection from '@/components/organisms/HomeHeroSection'
import HomeFeatureList from '@/components/organisms/HomeFeatureList'
import HomeButtonList from '@/components/organisms/HomeButtonList'
import HomePrototypeRecent from '@/components/organisms/HomePrototypeRecent'
import HomePrototypePopular from '@/components/organisms/HomePrototypePopular'
import HomePrototypeList from '@/components/organisms/HomePrototypeList'
import HomeNews from '@/components/organisms/HomeNews'
import HomeFooterSection from '@/components/organisms/HomeFooterSection'

const homeComponentMap: Record<string, React.ComponentType<any>> = {
  'hero': HomeHeroSection,
  'feature-list': HomeFeatureList,
  'button-list': HomeButtonList,
  'news': HomeNews,
  'recent': HomePrototypeRecent,
  'popular': HomePrototypePopular,
  'prototype-list': HomePrototypeList,
  'partner-list': HomePartners,
  'home-footer': HomeFooterSection,
}

export const getHomeComponent = (
  elementType: string,
): React.ComponentType<any> | null => {
  return homeComponentMap[elementType] ?? null
}

export const getBlockTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'hero': 'Hero',
    'feature-list': 'Feature list',
    'button-list': 'Button list',
    'news': 'News',
    'recent': 'Recent prototypes',
    'popular': 'Popular prototypes',
    'prototype-list': 'All prototypes',
    'partner-list': 'Partners',
    'home-footer': 'Footer',
  }
  return labels[type] ?? type
}
