import { useEffect, useState } from 'react'
import DaText from '../atoms/DaText'
import DaDashboardTemplate from '../molecules/DaDashboardTemplate'
import dashboard_templates from '@/data/dashboard_templates'
import { DaButton } from '../atoms/DaButton'
import { TbChevronLeft, TbRestore } from 'react-icons/tb'
import DaDashboardEditor from '../molecules/dashboard/DaDashboardEditor'
import CodeEditor from '../molecules/CodeEditor'
import { cloneDeep } from 'lodash'

type GenAIDashboardConfigTemplatesProps = {
  onTemplateSelected?: (config: string) => void
}

const GenAIDashboardConfigTemplates = ({
  onTemplateSelected,
}: GenAIDashboardConfigTemplatesProps) => {
  const [templates, setTemplates] = useState(cloneDeep(dashboard_templates))
  const [selected, setSelected] = useState<number | null>(0)

  const [mode, setMode] = useState<'edit' | 'view'>('view')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const resetViewMode = () => {
    setMode('view')
    setSelected(editingIndex)
    setEditingIndex(null)
  }

  useEffect(() => {
    if (selected !== null) {
      onTemplateSelected?.(templates[selected].config)
    } else {
      onTemplateSelected?.('')
    }
  }, [selected])

  // Edit dashboard
  const [, setTicker] = useState(0)
  const [isConfigValid, setIsConfigValid] = useState(true)
  const handleEditClick = (index: number) => {
    setMode('edit')
    setEditingIndex(index)
    setSelected(null)
  }
  const handleDashboardConfigChanged = (newConfig: string) => {
    const newTemplates = [...templates]
    newTemplates[editingIndex as number].config = newConfig
    setTemplates(newTemplates)
  }
  const resetDashboard = () => {
    console.log(
      'initial config:',
      dashboard_templates[editingIndex as number].config,
    )
    handleDashboardConfigChanged(
      dashboard_templates[editingIndex as number].config,
    )
  }

  return (
    <div className="-mx-4 flex h-full flex-col overflow-y-auto px-4">
      {mode === 'view' || editingIndex === null ? (
        <>
          <DaText variant="title" className="block text-da-primary-500">
            Choose Dashboard Template
          </DaText>
          <DaText variant="small" className="text-da-gray-medium">
            Dashboard templates are pre-built dashboards that you can use to
            visualize your app.
          </DaText>
          {/* Templates */}
          <div className="mt-4 grid flex-1 grid-cols-3 grid-rows-2 gap-4">
            {templates.map((template, index) => (
              <DaDashboardTemplate
                onClick={() => setSelected(index)}
                onEditClick={() => handleEditClick(index)}
                key={index}
                selected={selected === index}
                template={template}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Title & buttons */}
          <div className="mb-4 flex items-center gap-4">
            <DaButton
              disabled={!isConfigValid}
              onClick={resetViewMode}
              className="w-fit gap-1"
              size="sm"
              variant="outline-nocolor"
            >
              <TbChevronLeft className="h-4 w-4" /> Go back
            </DaButton>

            <DaButton
              onClick={resetDashboard}
              className="w-fit gap-1"
              size="sm"
              variant="outline-nocolor"
            >
              <TbRestore className="h-4 w-4" /> Reset
            </DaButton>

            <DaText
              variant="regular-bold"
              className="block text-da-primary-500"
            >
              Updating {templates[editingIndex].name}
            </DaText>
          </div>

          {/* Dashboard display */}
          <DaDashboardEditor
            entireWidgetConfig={templates[editingIndex].config}
            onDashboardConfigChanged={handleDashboardConfigChanged}
            onConfigValidChanged={setIsConfigValid}
            hideWidget
          />

          {/* Dashboard config editor */}
          <div className="mt-4 min-h-[280px]">
            <CodeEditor
              code={templates[editingIndex].config}
              setCode={handleDashboardConfigChanged}
              editable={true}
              language="json"
              onBlur={() => {
                setTicker((oldTicker) => oldTicker + 1)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default GenAIDashboardConfigTemplates
