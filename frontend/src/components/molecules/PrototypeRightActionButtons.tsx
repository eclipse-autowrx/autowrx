import { Button } from '@/components/atoms/button'
import DaTabItem from '@/components/atoms/DaTabItem'
import { TabConfig } from '@/components/organisms/CustomTabEditor'
import StagingTabButton from '@/components/organisms/StagingTabButton'
import { renderTabIcon } from '@/lib/tabUtils'
import { cn } from '@/lib/utils'
import { useNavigate, useParams } from 'react-router-dom'

export interface PrototypeRightActionButtonProps {
  tabs: TabConfig[]
}

export const PrototypeRightActionButton = ({
  config,
  disabled,
  onClick,
}: {
  config: TabConfig & {
    iconElement?: React.ReactNode
  }
  disabled?: boolean
  onClick?: () => void
}) => {
  const icon = !config.hideIcon
    ? renderTabIcon(
        {
          iconSvg: config.iconSvg,
        },
        null,
      ) || config.iconElement
    : null

  if (config.type === 'builtin' || config.builtin)
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
        config.corners === 'round'
          ? 'rounded-lg'
          : config.corners === 'full'
            ? 'rounded-full'
            : config.corners === 'none'
              ? 'rounded-none'
              : '',
      )}
      variant={config.variant === 'primary' ? 'default' : config.variant}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {config.label}
    </Button>
  )
}

const PrototypeRightActionButtons = ({
  tabs,
}: PrototypeRightActionButtonProps) => {
  const { model_id, prototype_id } = useParams()
  const navigate = useNavigate()
  const visibleTabs = tabs.filter((t) => !t.hidden)
  return (
    <div className="flex items-center gap-2">
      {visibleTabs.map((tabConfig) => {
        return (
          <PrototypeRightActionButton
            key={`right-actions-${tabConfig}-${tabConfig.label}`}
            config={tabConfig}
            onClick={
              tabConfig.type === 'builtin' || tabConfig.builtin
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
