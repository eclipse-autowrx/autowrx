// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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
import config from '@/configs/config'
import { toast } from 'react-toastify'

let mockData: Requirement[] = [
    {
        "id": "REQ-012",
        "title": "OTA Update Capability",
        "description": "The system shall support over-the-air (OTA) updates to ensure the software can be updated remotely. Updates shall be delivered securely with cryptographic signature verification. The update process shall be fault-tolerant with automatic rollback capability in case of failures. Updates shall be downloadable in the background and be applicable either immediately or at a user-scheduled time, with appropriate user notifications.",
        "type": "Operational Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 3,
            "relevance": 5,
            "impact": 4
        }
    },
    {
        "id": "REQ-011",
        "title": "Automotive Standard Compliance",
        "description": "The system shall comply with relevant automotive standards such as ISO 26262 for functional safety with ASIL-B rating for door control functions and ASIL-A for comfort functions. The system shall also conform to SAE J3061 for cybersecurity engineering, UN Regulation No. 155 for cybersecurity management systems, and regional type approval requirements including ECE regulations for the European market.",
        "type": "Regulatory & Homologation Requirement",
        "source": {
            "type": "external",
            "link": "https://www.iso.org/standard/68383.html"
        },
        "rating": {
            "priority": 5,
            "relevance": 3,
            "impact": 2
        }
    },
    {
        "id": "REQ-010",
        "title": "Seamless Welcome Experience",
        "description": "The welcome sequence shall execute smoothly without noticeable delays between steps. The total time from initial driver detection to completion of all welcome sequence steps shall not exceed 7 seconds. The system shall provide progress indicators for steps requiring more than 2 seconds. Transitions between welcome sequence steps shall be visually harmonious with smooth animations where applicable.",
        "type": "User Experience Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 3,
            "relevance": 4,
            "impact": 5
        }
    },
    {
        "id": "REQ-SVC-HORN-002",
        "title": "Horn Usage Time and Loudness Restriction",
        "description": "The horn activation function shall be disabled between 9:00 PM and 6:00 AM to prevent noise disturbance in city environments. Additionally, the horn loudness shall not exceed 85 dB(A) at a distance of 7 meters, in compliance with urban noise regulations.",
        "type": "Functional Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 5,
            "relevance": 4,
            "impact": 4
        }
    },
    {
        "id": "REQ-SVC-TURNLI-001",
        "title": "Turn Signal Control and Notification",
        "description": "The system shall support control and notification of turn signal status, brightness, gradient time, and stop pattern via the respective fields and methods. The system shall notify the current state and indication status of the turn signals and allow configuration of brightness and gradient time.",
        "type": "Functional Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 3,
            "relevance": 4,
            "impact": 3
        }
    },
    {
        "id": "REQ-004",
        "title": "Driver Seat Adjustment",
        "description": "The system shall adjust the driver's seat to the position stored in the cloud-based user profile within 3 seconds of authentication. Adjustments shall include at minimum: height, distance from steering wheel, backrest angle, lumbar support, and headrest position. The system shall support seat position memory for at least 5 different drivers per vehicle.",
        "type": "Functional Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 2,
            "relevance": 3,
            "impact": 3
        }
    },
    {
        "id": "REQ-SVC-ANTITHEFT-002",
        "title": "Real-Time Anti-Theft Status Update",
        "description": "The system shall update and broadcast the anti-theft status in real time whenever a change in armed state occurs.",
        "type": "Functional Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 5,
            "relevance": 5,
            "impact": 5
        }
    },
    {
        "id": "REQ-IRRELEVANT-001",
        "title": "Coffee Cup Holder Color Preference",
        "description": "The system shall allow users to select the color of the coffee cup holder, with at least three color options.",
        "type": "User Experience Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 1,
            "relevance": 1,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-002",
        "title": "Sunroof Opening Sound Customization",
        "description": "The system shall allow users to customize the sound played when the sunroof opens.",
        "type": "User Experience Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 2,
            "relevance": 1,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-003",
        "title": "Dashboard Font Style Selection",
        "description": "The system shall provide at least five different font styles for the dashboard display.",
        "type": "User Experience Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 1,
            "relevance": 2,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-004",
        "title": "Ambient Light Color Cycling",
        "description": "The system shall support automatic cycling of ambient light colors in the cabin.",
        "type": "User Experience Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 2,
            "relevance": 2,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-005",
        "title": "Windshield Wiper Melody",
        "description": "The system shall play a melody when the windshield wipers are activated.",
        "type": "Functional Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 1,
            "relevance": 1,
            "impact": 2
        }
    },
    {
        "id": "REQ-IRRELEVANT-006",
        "title": "Trunk Welcome Message",
        "description": "The system shall display a welcome message on the trunk screen when opened.",
        "type": "User Experience Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 2,
            "relevance": 1,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-007",
        "title": "Rearview Mirror Animation",
        "description": "The system shall animate the rearview mirror icon on the dashboard when adjusting the mirror.",
        "type": "User Experience Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 1,
            "relevance": 2,
            "impact": 2
        }
    },
    {
        "id": "REQ-IRRELEVANT-008",
        "title": "Seatbelt Buckle Color Option",
        "description": "The system shall allow users to choose the color of the seatbelt buckle indicator.",
        "type": "User Experience Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 2,
            "relevance": 1,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-009",
        "title": "Air Freshener Scent Selection",
        "description": "The system shall provide a menu for selecting the scent of the in-cabin air freshener.",
        "type": "User Experience Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 1,
            "relevance": 1,
            "impact": 2
        }
    },
    {
        "id": "REQ-IRRELEVANT-010",
        "title": "Horn Volume Adjustment",
        "description": "The system shall allow users to adjust the volume of the vehicle horn.",
        "type": "Functional Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 2,
            "relevance": 2,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-011",
        "title": "Sunroof Chime Customization",
        "description": "The system shall allow users to select a custom chime when the sunroof is opened.",
        "type": "User Experience Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 1,
            "relevance": 1,
            "impact": 2
        }
    },
    {
        "id": "REQ-IRRELEVANT-012",
        "title": "Dashboard Pet Mode",
        "description": "The system shall display a pet animation on the dashboard when Pet Mode is activated.",
        "type": "User Experience Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 2,
            "relevance": 1,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-013",
        "title": "Cup Holder Temperature Display",
        "description": "The system shall show the temperature of the cup holder on the infotainment screen.",
        "type": "Functional Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 1,
            "relevance": 2,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-014",
        "title": "License Plate Light Color Change",
        "description": "The system shall allow users to change the color of the license plate light.",
        "type": "User Experience Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 2,
            "relevance": 1,
            "impact": 2
        }
    },
    {
        "id": "REQ-IRRELEVANT-015",
        "title": "Animated Tire Pressure Indicator",
        "description": "The system shall animate the tire pressure icon when pressure is optimal.",
        "type": "Functional Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 1,
            "relevance": 1,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-016",
        "title": "Personalized Welcome Sound",
        "description": "The system shall play a personalized sound when the driver enters the vehicle.",
        "type": "User Experience Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 2,
            "relevance": 2,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-017",
        "title": "Animated Fuel Gauge",
        "description": "The system shall animate the fuel gauge needle when the vehicle is started.",
        "type": "Functional Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 1,
            "relevance": 1,
            "impact": 2
        }
    },
    {
        "id": "REQ-IRRELEVANT-018",
        "title": "Rear Seat Reminder Joke",
        "description": "The system shall display a random joke when reminding about rear seat passengers.",
        "type": "User Experience Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 2,
            "relevance": 1,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-019",
        "title": "Turn Signal Melody",
        "description": "The system shall play a melody instead of a click for the turn signal.",
        "type": "Functional Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 1,
            "relevance": 2,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-020",
        "title": "Customizable Odometer Font",
        "description": "The system shall allow users to change the font of the odometer display.",
        "type": "User Experience Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 2,
            "relevance": 1,
            "impact": 2
        }
    },
    {
        "id": "REQ-IRRELEVANT-021",
        "title": "Animated Window Controls",
        "description": "The system shall animate the window control icons when pressed.",
        "type": "User Experience Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 1,
            "relevance": 1,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-022",
        "title": "Heated Steering Wheel Notification",
        "description": "The system shall display a notification with an emoji when the heated steering wheel is activated.",
        "type": "Functional Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 2,
            "relevance": 2,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-023",
        "title": "Animated Door Lock Indicator",
        "description": "The system shall animate the door lock icon when the doors are locked or unlocked.",
        "type": "User Experience Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 1,
            "relevance": 1,
            "impact": 2
        }
    },
    {
        "id": "REQ-IRRELEVANT-024",
        "title": "Customizable Trunk Open Sound",
        "description": "The system shall allow users to select a custom sound when the trunk is opened.",
        "type": "User Experience Requirement",
        "source": {
            "type": "internal",
            "link": ""
        },
        "rating": {
            "priority": 2,
            "relevance": 1,
            "impact": 1
        }
    },
    {
        "id": "REQ-IRRELEVANT-025",
        "title": "Animated Headlight Indicator",
        "description": "The system shall animate the headlight icon when headlights are turned on.",
        "type": "Functional Requirement",
        "source": {
            "type": "external",
            "link": ""
        },
        "rating": {
            "priority": 1,
            "relevance": 2,
            "impact": 1
        }
    },
]

