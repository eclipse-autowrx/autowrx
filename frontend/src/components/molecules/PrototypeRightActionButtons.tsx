// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
import DaTabItem from '@/components/atoms/DaTabItem'
import { DEFAULT_COPY_RIGHT_NAV_BUTTON, TabConfig } from '@/components/organisms/CustomTabEditor'
import StagingTabButton from '@/components/organisms/StagingTabButton'
import { renderTabIcon } from '@/lib/tabUtils'
import { cn } from '@/lib/utils'
import { useNavigate, useParams } from 'react-router-dom'

const DEFAULT_STAGING_TAB: TabConfig = {
  builtin: 'staging',
  label: 'Staging',
  type: 'builtin',
}

const DEFAULT_COPY_TAB: TabConfig = {
  ...DEFAULT_COPY_RIGHT_NAV_BUTTON,
  type: 'builtin',
} as TabConfig

export interface PrototypeRightActionButtonProps {
  tabs?: TabConfig[]
  onClick?: (tabConfig: TabConfig) => void
  onCopyClick?: () => void
  stagingDisabled?: boolean
  stagingDisabledTitle?: string
}

export const PrototypeRightActionButton = ({
  config,
  disabled,
  title,
  dataId,
  onClick,
}: {
  config: TabConfig & {
    iconElement?: React.ReactNode
  }
  disabled?: boolean
  title?: string
  dataId?: string
  onClick?: () => void
}) => {
  const isCopy = config.builtin === 'copy'
  const icon = !config.hideIcon
    ? renderTabIcon(
        {
          iconSvg: config.iconSvg,
        },
        null,
      ) || config.iconElement
    : null

  if ((config.type === 'builtin' || config.builtin) && !isCopy)
    return (
      <StagingTabButton
        stagingConfig={{
          hideIcon: config.hideIcon,
          iconSvg: config.iconSvg,
          label: config.label,
          variant: config.variant,
          corners: config.corners,
        }}
        disabled={disabled}
        title={title}
        onClick={onClick}
      />
    )

  if (config.variant === 'tab') {
    return (
      <DaTabItem>
        {icon}
        {config.label}
      </DaTabItem>
    )
  }

  return (
    <Button
      className={cn(
        'flex items-center gap-0 [&_svg]:size-full!',
        isCopy && 'border-primary',
        config.corners === 'round'
          ? 'rounded-lg'
          : config.corners === 'full'
            ? 'rounded-full'
            : config.corners === 'none'
              ? 'rounded-none'
              : '',
      )}
      variant={config.variant === 'primary' ? 'default' : config.variant}
      size="sm"
      disabled={disabled}
      title={title}
      data-id={dataId}
      onClick={onClick}
    >
      {icon}
      {config.label}
    </Button>
  )
}

const PrototypeRightActionButtons = ({
  tabs,
  onClick,
  onCopyClick,
  stagingDisabled,
  stagingDisabledTitle,
}: PrototypeRightActionButtonProps) => {
  const { model_id, prototype_id } = useParams()
  const navigate = useNavigate()
  const rawTabs = tabs ?? []
  const visibleTabs = rawTabs.filter((t) => !t.hidden)
  const hasStagingEntry = rawTabs.some((t) => t.builtin === 'staging')
  const hasCopyEntry = rawTabs.some((t) => t.builtin === 'copy')
  let displayTabs =
    tabs === undefined
      ? [DEFAULT_COPY_TAB, DEFAULT_STAGING_TAB]
      : hasStagingEntry
        ? visibleTabs
        : [DEFAULT_STAGING_TAB, ...visibleTabs]
  if (tabs !== undefined && !hasCopyEntry) {
    displayTabs = [DEFAULT_COPY_TAB, ...displayTabs]
  }
  return (
    <div className="flex items-center gap-2">
      {displayTabs.map((tabConfig) => {
        const isStaging = tabConfig.builtin === 'staging'
        const isCopy = tabConfig.builtin === 'copy'
        return (
          <PrototypeRightActionButton
            key={`right-actions-btn-${JSON.stringify(tabConfig)}`}
            config={tabConfig}
            disabled={isStaging ? stagingDisabled : undefined}
            title={
              isCopy
                ? 'Copy this prototype into a model'
                : isStaging
                  ? stagingDisabledTitle
                  : undefined
            }
            dataId={isCopy ? 'btn-prototype-copy' : undefined}
            onClick={
              isCopy
                ? onCopyClick
                : tabConfig.openMode === 'dialog'
                  ? stagingDisabled && isStaging
                    ? undefined
                    : () => onClick?.(tabConfig)
                  : tabConfig.type === 'builtin' || tabConfig.builtin
                    ? undefined
                    : () =>
                        navigate(
                          `/model/${model_id}/library/prototype/${prototype_id}/plug?plugid=${tabConfig.plugin}`,
                        )
            }
          />
        )
      })}
    </div>
  )
}

export default PrototypeRightActionButtons
