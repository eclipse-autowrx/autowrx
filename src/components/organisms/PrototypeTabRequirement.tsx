import React, { useState, useEffect } from 'react'
import {
  TbArrowsMaximize,
  TbArrowsMinimize,
  TbLoader2,
  TbPlus,
  TbScan,
  TbTable,
  TbTarget,
  TbTextScan2,
} from 'react-icons/tb'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { updatePrototypeService } from '@/services/prototype.service'
import { DaButton } from '../atoms/DaButton'
import { cn } from '@/lib/utils'
import { useSystemUI } from '@/hooks/useSystemUI'
import DaText from '../atoms/DaText'
import { ReactFlowProvider } from '@xyflow/react'
import DaRequirementExplorer from '../molecules/prototype_requirements/DaRequirementExplorer'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaRequirementTable from '../molecules/prototype_requirements/DaRequirementTable'
import { useRequirementStore } from '../molecules/prototype_requirements/hook/useRequirementStore'
import RequirementEvaluationDialog from '../molecules/prototype_requirements/RequirementEvaluationDialog'
import { Requirement } from '@/types/model.type'
import RequirementCreateDialog from '../molecules/prototype_requirements/RequirementCreateDialog'
import RequirementUpdateDialog from '../molecules/prototype_requirements/RequirementUpdateDialog'

const PrototypeTabRequirement = () => {
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const { data: prototype } = useCurrentPrototype()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const {
    requirements,
    setRequirements,
    isScanning,
    toggleScanning,
    addRequirement,
    removeRequirement,
    updateRequirement,
  } = useRequirementStore()
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false)
  const [showCreateRequirementDialog, setShowCreateRequirementDialog] =
    useState(false)
  const [editingReq, setEditingReq] = useState<Requirement | null>(null)
  const [showUpdate, setShowUpdate] = useState(false)

  // Use existing system UI state or create a new one for requirements
  const {
    showPrototypeRequirementFullScreen,
    setShowPrototypeRequirementFullScreen,
  } = useSystemUI() || {
    showPrototypeRequirementFullScreen: false,
    setShowPrototypeRequirementFullScreen: (val: boolean) => {},
  }

  useEffect(() => {
    if (prototype?.extend && Array.isArray(prototype.extend.requirements)) {
      let items = JSON.parse(
        JSON.stringify(prototype.extend.requirements),
      ) as Requirement[]
      items.forEach((item) => {
        item.title = item.title || item.id
        item.id = item.id || crypto.randomUUID()
        item.description = item.description || ''
        item.type = item.type || 'Functional Requirement'
        item.source = item.source || {
          type: 'external',
          url: 'https://example.com',
        }
        item.rating = item.rating || {
          priority: item.priority || 3,
          relevance: item.relevance || 4,
          impact: item.impact || 2,
        }
      })
      setRequirements(items)
    }
  }, [prototype, setRequirements])

  const handleCreateAndSave = async (newReq: Requirement) => {
    // 1) add locally
    addRequirement(newReq)

    // 2) persist immediately
    if (!prototype) return
    setIsSaving(true)
    try {
      // grab the updated array
      const allReqs = useRequirementStore.getState().requirements
      await updatePrototypeService(prototype.id, {
        extend: { requirements: allReqs },
      })
    } catch (error) {
      console.error('Failed to save after create:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    // 1) remove local copy
    removeRequirement(id)

    // 2) persist updated array
    if (!prototype) return
    setIsSaving(true)
    try {
      const allReqs = useRequirementStore.getState().requirements
      await updatePrototypeService(prototype.id, {
        extend: { requirements: allReqs },
      })
    } catch (err) {
      console.error('Failed to delete requirement', err)
    } finally {
      setIsSaving(false)
    }
  }

  // EDIT
  const handleEdit = (id: string) => {
    const req = requirements.find((r) => r.id === id)
    if (!req) return
    setEditingReq(req)
    setShowUpdate(true)
  }

  const handleUpdateAndSave = async (updatedReq: Requirement) => {
    updateRequirement(updatedReq)
    if (!prototype) return
    setIsSaving(true)
    try {
      const allReqs = useRequirementStore.getState().requirements
      await updatePrototypeService(prototype.id, {
        extend: { requirements: allReqs },
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  if (!prototype) {
    return <div>No prototype available</div>
  }

  return (
    <div
      className={cn(
        'flex w-full h-full flex-col bg-white rounded-md py-4 px-10',
        showPrototypeRequirementFullScreen
          ? 'fixed inset-0 z-50 overflow-auto bg-white'
          : '',
      )}
    >
      <div className="flex flex-col w-full h-full">
        <div className="flex items-center border-b pb-2 mb-4">
          <DaText variant="title" className="text-da-primary-500">
            Requirements: {prototype?.name}
          </DaText>
          <div className="grow" />
          {isAuthorized && (
            <div className="flex items-center space-x-1">
              <DaButton
                size="sm"
                variant="editor"
                onClick={() => toggleScanning()}
              >
                <TbTextScan2 className="size-4 mr-1" /> Run new scan
              </DaButton>
              <DaButton
                size="sm"
                variant="editor"
                onClick={() => setShowCreateRequirementDialog(true)}
              >
                <TbPlus className="size-4 mr-1" /> New Requirement
              </DaButton>
              <DaButton
                onClick={() => setIsEditing(!isEditing)}
                className="!justify-start"
                variant="editor"
                size="sm"
              >
                {isEditing ? (
                  <TbTarget className="w-4 h-4 mr-1" />
                ) : (
                  <TbTable className="w-4 h-4 mr-1" />
                )}
                {isEditing ? 'Explorer View' : 'Table View'}
              </DaButton>
            </div>
          )}
          <DaButton
            onClick={() =>
              setShowPrototypeRequirementFullScreen(
                !showPrototypeRequirementFullScreen,
              )
            }
            size="sm"
            variant="editor"
          >
            {showPrototypeRequirementFullScreen ? (
              <TbArrowsMinimize className="size-4" />
            ) : (
              <TbArrowsMaximize className="size-4" />
            )}
          </DaButton>
        </div>

        <div className="flex w-full h-full">
          {isEditing ? (
            <div className="flex w-full h-full">
              <DaRequirementTable onDelete={handleDelete} onEdit={handleEdit} />
            </div>
          ) : (
            <ReactFlowProvider>
              <DaRequirementExplorer
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </ReactFlowProvider>
          )}
        </div>
      </div>
      <RequirementEvaluationDialog
        open={showEvaluationDialog}
        onOpenChange={setShowEvaluationDialog}
      />
      <RequirementCreateDialog
        open={showCreateRequirementDialog}
        onOpenChange={setShowCreateRequirementDialog}
        onCreate={handleCreateAndSave}
      />
      <RequirementUpdateDialog
        open={showUpdate}
        onOpenChange={setShowUpdate}
        requirement={editingReq}
        onUpdate={handleUpdateAndSave}
      />
    </div>
  )
}

export default PrototypeTabRequirement
