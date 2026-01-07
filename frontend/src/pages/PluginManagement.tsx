// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import PrototypePluginSection from '@/components/organisms/PrototypePluginSection'
import CustomApiSchemaSection from '@/components/organisms/CustomApiSchemaSection'
import CustomApiSetSection from '@/components/organisms/CustomApiSetSection'

const PluginManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Get initial section from URL or default to 'prototype'
  const getSectionFromUrl = (): 'prototype' | 'vehicle-api-schema' | 'vehicle-api' => {
    const section = searchParams.get('section')
    if (section === 'prototype' || section === 'vehicle-api-schema' || section === 'vehicle-api') {
      return section
    }
    return 'prototype'
  }

  const [activeTab, setActiveTab] = useState<'prototype' | 'vehicle-api-schema' | 'vehicle-api'>(
    getSectionFromUrl(),
  )

  // Update URL when activeTab changes
  useEffect(() => {
    setSearchParams({ section: activeTab }, { replace: true })
  }, [activeTab, setSearchParams])

  const handleTabChange = (tab: 'prototype' | 'vehicle-api-schema' | 'vehicle-api') => {
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col">
          <h1 className="text-4xl font-semibold text-foreground">
            Plugin Management
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Manage plugins and API schemas
          </p>
        </div>

        {/* Sidebar + Content Layout */}
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-64 shrink-0">
            <div className="bg-background rounded-lg shadow border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Plugin Sections
                </h2>
              </div>
              <nav className="p-2">
                <button
                  onClick={() => handleTabChange('prototype')}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'prototype'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Prototype Plugin
                </button>
                <button
                  onClick={() => handleTabChange('vehicle-api-schema')}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'vehicle-api-schema'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Vehicle API Schema
                </button>
                <button
                  onClick={() => handleTabChange('vehicle-api')}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'vehicle-api'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Vehicle API
                </button>
              </nav>
            </div>
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 min-w-0">
            <div className="bg-background rounded-lg shadow border border-border">
              {/* Conditionally render only the active section */}
              {activeTab === 'prototype' && <PrototypePluginSection />}
              {activeTab === 'vehicle-api-schema' && <CustomApiSchemaSection />}
              {activeTab === 'vehicle-api' && <CustomApiSetSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PluginManagement

