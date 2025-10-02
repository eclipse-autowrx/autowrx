// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { TbRefresh, TbEye, TbEyeOff, TbPlus, TbTrash, TbEdit, TbX, TbDeviceFloppy } from 'react-icons/tb'
import { Prototype } from '@/types/model.type'
import { set } from 'lodash'
import useRuntimeStore from '@/stores/runtimeStore'
import useModelStore from '@/stores/modelStore'
import { shallow } from 'zustand/shallow'
import { updatePrototypeService } from '@/services/prototype.service'

interface WatchVariable {
  id: string
  name: string
  type?: string
  value?: any
}

interface VarItemProps {
  variable: WatchVariable,
  onEnter: (obj: any) => void,
  requestDeleteVar: (id: string) => void
}

const VarItem = ({ variable, onEnter, requestDeleteVar }: VarItemProps) => {
  const [value, setValue] = useState(variable.value)
  return (
    <div key={variable.id} className="bg-da-gray-dark pl-2 pr-1 px-0 py-0.5 rounded">
      <div className="flex justify-between items-center">
        <div className="flex-1 flex items-center">
          <div className="flex items-center gap-1 grow">
            <span className="font-mono text-sm font-bold text-da-white">
              {variable.name}
            </span>
            <span className="text-[10px] px-1 py-0 font-semibold text-white rounded bg-da-gray-medium">
              {variable.type}
            </span>
          </div>
          <span
            className="ml-2 min-w-20 text-right inline-block text-da-white text-sm font-mono px-2 py-0.5  bg-da-gray-medium rounded"
          >
            {String(variable.value) || 'N/A'}
          </span>
          <input type="text"
            value={value}
            className="w-20 flex px-2 py-1 h-6 ml-2 rounded
                text-da-gray-dark text-right font-semibold
                focus-visible:ring-0 focus-visible:outline-none
                disabled:cursor-not-allowed"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter") {
                if (onEnter && e.target.value) {
                  onEnter(e.target.value)
                  setValue("")
                }
              }
            }}
          />
        </div>
        <div className="ml-1">
          <DaButton
            variant="plain"
            size="sm"
            onClick={() => requestDeleteVar(variable.id)}
            className="!p-1 !text-white"
          >
            <TbTrash size={18} />
          </DaButton>
        </div>
      </div>
    </div>
  )
}

export interface PrototypeVarsWatchProps {
  requestWriteVarValue?: (obj: any) => void
}

