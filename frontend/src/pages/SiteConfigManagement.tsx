// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import PublicConfigSection from '@/components/organisms/PublicConfigSection'
import SecretConfigSection from '@/components/organisms/SecretConfigSection'
import SiteStyleSection from '@/components/organisms/SiteStyleSection'
import HomeConfigSection from '@/components/organisms/HomeConfigSection'

export const PREDEFINED_SITE_CONFIGS: any[] = [
  {
    key: 'SITE_LOGO_WIDE',
    scope: 'site',
    value: '/imgs/logo-wide.png',
    secret: false,
    valueType: 'image_url',
  },
  {
    key: 'SITE_TITLE',
    scope: 'site',
    value: 'Playground | digital.auto',
    secret: false,
    valueType: 'string',
  },
  {
    key: 'SITE_DESCRIPTION',
    scope: 'site',
    value: 'Fast prototyping platform for vehicle QM applications',
    secret: false,
    valueType: 'string',
  },
  {
    key: 'PRIVACY_POLICY_URL',
    scope: 'site',
    value: '/privacy-policy',
    secret: false,
    valueType: 'string',
  },
  {
    key: 'TERMS_OF_SERVICE_URL',
    scope: 'site',
    value: '/terms-of-service',
    secret: false,
    valueType: 'string',
  },
  {
    key: 'RUNTIME_SERVER_URL',
    scope: 'site',
    value: 'https://kit.digitalauto.tech',
    secret: false,
    valueType: 'string',
  },
  {
    key: 'DEFAULT_MARKETPLACE_URL',
    scope: 'site',
    value: 'https://marketplace.digitalauto.tech',
    secret: false,
    valueType: 'string',
  },
  {
    key: 'SUPPORT_CENTER_URL',
    scope: 'site',
    value: 'https://github.com/eclipse-autowrx/autowrx/issues',
    secret: false,
    valueType: 'string',
  },
]

const SiteConfigManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Get initial section from URL or default to 'public'
  const getSectionFromUrl = (): 'public' | 'style' | 'secrets' | 'home' => {
    const section = searchParams.get('section')
    if (section === 'public' || section === 'style' || section === 'secrets' || section === 'home') {
      return section
    }
    return 'public'
  }

  const [activeTab, setActiveTab] = useState<'public' | 'style' | 'secrets' | 'home'>(
    getSectionFromUrl(),
  )

  // Update URL when activeTab changes
  useEffect(() => {
    setSearchParams({ section: activeTab }, { replace: true })
  }, [activeTab, setSearchParams])

  const handleTabChange = (tab: 'public' | 'style' | 'secrets' | 'home') => {
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col">
          <h1 className="text-4xl font-semibold text-foreground">
            Site Management
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Manage site configurations and settings
          </p>
        </div>

        {/* Sidebar + Content Layout */}
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-64 shrink-0">
            <div className="bg-background rounded-lg shadow border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Configuration Sections
                </h2>
              </div>
              <nav className="p-2">
                <button
                  onClick={() => handleTabChange('public')}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'public'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Public Config
                </button>
                <button
                  onClick={() => handleTabChange('home')}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'home'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Home Config
                </button>
                <button
                  onClick={() => handleTabChange('style')}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'style'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Site Style (CSS)
                </button>
                <button
                  onClick={() => handleTabChange('secrets')}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'secrets'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Secret Config
                </button>
              </nav>
            </div>
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 min-w-0">
            <div className="bg-background rounded-lg shadow border border-border">
              {/* Conditionally render only the active section */}
              {activeTab === 'public' && <PublicConfigSection />}
              {activeTab === 'secrets' && <SecretConfigSection />}
              {activeTab === 'style' && <SiteStyleSection />}
              {activeTab === 'home' && <HomeConfigSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SiteConfigManagement
