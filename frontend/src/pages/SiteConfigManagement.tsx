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
import AuthConfigSection from '@/components/organisms/AuthConfigSection'
import SSOConfigSection from '@/components/organisms/SSOConfigSection'
import StagingConfigSection from '@/components/organisms/StagingConfigSection'

// Keys that should be excluded from the site-config page
// These keys are managed in their own dedicated pages
export const EXCLUDED_FROM_SITE_CONFIG_KEYS = ['STAGING_FRAME', 'STANDARD_STAGE']

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
  {
    key: 'ENABLE_LEARNING_MODE',
    scope: 'site',
    value: false,
    secret: false,
    valueType: 'boolean',
  },
  {
    key: 'LEARNING_MODE_URL',
    scope: 'site',
    value: 'https://digital.auto',
    secret: false,
    valueType: 'string',
  },
  {
    key: 'NAV_BAR_ACTIONS',
    scope: 'site',
    value: [
      {
        label: 'GitHub Issues',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
        url: 'https://github.com/eclipse-autowrx/autowrx/issues',
      },
    ],
    secret: false,
    valueType: 'array',
  },
  {
    key: 'GENAI_SDV_APP_ENDPOINT',
    scope: 'site',
    value: 'https://workflow.digital.auto/webhook/c0ba14bc-c6a3-4319-ad0a-ad89b1460b36',
    secret: false,
    valueType: 'string',
    description: 'GenAI endpoint URL for SDV App generation. Used by the SDV Copilot built-in generator. Default: https://workflow.digital.auto/webhook/c0ba14bc-c6a3-4319-ad0a-ad89b1460b36',
    category: 'genai',
  },
  {
    key: 'GENAI_MARKETPLACE_URL',
    scope: 'site',
    value: 'https://store-be.digitalauto.tech',
    secret: false,
    valueType: 'string',
    description: 'Marketplace URL for fetching GenAI addons/generators. Used to load marketplace generators in ProtoPilot. Leave empty to hide the Marketplace Generators section.',
    category: 'genai',
  },
]

export const PREDEFINED_AUTH_CONFIGS: any[] = [
  {
    key: 'PUBLIC_VIEWING',
    scope: 'site',
    value: true,
    secret: false,
    valueType: 'boolean',
    category: 'auth',
    description: 'Allow unauthenticated users to view models, prototypes, and other content',
  },
  {
    key: 'SELF_REGISTRATION',
    scope: 'site',
    value: true,
    secret: false,
    valueType: 'boolean',
    category: 'auth',
    description: 'Allow users to create their own accounts via the registration page',
  },
  {
    key: 'SSO_AUTO_REGISTRATION',
    scope: 'site',
    value: true,
    secret: false,
    valueType: 'boolean',
    category: 'auth',
    description: 'Automatically create accounts for users logging in via SSO (e.g., Microsoft, GitHub)',
  },
  {
    key: 'PASSWORD_MANAGEMENT',
    scope: 'site',
    value: true,
    secret: false,
    valueType: 'boolean',
    category: 'auth',
    description: 'Allow users to set and update their own passwords',
  },
]

const SiteConfigManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Get initial section from URL or default to 'public'
  const getSectionFromUrl = (): 'public' | 'style' | 'secrets' | 'home' | 'auth' | 'sso' | 'staging' => {
    const section = searchParams.get('section')
    if (section === 'public' || section === 'style' || section === 'secrets' || section === 'home' || section === 'auth' || section === 'sso' || section === 'staging') {
      return section
    }
    return 'public'
  }

  const [activeTab, setActiveTab] = useState<'public' | 'style' | 'secrets' | 'home' | 'auth' | 'sso' | 'staging'>(
    getSectionFromUrl(),
  )

  // Update URL when activeTab changes
  useEffect(() => {
    setSearchParams({ section: activeTab }, { replace: true })
  }, [activeTab, setSearchParams])

  const handleTabChange = (tab: 'public' | 'style' | 'secrets' | 'home' | 'auth' | 'sso' | 'staging') => {
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
                  onClick={() => handleTabChange('auth')}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'auth'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Auth Config
                </button>
                <button
                  onClick={() => handleTabChange('sso')}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'sso'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  SSO Config
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
                <button
                  onClick={() => handleTabChange('staging')}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'staging'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Standard Staging Frame
                </button>
              </nav>
            </div>
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 min-w-0">
            <div className="bg-background rounded-lg shadow border border-border">
              {/* Conditionally render only the active section */}
              {activeTab === 'public' && <PublicConfigSection />}
              {activeTab === 'home' && <HomeConfigSection />}
              {activeTab === 'staging' && <StagingConfigSection />}
              {activeTab === 'auth' && <AuthConfigSection />}
              {activeTab === 'sso' && <SSOConfigSection />}
              {activeTab === 'style' && <SiteStyleSection />}
              {activeTab === 'secrets' && <SecretConfigSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SiteConfigManagement
