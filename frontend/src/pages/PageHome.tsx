// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { HomePartners } from '@/components/organisms/HomePartners'
import { home as defaultHome } from '../../instance/default'
import home from '../../instance/home'
import HomeHeroSection from '@/components/organisms/HomeHeroSection'
import HomeFeatureList from '@/components/organisms/HomeFeatureList'
import HomeButtonList from '@/components/organisms/HomeButtonList'
import HomePrototypeRecent from '@/components/organisms/HomePrototypeRecent'
import HomePrototypePopular from '@/components/organisms/HomePrototypePopular'
import HomeNews from '@/components/organisms/HomeNews'

const PageHome = () => {
  const homeElements = home || defaultHome

  const getComponent = (elementType: string) => {
    switch (elementType) {
      case 'hero':
        return HomeHeroSection
      case 'feature-list':
        return HomeFeatureList
      case 'button-list':
        return HomeButtonList
      case 'news':
        return HomeNews
      case 'recent':
        return HomePrototypeRecent
      case 'popular':
        return HomePrototypePopular
      case 'partner-list':
        return HomePartners
      default:
        return null
    }
  }

  return (
    <div className="space-y-12">
      {homeElements.map((element, index) => {
        const Component = getComponent(element.type) as any
        if (!Component) return null
        return <Component key={index} {...element} />
      })}
    </div>
  )
}

export default PageHome
