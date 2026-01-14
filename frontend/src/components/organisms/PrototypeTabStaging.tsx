// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { configManagementService, Config } from '@/services/configManagement.service'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { Spinner } from '@/components/atoms/spinner'
import { Prototype } from '@/types/model.type'
import { DaImage } from '@/components/atoms/DaImage'
import { TbChevronRight, TbChevronDown, TbArrowLeft } from 'react-icons/tb'
import { cn } from '@/lib/utils'
import { Button } from '@/components/atoms/button'
import DaTooltip from '@/components/molecules/DaTooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import PluginPageRender from '@/components/organisms/PluginPageRender'
import useCurrentModel from '@/hooks/useCurrentModel'
import { Plugin } from '@/services/plugin.service'

const STAGING_FRAME_KEY = 'STAGING_FRAME'
const STANDARD_STAGE_KEY = 'STANDARD_STAGE'

const LIFECYCLES = [
  'Infrastructure Maturity',
  'Functional Maturity',
  'Deployment Version',
  'Compliance Readiness',
  'Security Readiness',
  'Homologation Readiness',
]

// Lifecycle option definitions
const InfrastructureMaturity = [
  { ID: '1', name: 'Planned', description: 'Component is conceptualized; requirements are being defined.', icon: '📌' },
  { ID: '2', name: 'Prototyped', description: 'Initial implementation exists, but not yet integrated.', icon: '🛠️' },
  { ID: '3', name: 'Integrated', description: 'Available in a development or pre-production environment.', icon: '🔗' },
  { ID: '4', name: 'Certified', description: 'Meets infrastructure compliance, security, and performance requirements.', icon: '✅' },
]

const FunctionalMaturity = [
  { ID: '1', name: 'Feature Defined', description: 'Functional specification is complete.', icon: '📝' },
  { ID: '2', name: 'Prototype Available', description: 'Early-stage implementation exists but is not production-ready.', icon: '🔬' },
  { ID: '3', name: 'Baseline Established', description: 'First stable version with core functionality.', icon: '⚙️' },
  { ID: '4', name: 'Feature Complete', description: 'Fully functional with all intended features.', icon: '🎯' },
  { ID: '5', name: 'Optimized', description: 'Performance tuning, efficiency, and robustness improvements.', icon: '🚀' },
]

const DeploymentVersion = [
  { ID: '1', name: 'Older version', description: 'Work-in-progress; frequent changes.', icon: '✗' },
  { ID: '2', name: 'Latest version', description: 'Merged into a shared environment with other components.', icon: '🗸' },
]

const ComplianceReadiness = [
  { ID: '1', name: 'Regulatory Mapping Complete', description: 'Applicable regulations identified.', icon: '📜' },
  { ID: '2', name: 'Requirements Implemented', description: 'Compliance measures integrated.', icon: '🛡' },
  { ID: '3', name: 'Preliminary Assessment', description: 'Initial compliance checks completed.', icon: '🔍' },
  { ID: '4', name: 'Certified', description: 'Passed regulatory audits and certified for use.', icon: '✅' },
  { ID: '5', name: 'Maintained', description: 'Compliance monitored and updated as regulations evolve.', icon: '🔄' },
]

const SecurityReadiness = [
  { ID: '1', name: 'Threat Model Defined', description: 'Security risks and attack vectors analyzed.', icon: '⚠️' },
  { ID: '2', name: 'Security Controls Implemented', description: 'Encryption and authentication mechanisms integrated.', icon: '🔐' },
  { ID: '3', name: 'Vulnerability Tested', description: 'Security testing, including penetration testing, conducted.', icon: '🛡' },
  { ID: '4', name: 'Certified Secure', description: 'Meets security certification standards.', icon: '✅' },
  { ID: '5', name: 'Security Monitoring Active', description: 'Continuous monitoring for vulnerabilities and threats.', icon: '🔍' },
]