const PrototypeVarsWatch: FC<PrototypeVarsWatchProps> = ({ requestWriteVarValue }) => {
  const [prototype, setActivePrototype] = useModelStore(
    (state) => [
      state.prototype as Prototype,
      state.setActivePrototype,
    ],
    shallow,
  )
  const [traceVars] = useRuntimeStore(
    (state) => [
      state.traceVars as any
    ],
    shallow,
  )

  const [variables, setVariables] = useState<WatchVariable[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newVariable, setNewVariable] = useState<Partial<WatchVariable>>({
    name: '',
    type: 'string',
    value: ''
  })

  // Load variables from prototype.extend.watch_vars
  useEffect(() => {
    if (prototype?.extend?.watch_vars) {
      setVariables(prototype.extend.watch_vars)
    } else {
      setVariables([])
    }
  }, [prototype?.extend?.watch_vars])

  useEffect(() => {
    if (!variables || !traceVars || Object.keys(traceVars).length === 0) return
    
    // Only update if there are actual changes to avoid infinite loops
    const hasChanges = variables.some(variable => {
      const traceValue = traceVars[variable.name]
      return traceValue !== undefined && traceValue !== variable.value
    })
    
    if (hasChanges) {
      const newVariables = variables.map(variable => ({
        ...variable,
        value: traceVars[variable.name] !== undefined ? traceVars[variable.name] : variable.value
      }))
      setVariables(newVariables)
    }
  }, [traceVars])

  const addVariable = async () => {
    if (!newVariable.name?.trim()) return

    const variable: WatchVariable = {
      id: Date.now().toString(),
      name: newVariable.name.trim(),
      type: newVariable.type || 'string',
      value: newVariable.value
    }

    const updatedVariables = [...variables, variable]
    setVariables(updatedVariables)

    try {
      // Update prototype.extend.watch_vars via API
      await updatePrototypeService(prototype.id, {
        extend: {
          ...prototype.extend,
          watch_vars: updatedVariables
        }
      })

      // Update local state
      const updatedPrototype = { ...prototype }
      if (!updatedPrototype.extend) updatedPrototype.extend = {}
      updatedPrototype.extend.watch_vars = updatedVariables
      setActivePrototype(updatedPrototype)
    } catch (error) {
      console.error('Error updating prototype:', error)
      // Revert local state on error
      setVariables(variables)
    }

    // Reset form
    setNewVariable({ name: '', type: 'string', value: '' })
    setIsAdding(false)
  }

  const updateVariable = async (id: string, updates: Partial<WatchVariable>) => {
    const updatedVariables = variables.map(v =>
      v.id === id ? { ...v, ...updates } : v
    )
    setVariables(updatedVariables)

    try {
      // Update prototype.extend.watch_vars via API
      await updatePrototypeService(prototype.id, {
        extend: {
          ...prototype.extend,
          watch_vars: updatedVariables
        }
      })

      // Update local state
      const updatedPrototype = { ...prototype }
      if (!updatedPrototype.extend) updatedPrototype.extend = {}
      updatedPrototype.extend.watch_vars = updatedVariables
      setActivePrototype(updatedPrototype)
    } catch (error) {
      console.error('Error updating prototype:', error)
      // Revert local state on error
      setVariables(variables)
    }

    setEditingId(null)
  }

  const deleteVariable = async (id: string) => {
    const updatedVariables = variables.filter(v => v.id !== id)
    setVariables(updatedVariables)

    try {
      // Update prototype.extend.watch_vars via API
      await updatePrototypeService(prototype.id, {
        extend: {
          ...prototype.extend,
          watch_vars: updatedVariables
        }
      })

      // Update local state
      const updatedPrototype = { ...prototype }
      if (!updatedPrototype.extend) updatedPrototype.extend = {}
      updatedPrototype.extend.watch_vars = updatedVariables
      setActivePrototype(updatedPrototype)
    } catch (error) {
      console.error('Error updating prototype:', error)
      // Revert local state on error
      setVariables(variables)
    }
  }



  return (
    <div className="h-full flex flex-col p-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-da-white">Variables Watch</h3>
        <DaButton
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="!text-da-white !border-da-white"
        >
          <TbPlus size={16} className="mr-1" />
          Add Variable
        </DaButton>
      </div>

      {/* Add/Edit Variable Form */}
      {(isAdding || editingId) && (
        <div className="bg-da-gray-dark p-2 rounded mb-4">
          <div className="flex items-center gap-2">
            <DaInput
              placeholder="Variable name"
              value={newVariable.name}
              onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
              className="flex-1 text-da-black"
            />
            <DaInput
              placeholder="Type (e.g. int, uint, boolean)"
              value={newVariable.type}
              onChange={(e) => setNewVariable({ ...newVariable, type: e.target.value })}
              className="text-da-black !text-xs w-20"
              style={{ minWidth: 80 }}
            />
            <DaButton
              variant="plain"
              onClick={() => {
                if (editingId) {
                  updateVariable(editingId, newVariable)
                } else {
                  addVariable()
                }
              }}
              className="!p-1 !text-da-white"
              title={editingId ? 'Update' : 'Add'}
            >
              <TbDeviceFloppy size={18} className="mr-1" />
              Save
            </DaButton>
            <DaButton
              variant="plain"
              onClick={() => {
                setIsAdding(false)
                setEditingId(null)
                setNewVariable({ name: '', type: 'string', value: '' })
              }}
              className="!p-1 !text-da-gray-light"
              title="Cancel"
            >
              {/* Use an X icon for cancel, or fallback to text if not available */}
              <TbX size={18} />
            </DaButton>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {variables.length === 0 ? (
          <div className="text-center text-da-gray-light mt-8">
            <p>No variables to display</p>
            <p className="text-sm mt-2">Add variables to start watching</p>
          </div>
        ) : (
          <div className="space-y-1">
            {variables.map((variable) => <VarItem
              key={variable.id}
              variable={variable}
              onEnter={(val: string) => {
                if (requestWriteVarValue) {
                  requestWriteVarValue({[variable.name]: val})
                }
              }}
              requestDeleteVar={(id: string) => {
                deleteVariable(id)
              }}
            />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default PrototypeVarsWatch
