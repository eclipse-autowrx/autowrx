import DaTabItem from '@/components/atoms/DaTabItem'
import { PrototypeRightActionButton } from '@/components/molecules/PrototypeRightActionButtons'
import { StagingConfig } from '@/components/organisms/CustomTabEditor'
import { renderTabIcon } from '@/lib/tabUtils'
import { TbListCheck } from 'react-icons/tb'
import { Link, useParams } from 'react-router-dom'

interface StagingTabButtonProps {
  stagingConfig: StagingConfig
  onClick?: () => void
  disabled?: boolean
  active?: boolean
  title?: string
}

const StagingTabButton = ({
  stagingConfig,
  onClick,
  disabled = false,
  active = false,
}: StagingTabButtonProps) => {
  const { model_id, prototype_id, tab } = useParams()

  const stagingLabel = stagingConfig.label || 'Staging'
  const stagingIcon = stagingConfig.hideIcon ? null : stagingConfig.iconSvg ? (
    renderTabIcon({ iconSvg: stagingConfig.iconSvg }, null)
  ) : (
    <span className="size-5 mr-2 grid place-items-center">
      <TbListCheck />
    </span>
  )

  const stagingVariant = stagingConfig.variant || 'tab'
  const isActive = active === true ? active : tab === 'staging'

  // Determine if this is routing-based (uses Link) or callback-based (uses onClick)
  const isRoutingBased = onClick === undefined && model_id && prototype_id
  const stagingTo = isRoutingBased
    ? `/model/${model_id}/library/prototype/${prototype_id}/staging`
    : '#'
  if (stagingVariant === 'tab')
    return (
      <DaTabItem active={isActive} to={stagingTo} dataId="tab-staging">
        {stagingIcon}
        {stagingLabel}
      </DaTabItem>
    )

  if (isRoutingBased) {
    return (
      <Link to={stagingTo} className="flex items-center self-center">
        <PrototypeRightActionButton
          config={{
            label: stagingLabel,
            iconSvg: stagingConfig.iconSvg,
            variant: stagingVariant,
            corners: stagingConfig.corners,
            iconElement: stagingIcon,
            hideIcon: stagingConfig.hideIcon,
            type: 'custom',
          }}
        />
      </Link>
    )
  }

  return (
    <PrototypeRightActionButton
      disabled={disabled}
      onClick={onClick}
      config={{
        label: stagingLabel,
        iconSvg: stagingConfig.iconSvg,
        variant: stagingVariant,
        corners: stagingConfig.corners,
        hideIcon: stagingConfig.hideIcon,
        iconElement: stagingIcon,
        type: 'custom',
      }}
    />
  )
}

export default StagingTabButton
