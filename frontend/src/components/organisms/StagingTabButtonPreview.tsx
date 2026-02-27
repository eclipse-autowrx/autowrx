import { FC } from 'react'
import { TbListCheck } from 'react-icons/tb'
import DaTabItem from '@/components/atoms/DaTabItem'
import { StagingConfig } from '@/components/organisms/CustomTabEditor'

interface StagingTabButtonPreviewProps {
    stagingConfig: StagingConfig
}

const StagingTabButtonPreview: FC<StagingTabButtonPreviewProps> = ({
    stagingConfig,
}) => {
    const previewLabel = stagingConfig.label || 'Staging'
    const previewVariant = stagingConfig.variant || 'tab'

    const icon = stagingConfig.hideIcon ? null : (
        stagingConfig.iconSvg
            ? <span className="w-4 h-4 shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current" dangerouslySetInnerHTML={{ __html: stagingConfig.iconSvg }} />
            : <TbListCheck className="w-4 h-4" />
    )

    if (previewVariant === 'tab') {
        return (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-primary border-b-2 border-primary pb-0.5">
                {icon}{previewLabel}
            </span>
        )
    }

    const btnClass: Record<string, string> = {
        primary: 'bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium',
        outline: 'border border-border px-3 py-1 rounded text-sm font-medium',
        secondary: 'bg-secondary text-secondary-foreground px-3 py-1 rounded text-sm font-medium',
        ghost: 'px-3 py-1 rounded text-sm font-medium hover:bg-accent',
    }

    return (
        <span className={`flex items-center gap-1.5 ${btnClass[previewVariant] || ''}`}>
            {icon}{previewLabel}
        </span>
    )
}

export default StagingTabButtonPreview