const HomologationReadiness = [
  { ID: '1', name: 'Homologation Impact Assessed', description: 'Impact on vehicle-level certification analyzed.', icon: '⚖️' },
  { ID: '2', name: 'Certification Strategy Defined', description: 'Approach for compliance certification established.', icon: '📑' },
  { ID: '3', name: 'Pre-Homologation Tests Passed', description: 'Initial verification against regulatory test cases completed.', icon: '🔍' },
  { ID: '4', name: 'Certified for Deployment', description: 'Regulatory approval obtained for production release.', icon: '✅' },
  { ID: '5', name: 'In-Service Compliance Ensured', description: 'Ongoing adherence to regulatory requirements monitored post-deployment.', icon: '🔄' },
]

interface Stage {
  name: string
  version: string
  image: string
  plugins?: Plugin[]
  state?: Record<string, { version?: string; cycle?: Record<string, string> }>
}

interface Target {
  name: string
  version: string
  image: string
  state?: Record<string, { version?: string; cycle?: Record<string, string> }>
}

interface StageItem {
  id: string
  name: string
  version?: string
  children?: StageItem[]
}

interface PrototypeTabStagingProps {
  prototype: Prototype
}

interface PluginDropdownItemProps {
  plugin: Plugin
  onClick: () => void
}

