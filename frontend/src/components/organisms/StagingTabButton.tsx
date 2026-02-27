import { FC } from 'react'
import { Link } from 'react-router-dom'
import { TbListCheck } from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import DaTabItem from '@/components/atoms/DaTabItem'
import { StagingConfig } from '@/components/organisms/CustomTabEditor'

interface StagingTabButtonProps {
    stagingConfig: StagingConfig
    tab?: string
    /**
     * For routing-based implementation (PagePrototypeDetail).
     * If provided with prototype_id, creates a Link-based navigation button.
     */
    model_id?: string
    prototype_id?: string
    /**
     * For local state navigation (PageNewPrototypeDetail).
     * If provided, the button uses this callback instead of Link navigation.
     */
    onClick?: () => void
    disabled?: boolean
    active?: boolean
    title?: string
}

const StagingTabButton: FC<StagingTabButtonProps> = ({
    stagingConfig,
    tab,
    model_id,
    prototype_id,
    onClick,
    disabled = false,
    active = false,
    title,
}) => {
    const stagingLabel = stagingConfig.label || 'Staging'

    const stagingIcon = stagingConfig.hideIcon ? null : (
        stagingConfig.iconUrl
            ? <img src={stagingConfig.iconUrl} alt="" className="w-5 h-5 mr-2 object-contain shrink-0" />
            : <TbListCheck className="w-5 h-5 mr-2" />
    )

    const stagingVariant = stagingConfig.variant || 'tab'
    const isActive = active === true ? active : (tab === 'staging')

    // Determine if this is routing-based (uses Link) or callback-based (uses onClick)
    const isRoutingBased = onClick === undefined && model_id && prototype_id
    const stagingTo = isRoutingBased
        ? `/model/${model_id}/library/prototype/${prototype_id}/staging`
        : '#'

    if (stagingVariant === 'tab') {
        // For tab variant
        if (isRoutingBased) {
            return (
                <DaTabItem active={isActive} to={stagingTo} dataId="tab-staging">
                    {stagingIcon}{stagingLabel}
                </DaTabItem>
            )
        }
        // Local state variant (tab style)
        return (
            <button
                disabled={disabled}
                onClick={onClick}
                className={`flex items-center px-4 h-full text-sm border-b-2 transition-colors ${isActive
                    ? 'border-primary text-primary font-medium'
                    : disabled
                        ? 'border-transparent text-muted-foreground/30 cursor-default'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                title={title}
            >
                {stagingIcon}{stagingLabel}
            </button>
        )
    }

    // Button variants (primary, outline, secondary, ghost)
    const btnVariant = stagingVariant === 'primary' ? 'default' as const : stagingVariant as 'outline' | 'secondary' | 'ghost'

    if (isRoutingBased) {
        return (
            <Link to={stagingTo} className="flex items-center self-center mx-2">
                <Button variant={btnVariant} size="sm" className={isActive ? 'ring-2 ring-primary/30' : ''}>
                    {stagingIcon}{stagingLabel}
                </Button>
            </Link>
        )
    }

    // Local state button variant
    return (
        <Button
            variant={btnVariant}
            size="sm"
            disabled={disabled}
            onClick={onClick}
            className={`mx-2 ${isActive ? 'ring-2 ring-primary/30' : ''}`}
            title={title}
        >
            {stagingIcon}{stagingLabel}
        </Button>
    )
}

export default StagingTabButton