const PrototypeTabRequirement = () => {
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const { data: prototype } = useCurrentPrototype()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const {
    requirements,
    setRequirements,
    toggleScanning,
    startScanning,
    stopScanning,
    addRequirement,
    removeRequirement,
    updateRequirement,
  } = useRequirementStore()
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false)
  const [showCreateRequirementDialog, setShowCreateRequirementDialog] =
    useState(false)
  const [editingReq, setEditingReq] = useState<Requirement | null>(null)
  const [showUpdate, setShowUpdate] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  // Use existing system UI state or create a new one for requirements
  const {
    showPrototypeRequirementFullScreen,
    setShowPrototypeRequirementFullScreen,
  } = useSystemUI() || {
    showPrototypeRequirementFullScreen: false,
    setShowPrototypeRequirementFullScreen: (val: boolean) => {},
  }

  useEffect(() => {
    if (isScanning) {
      startScanning()
    } else {
      stopScanning()
    }
  }, [isScanning])

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

  const showResultOneByOne = async (items: Requirement[]) => {

    setRequirements([])
    await new Promise(resolve => setTimeout(resolve, 200))
    // setRequirements(items)
    // return

    // Create a random array of indices from 0 to items.length - 1
    const indices = Array.from({ length: items.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // console.log(indices)

    for(let i=0; i<indices.length; i++) {
      let showItems = JSON.parse(JSON.stringify(items))
      showItems = JSON.parse(JSON.stringify(showItems))
      showItems[indices[i]].isHidden = false
      showItems[indices[i]].angle = indices[i] * 2 * Math.PI
      for(let j=i; j<indices.length; j++) {
        showItems[indices[j]].isHidden = true
      }
      setRequirements(showItems)
      await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (600 - 200 + 1)) + 200))
    }

    // for(let i=0; i<items.length; i++) {
    //   let showItems = JSON.parse(JSON.stringify(items))
    //   showItems = JSON.parse(JSON.stringify(showItems))
    //   showItems[i].isHidden = false
    //   for(let j=i; j<showItems.length; j++) {
    //     showItems[j].isHidden = true
    //   }
    //   setRequirements(showItems)
    //   await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (2500 - 1000 + 1)) + 1000))
    // }
  }

  const scanRequirements = async () => {
    if (!prototype || !prototype.customer_journey) {
      toast.error('No customer journey found')
      return
    }
    setIsScanning(true)
    // Re-order mockData with random order
    if (Array.isArray(mockData)) {
      // Fisher-Yates shuffle
      for (let i = mockData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mockData[i], mockData[j]] = [mockData[j], mockData[i]];
      }
    }
    await showResultOneByOne(mockData)
    setIsScanning(false)
    return

    let scanUrl = config?.requirements?.journey_2_requirements
    if (!scanUrl) return
    setIsScanning(true)
    try {
      // The native fetch API does not support a timeout option directly.
      // To implement a timeout, use AbortController:
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5*60000); // 60 seconds timeout

      let response;
      try {
        response = await fetch(scanUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw_customer_journey: prototype?.customer_journey || '',
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
      const data = await response.json()
      console.log(data)
      if(Array.isArray(data) && data.length>0) {
        let items = data[0].output || []
        showResultOneByOne(items)
      }
    } catch (error) {
      console.error('Failed to scan requirements', error)
    } finally {
      setIsScanning(false)
    }
  }

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
                onClick={() => scanRequirements()}
                disabled={isScanning}
              >
                <TbTextScan2 className="size-4 mr-1" /> {isScanning ? 'Is scanning' : 'Run new scan'}
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