const PluginDropdownItem: React.FC<PluginDropdownItemProps> = ({ plugin, onClick }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      className="flex items-start gap-2 p-2 cursor-pointer rounded-sm transition-colors focus:bg-muted focus:outline-none"
      style={{
        backgroundColor: isHovered ? 'hsl(var(--muted))' : 'transparent',
      }}
      role="button"
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* Plugin Image */}
      <div className="w-12 h-12 rounded overflow-hidden bg-white flex-shrink-0">
        <img
          src={plugin.image || '/imgs/plugin.png'}
          alt={plugin.name}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/imgs/plugin.png'
          }}
        />
      </div>
      {/* Plugin Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="text-[12px] font-medium text-foreground leading-tight">
          {plugin.name || plugin.slug}
        </p>
        {plugin.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
            {plugin.description}
          </p>
        )}
      </div>
    </div>
  )
}

const PrototypeTabStaging: React.FC<PrototypeTabStagingProps> = ({ prototype }) => {
  const [stagingFrameConfig, setStagingFrameConfig] = useState<Config | null>(null)
  const [standardStageConfig, setStandardStageConfig] = useState<Config | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeLifeCycle, setActiveLifeCycle] = useState<string>('Deployment Version')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set()) // Default: all collapsed
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null) // Plugin ID or slug
  const [selectedStageName, setSelectedStageName] = useState<string | null>(null) // Stage name for back button
  const { toast } = useToast()
  const { data: model } = useCurrentModel()

  useEffect(() => {
    loadConfigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadConfigs = async () => {
    try {
      setIsLoading(true)
      const [stagingFrame, standardStage] = await Promise.allSettled([
        configManagementService.getConfigByKey(STAGING_FRAME_KEY),
        configManagementService.getConfigByKey(STANDARD_STAGE_KEY),
      ])
      
      // Handle staging frame config
      if (stagingFrame.status === 'fulfilled') {
        setStagingFrameConfig(stagingFrame.value)
      } else {
        // Use default if API fails
        setStagingFrameConfig({
          key: STAGING_FRAME_KEY,
          scope: 'site',
          value: {
            stages: [
              {
                name: 'SDV Mock',
                version: 'v1.0',
                image: 'https://playground-v2.digital.auto/imgs/targets/target_mockup.png',
              },
              {
                name: 'Virtual Vehicle',
                version: 'v1.0',
                image: 'https://playground-v2.digital.auto/imgs/targets/target_3d_car.png',
              },
              {
                name: 'Lab HW',
                version: 'v1.0',
                image: 'https://playground-v2.digital.auto/imgs/targets/desktopKit.png',
              },
              {
                name: 'Test Fleet',
                version: 'v1.0',
                image: 'https://playground-v2.digital.auto/imgs/targets/desktopKit.png',
              },
            ],
          },
          valueType: 'object',
          secret: false,
        } as Config)
      }
      
      // Handle standard stage config
      if (standardStage.status === 'fulfilled') {
        setStandardStageConfig(standardStage.value)
      } else {
        // Use default if API fails - we'll set a minimal default structure
        setStandardStageConfig({
          key: STANDARD_STAGE_KEY,
          scope: 'site',
          value: {
            isTopMost: true,
            name: '',
            id: '1',
            children: [],
          },
          valueType: 'object',
          secret: false,
        } as Config)
      }
    } catch (err) {
      console.error('Failed to load staging configs:', err)
      // Set defaults on error
      setStagingFrameConfig({
        key: STAGING_FRAME_KEY,
        scope: 'site',
        value: { stages: [] },
        valueType: 'object',
        secret: false,
      } as Config)
      setStandardStageConfig({
        key: STANDARD_STAGE_KEY,
        scope: 'site',
        value: { isTopMost: true, name: '', id: '1', children: [] },
        valueType: 'object',
        secret: false,
      } as Config)
    } finally {
      setIsLoading(false)
    }
  }

  const stages: Stage[] = stagingFrameConfig?.value?.stages || []
  const standardStage: StageItem | null = standardStageConfig?.value || null
  const system = {
    name: 'Concept Car 2024',
    icon: '/imgs/targets/targetSystem.png',
    version: 'v.1.0',
  }

  // Generate default cycle data for a component ID and stage name
  const getDefaultCycleData = (componentId: string, stageName: string): { version?: string; cycle: Record<string, string> } => {
    // Default cycle values - these will be used if no data exists in siteconfig
    // Values are based on component ID hash to provide variety
    const hash = componentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const baseValue = (hash % 4) + 1 // Value between 1-4
    const deploymentValue = (hash % 2) + 1 // Value 1 or 2 for Deployment Version
    
    // Stage-specific variations
    const stageVariations: Record<string, { version: string; cycleModifier: number }> = {
      'SDV Mock': { version: '1.0', cycleModifier: 0 },
      'Virtual Vehicle': { version: '0.9', cycleModifier: 1 },
      'Lab HW': { version: '0.9', cycleModifier: 0 },
      'Test Fleet': { version: '0.9', cycleModifier: 2 },
    }
    
    const stageInfo = stageVariations[stageName] || { version: '1.0', cycleModifier: 0 }
    const modValue = (baseValue + stageInfo.cycleModifier) % 4 + 1
    
    return {
      version: stageInfo.version,
      cycle: {
        'Infrastructure Maturity': String(modValue),
        'Functional Maturity': String((baseValue % 3) + 1),
        'Deployment Version': String(deploymentValue),
        'Compliance Readiness': String((baseValue % 4) + 1),
        'Security Readiness': String((baseValue % 3) + 1),
        'Homologation Readiness': String((baseValue % 4) + 1),
      },
    }
  }

  // Helper function to recursively collect all leaf node IDs from the component tree
  const getAllLeafNodeIds = (items: StageItem[]): string[] => {
    const ids: string[] = []
    const traverse = (item: StageItem) => {
      if (!item.children || item.children.length === 0) {
        ids.push(item.id)
      } else {
        item.children.forEach(traverse)
      }
    }
    items.forEach(traverse)
    return ids
  }

  // Create TARGETS structure from stages - maps stage names to their state data
  // Merge with default/mock data if state is missing
  const TARGETS: Target[] = stages.map((stage) => {
    // Start with stage's existing state data
    let state = stage.state || {}
    
    // Get all leaf node IDs from the component tree
    const leafNodeIds = standardStage?.children ? getAllLeafNodeIds(standardStage.children) : []
    
    // If state is empty or missing data for components, generate default cycle data
    if (!stage.state || Object.keys(stage.state).length === 0) {
      state = {}
      // Generate state for all leaf nodes
      leafNodeIds.forEach((componentId) => {
        const defaultData = getDefaultCycleData(componentId, stage.name)
        // Find the component in the tree to get its version
        const findComponent = (items: StageItem[]): StageItem | null => {
          for (const item of items) {
            if (item.id === componentId) return item
            if (item.children) {
              const found = findComponent(item.children)
              if (found) return found
            }
          }
          return null
        }
        const component = standardStage?.children ? findComponent(standardStage.children) : null
        
        state[componentId] = {
          version: component?.version || defaultData.version || '1.0.0',
          cycle: defaultData.cycle,
        }
      })
    } else {
      // If state exists but some components are missing cycle data, fill in defaults
      const enhancedState = { ...state }
      leafNodeIds.forEach((componentId) => {
        // If component doesn't have state or cycle data, add defaults
        if (!enhancedState[componentId] || !enhancedState[componentId].cycle) {
          const defaultData = getDefaultCycleData(componentId, stage.name)
          // Find the component in the tree to get its version
          const findComponent = (items: StageItem[]): StageItem | null => {
            for (const item of items) {
              if (item.id === componentId) return item
              if (item.children) {
                const found = findComponent(item.children)
                if (found) return found
              }
            }
            return null
          }
          const component = standardStage?.children ? findComponent(standardStage.children) : null
          
          enhancedState[componentId] = {
            version: component?.version || enhancedState[componentId]?.version || defaultData.version || '1.0.0',
            cycle: enhancedState[componentId]?.cycle || defaultData.cycle,
          }
        }
      })
      state = enhancedState
    }
    
    return {
      name: stage.name,
      version: stage.version,
      image: stage.image,
      state: state,
    }
  })

  // Get lifecycle options based on active lifecycle
  const getLifecycleOptions = () => {
    switch (activeLifeCycle) {
      case 'Infrastructure Maturity':
        return InfrastructureMaturity
      case 'Functional Maturity':
        return FunctionalMaturity
      case 'Deployment Version':
        return DeploymentVersion
      case 'Compliance Readiness':
        return ComplianceReadiness
      case 'Security Readiness':
        return SecurityReadiness
      case 'Homologation Readiness':
        return HomologationReadiness
      default:
        return []
    }
  }

  // Get cycle value for a component in a specific target/stage
  const getCycleValue = (componentId: string, target: Target): string | null => {
    const componentState = target.state?.[componentId]
    if (!componentState?.cycle) return null
    return componentState.cycle[activeLifeCycle] || null
  }

  // Get cycle option details for display
  const getCycleOption = (componentId: string, target: Target) => {
    const cycleValue = getCycleValue(componentId, target)
    if (!cycleValue) return null
    const options = getLifecycleOptions()
    return options.find((opt) => opt.ID === cycleValue) || null
  }

  // Debug: Log TARGETS structure for debugging
  useEffect(() => {
    if (TARGETS.length > 0 && standardStage) {
      const leafNodeIds = standardStage.children ? getAllLeafNodeIds(standardStage.children) : []
      console.log('[PrototypeTabStaging] TARGETS structure:', {
        targetCount: TARGETS.length,
        leafNodeCount: leafNodeIds.length,
        activeLifeCycle,
        sampleTarget: TARGETS[0] ? {
          name: TARGETS[0].name,
          stateKeys: Object.keys(TARGETS[0].state || {}),
          sampleComponentState: leafNodeIds[0] ? TARGETS[0].state?.[leafNodeIds[0]] : null,
        } : null,
      })
    }
  }, [TARGETS, standardStage, activeLifeCycle])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const renderStageItem = (item: StageItem, level: number = 0): React.ReactNode => {
    const isExpanded = expandedIds.has(item.id)
    const hasChildren = item.children && item.children.length > 0
    const isLeafNode = !hasChildren // Only leaf nodes (no children) should show versions

    return (
      <>
        <div key={item.id} className="flex w-full border-b border-border/50 h-[28px] items-center">
          {/* System Column (Big Column) - Contains Component Name + Version */}
          <div className="flex min-w-[340px] max-w-[340px] flex-1 items-center leading-none border-r border-border">
            {/* Component Name Section */}
            <div className="h-full grow flex items-center">
              <div className="w-2"></div>
              {level >= 0 &&
                [...Array(level)].map((x, i) => (
                  <div key={i} className="w-2" />
                ))}
              {hasChildren ? (
                isExpanded ? (
                  <TbChevronDown 
                    className="w-4 h-4 mr-1 text-muted-foreground cursor-pointer" 
                    onClick={() => toggleExpand(item.id)}
                  />
                ) : (
                  <TbChevronRight 
                    className="w-4 h-4 mr-1 text-muted-foreground cursor-pointer" 
                    onClick={() => toggleExpand(item.id)}
                  />
                )
              ) : (
                <div className="w-5 mr-1" />
              )}
              <span className={cn(
                'text-xs text-foreground',
                level === 0 && 'font-semibold'
              )}>
                {item.name}
              </span>
            </div>
            {/* Version Column - Part of System Column - Only show for leaf nodes */}
            <div className="h-full px-2 flex items-center justify-center w-24 border-l border-border">
              {isLeafNode && item.version && (
                <span className="text-xs text-muted-foreground">{item.version}</span>
              )}
            </div>
          </div>

          {/* Stage Columns - One for each stage - Only show values for leaf nodes */}
          <div className="grow flex items-center">
            {TARGETS.map((target, targetIndex) => {
              // Only show values for leaf nodes (child items without children)
              let cellContent: React.ReactNode = null
              if (isLeafNode) {
                const cycleOption = getCycleOption(item.id, target)
                const cycleValue = getCycleValue(item.id, target)
                const componentState = target.state?.[item.id]
                const version = componentState?.version || item.version || '1.0.0'
                
                // Get the lifecycle option (with fallback to first option if not found)
                let option
                if (activeLifeCycle === 'Deployment Version') {
                  option = cycleValue ? DeploymentVersion.find((opt) => opt.ID === cycleValue) : DeploymentVersion[0]
                } else {
                  option = cycleOption || getLifecycleOptions()[0]
                }
                
                if (option) {
                  const icon = option.icon || ''
                  const iconColor = icon === '✗' ? 'text-red-500' : icon === '🗸' ? 'text-green-500' : ''
                  
                  cellContent = (
                    <div className="flex items-center gap-1">
                      {/* Always show version first */}
                      <span className="text-xs text-muted-foreground">{version}</span>
                      {/* Then show icon with tooltip */}
                      {icon && (
                        <DaTooltip tooltipMessage={option.name}>
                          <span className={`text-sm ${iconColor} cursor-help inline-block`}>{icon}</span>
                        </DaTooltip>
                      )}
                    </div>
                  )
                } else {
                  // Fallback: just show version if no option found
                  cellContent = (
                    <span className="text-xs text-muted-foreground">{version}</span>
                  )
                }
              }
              
              return (
                <div
                  key={targetIndex}
                  className="flex flex-1 justify-center items-center border-l border-border first:border-l-0"
                >
                  {cellContent}
                </div>
              )
            })}
          </div>
        </div>
        {/* Recursively render children if expanded */}
        {hasChildren && isExpanded && (
          <>
            {item.children?.map((child) => renderStageItem(child, level + 1))}
          </>
        )}
      </>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner />
      </div>
    )
  }

  // If plugin is selected, show plugin content with back button
  if (selectedPlugin) {
    return (
      <div className="flex flex-col w-full h-full">
        {/* Back Button Row */}
        <div className="flex items-center border-b border-border bg-background px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPlugin(null)
              setSelectedStageName(null)
            }}
            className="flex items-center gap-2"
          >
            <TbArrowLeft className="w-4 h-4" />
            Back to Staging {selectedStageName && `(${selectedStageName})`}
          </Button>
        </div>
        {/* Plugin Content */}
        <div className="flex-1 overflow-auto">
          <PluginPageRender
            plugin_id={selectedPlugin}
            data={{
              model: model || null,
              prototype: prototype || null,
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[300px] max-h-[90vh] w-full p-4">
      <div className="w-full rounded border border-border bg-background">
        {/* Title */}
        <div className="flex h-[28px] w-full rounded-t bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <div className="flex w-[340px] items-center justify-center border-r border-primary-foreground/20 font-bold text-sm">
            System
          </div>
          <div className="flex grow items-center justify-center border-primary-foreground/20 font-bold text-sm">
            Stages
          </div>
        </div>
        <div className="flex">
          {/* System Column */}
          <div className="flex min-w-[340px] flex-1 flex-col border-r border-border items-center justify-center overflow-x-hidden rounded-s px-1 py-1">
            <div className="flex py-1 h-[80px] w-full items-center justify-center">
              <DaImage
                src={system.icon}
                alt="System"
                className="scale-90 h-full w-full object-contain"
              />
            </div>
            <div className="w-full px-2">
              <select
                aria-label="deploy-select"
                className="text-center border rounded text-xs px-2 py-1 w-full min-w-[100px] text-foreground bg-muted cursor-pointer"
                value={activeLifeCycle}
                onChange={(e) => setActiveLifeCycle(e.target.value)}
              >
                {LIFECYCLES.map((lifecycle) => (
                  <option key={lifecycle} value={lifecycle}>
                    {lifecycle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stage Columns */}
          {stages.map((stage, index) => (
            <div key={stage.name} className="flex flex-1">
              {index > 0 && (
                <div className="relative flex items-center">
                  <div className="h-full border-l border-border"></div>
                  <TbChevronRight className="absolute transform -translate-x-1/2 text-primary bg-background rounded-lg size-10" />
                </div>
              )}
              {/* Stage content */}
              <div className="flex min-w-[100px] flex-1 flex-col items-center justify-center overflow-x-hidden px-1 pb-1 pt-1">
                <div className="flex h-[80px] py-1 w-full items-center justify-center">
                  <DaImage
                    src={stage.image}
                    alt={stage.name}
                    className="scale-90 h-full w-full object-contain"
                  />
                </div>
                <div className="flex items-center px-2 py-1 rounded-lg hover:bg-muted cursor-default">
                  <span className="text-xs font-semibold text-foreground">
                    {stage.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {stage.version}
                </span>
                {/* Update Button with Plugin Dropdown */}
                <div className="mt-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-3 bg-muted hover:bg-muted/80"
                      >
                        Update
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-64 p-1">
                      {/* Header */}
                      <div className="px-2 py-1.5 border-b border-border">
                        <p className="text-xs font-semibold text-foreground">Select Deploy Target</p>
                      </div>
                      {stage.plugins && stage.plugins.length > 0 ? (
                        stage.plugins.map((plugin: Plugin, pluginIndex: number) => (
                          <div key={plugin.id || plugin.slug}>
                            <PluginDropdownItem
                              plugin={plugin}
                              onClick={() => {
                                // Use slug if available, otherwise use id
                                const pluginId = plugin.slug || plugin.id
                                setSelectedPlugin(pluginId)
                                setSelectedStageName(stage.name)
                              }}
                            />
                            {/* Separator line between items (except last) */}
                            {stage.plugins && pluginIndex < stage.plugins.length - 1 && (
                              <div className="h-px bg-border mx-2" />
                            )}
                          </div>
                        ))
                      ) : (
                        <DropdownMenuItem disabled className="text-center">
                          No targets available
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Stage Tree Content */}
        <div className="min-h-[200px] max-h-[340px] h-full overflow-y-auto border-t border-border">
          {/* Data Rows - No header row needed */}
          {standardStage && (
            <div>
              {standardStage.children?.map((child) => renderStageItem(child, 0))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PrototypeTabStaging
