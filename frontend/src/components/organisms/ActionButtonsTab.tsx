import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { Spinner } from '@/components/atoms/spinner'
import { PrototypeRightActionButton } from '@/components/molecules/PrototypeRightActionButtons'
import {
  RightNavPluginButton,
  StagingConfig,
} from '@/components/organisms/CustomTabEditor'
import { cn } from '@/lib/utils'
import { Paged, Plugin } from '@/services/plugin.service'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import DOMPurify from 'dompurify'
import { useState } from 'react'
import {
  TbChevronUp,
  TbEye,
  TbEyeOff,
  TbGripVertical,
  TbListCheck,
  TbPencil,
  TbPlus,
  TbPuzzle,
  TbSearch,
  TbTrash,
} from 'react-icons/tb'

export interface ActionButtonsTabProps {
  pluginsLoading: boolean
  pluginsData: Paged<Plugin> | undefined
  localRightNavPlugins: RightNavPluginButton[]
  setLocalRightNavPlugins: React.Dispatch<
    React.SetStateAction<RightNavPluginButton[]>
  >
}

const ActionButtonEditor = ({
  prefixElement,
  config,
  expanded,
  onVisibleChange,
  onRemove,
  onExpandedChange,
  onHideIconChange,
  onLabelChange,
  onIconSvgChange,
  onVariantChange,
  onCornersChange,
}: {
  prefixElement?: React.ReactNode
  config: RightNavPluginButton
  expanded: boolean
  onVisibleChange: (newVisible: boolean) => void
  onRemove: () => void
  onExpandedChange: (newExpanded: boolean) => void
  onHideIconChange: (newHide: boolean) => void
  onLabelChange: (newLabel: string) => void
  onIconSvgChange: (newSvg: string) => void
  onVariantChange: (newVariant: 'tab' | 'primary' | 'outline' | 'ghost') => void
  onCornersChange: (newCorners: 'none' | 'round' | 'full') => void
}) => {
  return (
    <div className={`border border-border rounded bg-background`}>
      <div className="flex items-center gap-3 p-3">
        {prefixElement}
        {config.iconSvg ? (
          <span
            className="w-5 h-5 shrink-0 [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(config.iconSvg, {
                USE_PROFILES: { svg: true, svgFilters: true },
              }),
            }}
          />
        ) : config.builtin ? (
          <TbListCheck className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : (
          <TbPuzzle className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {config.label || config.plugin}
          </p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            {config.builtin
              ? `Builtin: ${config.builtin}`
              : `Plugin: ${config.plugin}`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onExpandedChange(!expanded)}
          className="h-8 w-8 shrink-0"
        >
          {expanded ? (
            <TbChevronUp className="w-4 h-4" />
          ) : (
            <TbPencil className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onVisibleChange(!config.hidden)}
          className="h-8 w-8 shrink-0"
          title={config.hidden ? 'Show button' : 'Hide button'}
        >
          {config.hidden ? (
            <TbEyeOff className="w-4 h-4 text-muted-foreground" />
          ) : (
            <TbEye className="w-4 h-4" />
          )}
        </Button>
        {config.builtin ? null : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove()}
            className={cn(
              'h-8 w-8 shrink-0 text-destructive hover:text-destructive',
            )}
          >
            <TbTrash className="w-4 h-4" />
          </Button>
        )}
      </div>
      {expanded && (
        <div className="border-t border-border p-3 flex flex-col gap-3">
          {/* Show Icon */}
          <div className="flex items-center gap-3">
            <Label className="text-xs w-20 shrink-0 text-foreground">
              Show Icon
            </Label>
            <button
              type="button"
              onClick={() => onHideIconChange(!config.hideIcon)}
              className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
            >
              {config.hideIcon ? (
                <>
                  <TbEyeOff className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Hidden</span>
                </>
              ) : (
                <>
                  <TbEye className="w-4 h-4" />
                  <span>Visible</span>
                </>
              )}
            </button>
          </div>
          {/* Label */}
          <div className="flex items-center gap-3">
            <Label className="text-xs w-20 shrink-0 text-foreground">
              Label
            </Label>
            <Input
              value={config.label || ''}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder={config.builtin ? 'Builtin' : config.plugin}
              className="text-sm flex-1"
            />
          </div>
          {/* Icon SVG */}
          <div className="flex items-start gap-3">
            <Label className="text-xs w-20 shrink-0 text-foreground mt-1">
              Icon (SVG)
            </Label>
            <div className="flex gap-2 items-start flex-1">
              <textarea
                value={config.iconSvg || ''}
                onChange={(e) => onIconSvgChange(e.target.value)}
                placeholder="<svg xmlns=..."
                className="text-xs font-mono flex-1 min-h-15 resize-y rounded border border-input bg-background px-2 py-1.5 outline-none focus:ring-1 focus:ring-ring"
                spellCheck={false}
              />
            </div>
          </div>
          {/* Style */}
          <div className="flex items-start gap-3">
            <Label className="text-xs w-20 shrink-0 text-foreground mt-1">
              Style
            </Label>
            <div className="flex flex-wrap gap-2">
              {(['tab', 'primary', 'outline', 'ghost'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onVariantChange(v)}
                  className={`px-3 py-1 text-xs rounded border capitalize transition-colors ${(config.variant || 'tab') === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-accent'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          {/* Border Radius */}
          <div className="flex items-center gap-3">
            <Label className="text-xs w-20 shrink-0 text-foreground mt-1">
              Corners
            </Label>
            <div className="flex flex-col gap-3 flex-1">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: 'none', label: 'Square' },
                    { value: 'round', label: 'Round' },
                    { value: 'full', label: 'Pill' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onCornersChange(opt.value)}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                      config.corners === opt.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-accent'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Preview */}
          <div className="flex items-center gap-3">
            <Label className="text-xs w-20 shrink-0 text-foreground">
              Preview
            </Label>
            <div className="relative flex items-center min-h-12 border-2 border-dashed border-muted-foreground/30 rounded-lg px-4 py-3 bg-muted/50 gap-2">
              <span className="absolute -top-2.5 left-3 px-1.5 text-[10px] font-medium text-muted-foreground bg-background rounded">
                Preview
              </span>
              <PrototypeRightActionButton
                config={{
                  label: config.label || '',
                  iconSvg: config.iconSvg,
                  variant: config.variant,
                  type: 'custom',
                  hideIcon: config.hideIcon,
                  corners: config.corners,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ActionButtonsTab = ({
  pluginsLoading,
  pluginsData,
  localRightNavPlugins,
  setLocalRightNavPlugins,
}: ActionButtonsTabProps) => {
  const [showRightNavPluginPicker, setShowRightNavPluginPicker] =
    useState(false)
  const [expandedRightNavItem, setExpandedRightNavItem] = useState<
    'staging' | number | null
  >(null)
  const [rightNavSearchTerm, setRightNavSearchTerm] = useState('')

  // Filter plugins for right nav picker (excluding already-added ones)
  const filteredRightNavPlugins =
    pluginsData?.results?.filter(
      (plugin) =>
        !localRightNavPlugins.some((b) => b.plugin === plugin.slug) &&
        (plugin.name.toLowerCase().includes(rightNavSearchTerm.toLowerCase()) ||
          plugin.slug
            ?.toLowerCase()
            .includes(rightNavSearchTerm.toLowerCase())),
    ) ?? []

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Configure buttons displayed on the right side of the tab bar, including
        the Staging button and plugin shortcuts.
      </p>

      <div className="flex flex-col gap-2">
        <DragDropContext
          onDragEnd={(result) => {
            const { source, destination } = result
            if (!destination) return
            if (
              source.droppableId === 'rightNavButtons' &&
              destination.droppableId === 'rightNavButtons'
            ) {
              const reordered = Array.from(localRightNavPlugins)
              const [moved] = reordered.splice(source.index, 1)
              reordered.splice(destination.index, 0, moved)
              setLocalRightNavPlugins(reordered)
            }
          }}
        >
          <Droppable
            droppableId="rightNavButtons"
            type="RIGHT_NAV_BUTTONS"
            renderClone={(provided, snapshot, rubric) => {
              const btn = localRightNavPlugins[rubric.source.index]
              const key = `key-${JSON.stringify({
                plugin: btn.plugin,
                label: btn.label,
                hideIcon: btn.hideIcon,
                variant: btn.variant,
                corners: btn.corners,
              })}`
              return (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`${
                    snapshot.isDragging ? 'opacity-40' : ''
                  } ${btn.hidden ? 'opacity-60' : ''} border border-border rounded bg-background`}
                >
                  <ActionButtonEditor
                    config={btn}
                    expanded={expandedRightNavItem === rubric.source.index}
                    onRemove={() => {}}
                    onVisibleChange={() => {}}
                    onExpandedChange={() => {}}
                    onHideIconChange={() => {}}
                    onLabelChange={() => {}}
                    onIconSvgChange={() => {}}
                    onVariantChange={() => {}}
                    onCornersChange={() => {}}
                  />
                </div>
              )
            }}
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-col gap-2"
              >
                {localRightNavPlugins.map((btn, i) => {
                  const key = `key-${JSON.stringify({
                    plugin: btn.plugin,
                    label: btn.label,
                    hideIcon: btn.hideIcon,
                    variant: btn.variant,
                    corners: btn.corners,
                  })}`

                  return (
                    <Draggable key={key} draggableId={key} index={i}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${
                            snapshot.isDragging ? 'opacity-40' : ''
                          } ${btn.hidden ? 'opacity-60' : ''}`}
                        >
                          <ActionButtonEditor
                            prefixElement={
                              <div
                                {...provided.dragHandleProps}
                                className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                              >
                                <TbGripVertical className="w-5 h-5" />
                              </div>
                            }
                            config={
                              btn.builtin
                                ? {
                                    ...btn,
                                    builtin: 'staging',
                                    label: btn.label || 'Staging',
                                    variant: btn.variant,
                                    hideIcon: btn.hideIcon,
                                    corners: btn.corners,
                                  }
                                : btn
                            }
                            expanded={expandedRightNavItem === i}
                            onRemove={() =>
                              setLocalRightNavPlugins((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            onVisibleChange={(newVisible) =>
                              setLocalRightNavPlugins((prev) =>
                                prev.map((b, idx) =>
                                  idx === i ? { ...b, hidden: newVisible } : b,
                                ),
                              )
                            }
                            onExpandedChange={(newExpanded) =>
                              setExpandedRightNavItem(newExpanded ? i : null)
                            }
                            onHideIconChange={(newHide) =>
                              setLocalRightNavPlugins((prev) =>
                                prev.map((b, idx) =>
                                  idx === i ? { ...b, hideIcon: newHide } : b,
                                ),
                              )
                            }
                            onLabelChange={(newLabel) =>
                              setLocalRightNavPlugins((prev) =>
                                prev.map((b, idx) =>
                                  idx === i ? { ...b, label: newLabel } : b,
                                ),
                              )
                            }
                            onIconSvgChange={(newSvg) =>
                              setLocalRightNavPlugins((prev) =>
                                prev.map((b, idx) =>
                                  idx === i ? { ...b, iconSvg: newSvg } : b,
                                ),
                              )
                            }
                            onVariantChange={(newVariant) =>
                              setLocalRightNavPlugins((prev) =>
                                prev.map((b, idx) =>
                                  idx === i ? { ...b, variant: newVariant } : b,
                                ),
                              )
                            }
                            onCornersChange={(newCorners) =>
                              setLocalRightNavPlugins((prev) =>
                                prev.map((b, idx) =>
                                  idx === i ? { ...b, corners: newCorners } : b,
                                ),
                              )
                            }
                          />
                        </div>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {!showRightNavPluginPicker ? (
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setShowRightNavPluginPicker(true)}
        >
          <TbPlus className="w-4 h-4 mr-2" />
          Add Button
        </Button>
      ) : (
        <div className="flex flex-col gap-2 border border-border rounded p-3">
          <div className="relative">
            <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search plugins..."
              value={rightNavSearchTerm}
              onChange={(e) => setRightNavSearchTerm(e.target.value)}
              className="pl-10 text-sm"
              autoFocus
            />
          </div>
          <div className="flex flex-col max-h-48 overflow-y-auto">
            {pluginsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Spinner size={20} />
              </div>
            ) : filteredRightNavPlugins.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">
                {rightNavSearchTerm
                  ? 'No plugins found'
                  : 'No plugins available'}
              </p>
            ) : (
              filteredRightNavPlugins.map((plugin) => (
                <button
                  key={plugin.id}
                  onClick={() => {
                    setLocalRightNavPlugins((prev) => [
                      ...prev,
                      { plugin: plugin.slug, label: plugin.name },
                    ])
                    setShowRightNavPluginPicker(false)
                    setRightNavSearchTerm('')
                  }}
                  className="flex items-center gap-3 p-2 hover:bg-accent rounded transition-colors text-left"
                >
                  {plugin.image ? (
                    <img
                      src={plugin.image}
                      alt={plugin.name}
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {plugin.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {plugin.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {plugin.slug}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowRightNavPluginPicker(false)
                setRightNavSearchTerm('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActionButtonsTab
