// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useModelStore from '@/stores/modelStore'
import { ViewApiUSP } from '@/components/organisms/ViewApiUSP'
import ViewApiV2C from '@/components/organisms/ViewApiV2C'
import ViewApiCovesa from '@/components/organisms/ViewApiCovesa'
import ViewCustomApiSet from '@/components/organisms/ViewCustomApiSet'
import ModelApiTabs from '@/components/molecules/ModelApiTabs'
import CustomApiSetPicker from '@/components/organisms/CustomApiSetPicker'
import { updateModelService } from '@/services/model.service'
import useCurrentModel from '@/hooks/useCurrentModel'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/molecules/toaster/use-toast'

// Default V2C API list from JSON files (Swagger-compatible structure)
const DEFAULT_V2C = [
  {
    path: '/driver/hvac/preferences',
    method: 'GET',
    summary: 'Get Driver HVAC Preferences',
    description:
      `Retrieves the driver's HVAC preferences based on the COVESA VSS standard.`,
    parameters: [
      {
        name: 'driverProfileId',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
          description: 'Unique identifier for the driver profile.',
        },
      },
    ],
    responses: {
      '200': {
        description: 'HVAC preferences successfully retrieved.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                driverProfileId: { type: 'string' },
                hvacPreferences: {
                  type: 'object',
                  properties: {
                    'Cabin.TemperatureSetpoint': {
                      type: 'integer',
                      description: 'Preferred cabin temperature in Celsius',
                    },
                    'Cabin.FanSpeed': {
                      type: 'integer',
                      description: 'Fan speed level (e.g., 0 to 5)',
                    },
                    'Cabin.AirCirculation': {
                      type: 'boolean',
                      description: 'Air recirculation on/off',
                    },
                    'Cabin.AirConditioning': {
                      type: 'boolean',
                      description: 'AC on/off',
                    },
                    'Cabin.SeatHeater.Driver': {
                      type: 'integer',
                      description: 'Seat heater level (0 to max)',
                    },
                    'Cabin.SteeringWheelHeater': {
                      type: 'boolean',
                      description: 'Steering wheel heater on/off',
                    },
                  },
                },
              },
            },
            example: {
              driverProfileId: 'DP12345',
              hvacPreferences: {
                'Cabin.TemperatureSetpoint': 22,
                'Cabin.FanSpeed': 3,
                'Cabin.AirCirculation': true,
                'Cabin.AirConditioning': true,
                'Cabin.SeatHeater.Driver': 2,
                'Cabin.SteeringWheelHeater': true,
              },
            },
          },
        },
      },
      '400': { description: 'Invalid query parameters.' },
      '404': { description: 'Driver profile not found.' },
      '500': { description: 'Unexpected server issue.' },
    },
    server:
      'https://central.eu-fr.axway.com/apimocks/523872032437473/driverhvacpreferences',
  },
  {
    path: '/driver/mirror/preferences',
    method: 'GET',
    summary: 'Get Driver Mirror Preferences',
    description:
      `Retrieves the driver's mirror preferences based on the COVESA VSS standard.`,
    parameters: [
      {
        name: 'driverProfileId',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
          description: 'Unique identifier for the driver profile.',
        },
      },
    ],
    responses: {
      '200': {
        description: 'Mirror preferences successfully retrieved.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                driverProfileId: { type: 'string' },
                mirrorPreferences: {
                  type: 'object',
                  properties: {
                    DriverSide: {
                      type: 'object',
                      properties: {
                        Pan: {
                          type: 'integer',
                          description: 'Left-right adjustment',
                        },
                        Tilt: {
                          type: 'integer',
                          description: 'Up-down adjustment',
                        },
                      },
                    },
                    PassengerSide: {
                      type: 'object',
                      properties: {
                        Pan: {
                          type: 'integer',
                          description: 'Left-right adjustment',
                        },
                        Tilt: {
                          type: 'integer',
                          description: 'Up-down adjustment',
                        },
                      },
                    },
                  },
                },
              },
            },
            example: {
              driverProfileId: 'DP12345',
              mirrorPreferences: {
                DriverSide: { Pan: 5, Tilt: -2 },
                PassengerSide: { Pan: 7, Tilt: 0 },
              },
            },
          },
        },
      },
      '400': { description: 'Invalid query parameters.' },
      '404': { description: 'Driver profile not found.' },
      '500': { description: 'Unexpected server issue.' },
    },
    server:
      'https://central.eu-fr.axway.com/apimocks/523872032437473/drivermirrorpreferences',
  },
  {
    path: '/driver/preferences',
    method: 'GET',
    summary: 'Get Driver Preferences',
    description: 'Retrieves the general preferences associated with a driver.',
    parameters: [
      {
        name: 'vehicleId',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
          description: 'Unique identifier for the vehicle.',
        },
      },
      {
        name: 'driverProfileId',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
          description: 'Unique identifier for the driver profile.',
        },
      },
    ],
    responses: {
      '200': {
        description: 'Driver preferences successfully retrieved.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                driverProfileId: { type: 'string' },
                preferences: {
                  type: 'object',
                  properties: {
                    language: { type: 'string' },
                    temperatureUnit: { type: 'string' },
                    distanceUnit: { type: 'string' },
                    theme: { type: 'string' },
                    audioSettings: {
                      type: 'object',
                      properties: {
                        volume: { type: 'integer', format: 'int32' },
                        equalizer: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
            example: {
              driverProfileId: 'DP12345',
              preferences: {
                language: 'en-US',
                temperatureUnit: 'Celsius',
                distanceUnit: 'Kilometers',
                theme: 'Dark',
                audioSettings: { volume: 75, equalizer: 'Rock' },
              },
            },
          },
        },
      },
      '400': { description: 'Invalid query parameters.' },
      '404': { description: 'Driver profile not found.' },
      '500': { description: 'Unexpected server issue.' },
    },
    server:
      'https://central.eu-fr.axway.com/apimocks/523872032437473/driverpreferences',
  },
  {
    path: '/driver/seating/preferences',
    method: 'GET',
    summary: 'Get Driver Seating Preferences',
    description:
      `Retrieves the driver's seating preferences based on the COVESA VSS standard.`,
    parameters: [
      {
        name: 'driverProfileId',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
          description: 'Unique identifier for the driver profile.',
        },
      },
    ],
    responses: {
      '200': {
        description: 'Seating preferences successfully retrieved.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                driverProfileId: { type: 'string' },
                seatingPreferences: {
                  type: 'object',
                  properties: {
                    'Backrest.Recline': { type: 'integer' },
                    'Backrest.Lumbar.Height': { type: 'integer' },
                    'Backrest.Lumbar.Inflation': { type: 'integer' },
                    'Cushion.Length': { type: 'integer' },
                    'Cushion.Tilt': { type: 'integer' },
                    'Headrest.Height': { type: 'integer' },
                  },
                },
              },
            },
            example: {
              driverProfileId: 'DP12345',
              seatingPreferences: {
                'Backrest.Recline': 25,
                'Backrest.Lumbar.Height': 3,
                'Backrest.Lumbar.Inflation': 5,
                'Cushion.Length': 50,
                'Cushion.Tilt': 15,
                'Headrest.Height': 10,
              },
            },
          },
        },
      },
      '400': { description: 'Invalid query parameters.' },
      '404': { description: 'Driver profile not found.' },
      '500': { description: 'Unexpected server issue.' },
    },
    server:
      'https://central.eu-fr.axway.com/apimocks/523872032437473/driverseatingpreferences',
  },
  {
    path: '/vehicle/access_log',
    method: 'POST',
    summary: 'Sends access logs from the vehicle to the cloud.',
    description: 'Sends access logs from the vehicle to the cloud.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              vehicleId: {
                type: 'string',
                description: 'Unique identifier for the vehicle.',
              },
              logType: {
                type: 'string',
                description: 'Type of log entry (e.g., "INFO", "ERROR").',
                nullable: true,
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Time of the access request in ISO 8601 format.',
              },
              message: {
                type: 'string',
                description: 'Log message detailing the event.',
              },
            },
            required: ['vehicleId', 'timestamp', 'message'],
          },
        },
      },
    },
    responses: {
      '201': {
        description: 'Access log successfully stored.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Access log successfully stored.',
                },
                logId: { type: 'string', example: 'LOG12345' },
              },
            },
          },
        },
      },
      '400': { description: 'Invalid request body.' },
      '500': { description: 'Unexpected server issue.' },
    },
    server:
      'https://central.eu-fr.axway.com/apimocks/523872032437473/vehicle-access-permissions-log',
  },
  {
    path: '/vehicle/access/check',
    method: 'POST',
    summary: 'Check Vehicle Access Permissions',
    description:
      'Retrieves vehicle access permissions from the cloud before activating the Passenger Welcome Sequence.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              vehicleId: {
                type: 'string',
                description: 'Unique identifier for the vehicle.',
              },
              keyFobId: {
                type: 'string',
                description: 'ID of the detected key fob.',
              },
              requestTimestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Time of the access request in ISO 8601 format.',
              },
            },
            required: ['vehicleId', 'requestTimestamp'],
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Access granted and permissions retrieved.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                accessGranted: { type: 'boolean' },
                driverName: { type: 'string' },
                driverProfileId: { type: 'string' },
                vehicleAccessLevel: { type: 'string' },
                permissions: {
                  type: 'object',
                  properties: {
                    startEngine: { type: 'boolean' },
                    unlockDoors: { type: 'boolean' },
                    personalizeSettings: { type: 'boolean' },
                  },
                },
              },
            },
            example: {
              accessGranted: true,
              driverName: 'John Doe',
              driverProfileId: 'DP12345',
              vehicleAccessLevel: 'Full',
              permissions: {
                startEngine: true,
                unlockDoors: true,
                personalizeSettings: true,
              },
            },
          },
        },
      },
      '400': { description: 'Invalid request parameters.' },
      '403': { description: 'Access denied due to insufficient permissions.' },
      '500': { description: 'Unexpected server issue.' },
    },
    server:
      'https://central.eu-fr.axway.com/apimocks/523872032437473/vehicleaccesspermissions',
  },
  {
    path: '/vehicle/access/history',
    method: 'GET',
    summary: 'Get Vehicle Access History',
    description:
      'Retrieves historical vehicle access records for auditing purposes.',
    parameters: [
      {
        name: 'vehicleId',
        in: 'query',
        required: true,
        schema: { type: 'string', description: 'Unique ID of the vehicle.' },
      },
      {
        name: 'from',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'date-time',
          description:
            'Start date of the access log retrieval in ISO 8601 format.',
        },
      },
      {
        name: 'to',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'date-time',
          description:
            'End date of the access log retrieval in ISO 8601 format.',
        },
      },
    ],
    responses: {
      '200': {
        description: 'Access records successfully retrieved.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  accessType: { type: 'string' },
                  keyFobId: { type: 'string' },
                },
              },
            },
            example: [
              {
                timestamp: '2024-12-01T08:30:00Z',
                accessType: 'Unlock',
                keyFobId: 'K12345',
              },
              {
                timestamp: '2024-12-01T08:35:00Z',
                accessType: 'Engine Start',
                keyFobId: 'K12345',
              },
            ],
          },
        },
      },
      '400': { description: 'Invalid query parameters.' },
      '404': {
        description:
          'No records found for the specified vehicle and date range.',
      },
    },
    server:
      'https://central.eu-fr.axway.com/apimocks/523872032437473/vehicleaccesspermissions',
  },
]

const DEFAULT_USP = [
  {
    Name: 'Vehicle.Body.Lights.TurnLight',
    ServiceName: 'BO_Atm_FobKey',
    Type: 'Atomic Service',
    ServiceDescription: 'Radio frequency key',
    ServiceID: '7e8f9b2a-c531-4d06-9e84-75c13f62d0a8',
    Fields: {
      ntfKeyRemCmd: {
        RPCType: 'Field',
        name: 'ntfKeyRemCmd',
        method_id: '0x8001',
        desc: 'Notification key remote control command',
        field_type: 'Notification Event',
        ref_data_type: 'KeyRemCmdInfo_stru',
      },
    },
    DataTypes: {
      RollgCtr_u8: {
        version: '1.0.0',
        description: 'Rolling count',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
      },
    },
  },
]

const DEFAULT_USP_TREE = {
  Vehicle: {
    description: 'Vehicle',
    type: 'branch',
    children: {
      Access: {
        type: 'branch',
        children: {
          KeyFob: {
            apiName: 'Vehicle.Access.KeyFob',
            unit: '',
            type: 'actuator',
            datatype: 'boolean',
            description: 'Key Fob',
            id: '684bcec6ae74e6bafdee999d',
            name: 'Vehicle.Access.KeyFob',
          },
        },
        name: 'Vehicle.Access',
        id: '046c6bfc4be1c2dcc7e5f1cd',
        description: 'nan',
      },
      Body: {
        type: 'branch',
        children: {
          Horn: {
            apiName: 'Vehicle.Body.Horn',
            unit: '',
            type: 'actuator',
            datatype: 'boolean',
            description: 'Horn',
            id: '684bce84ae74e6bafdee98b8',
            name: 'Vehicle.Body.Horn',
          },
          Lights: {
            type: 'branch',
            children: {
              TurnLight: {
                apiName: 'Vehicle.Body.Lights.TurnLight',
                unit: '',
                type: 'actuator',
                datatype: 'boolean',
                description: 'Turn Light',
                id: '684bcef8ae74e6bafdee9a18',
                name: 'Vehicle.Body.Lights.TurnLight',
              },
            },
            name: 'Vehicle.Body.Lights',
            id: '8ab4c0ac9d416dbc7f5b3ba3',
            description: 'nan',
          },
        },
        name: 'Vehicle.Body',
        id: '9ffd52663d911c6831504eea',
        description: 'nan',
      },
      Security: {
        type: 'branch',
        children: {
          AntiTheft: {
            apiName: 'Vehicle.Security.AntiTheft',
            unit: '',
            type: 'actuator',
            datatype: 'boolean',
            description: 'Anti Theft',
            id: '684bceb4ae74e6bafdee996b',
            name: 'Vehicle.Security.AntiTheft',
          },
        },
        name: 'Vehicle.Security',
        id: '8f04352b370dedee1929e639',
        description: 'nan',
      },
    },
    name: 'Vehicle',
    id: 'f9d965712ac759b0d8f2b5a3',
  },
}

const PageVehicleApi = () => {
  const { model_id, instance_id, api } = useParams<{ model_id: string; instance_id?: string; api?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const { data: model, refetch: refetchModel } = useCurrentModel()
  const [hasWritePermission] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model_id])
  const [refreshModel, activeModelApis] = useModelStore((state) => [state.refreshModel, state.activeModelApis])
  
  // Get COVESA API count
  const covesaApiCount = activeModelApis?.length || 0

  // Determine active tab based on route
  // If instance_id is 'covesa' or not present (and api param exists for COVESA), show COVESA tab
  // Otherwise, show plugin instance tab
  const isCovesaTab = !instance_id || instance_id === 'covesa'

  // Get custom_api_sets from model and normalize to strings
  const customApiSetIds = (model?.custom_api_sets || []).map((id: any) => {
    if (typeof id === 'string') return id
    if (id && typeof id === 'object' && 'toString' in id) return id.toString()
    return String(id)
  }).filter((id: any): id is string => !!id && typeof id === 'string')
  
  // Filter out 'covesa' from set IDs if it somehow got added
  const validSetIds = customApiSetIds.filter(id => id !== 'covesa')

  const handleAddInstance = async (instanceId: string) => {
    if (!model) return

    try {
      // Add set to model.custom_api_sets
      const currentSets = validSetIds || []
      if (currentSets.includes(instanceId)) {
        toast({
          title: 'Already added',
          description: 'This API set is already added to the model',
          variant: 'destructive',
        })
        return
      }

      // Ensure all IDs are strings before saving
      const updatedSets = [...currentSets, instanceId].map((id: any) => {
        if (typeof id === 'string') return id
        // Check if id has toString method (handling potential object types)
        if (id && typeof id === 'object' && 'toString' in id && typeof id.toString === 'function') return id.toString()
        return String(id)
      }).filter((id): id is string => !!id && typeof id === 'string')
      
      await updateModelService(model.id, {
        custom_api_sets: updatedSets,
      })

      // Refresh model data
      await Promise.all([refetchModel(), refreshModel()])
      queryClient.invalidateQueries({ queryKey: ['model', model_id] })

      // Navigate to the new tab
      navigate(`/model/${model_id}/api/${instanceId}`)

      toast({
        title: 'Added',
        description: 'API set added successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Add failed',
        description: error?.response?.data?.message || error?.message || 'Failed to add instance',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Tab Bar */}
      <div className="flex min-h-[52px] border-b border-muted-foreground/50 bg-background shrink-0">
        <div className="flex w-fit">
          <ModelApiTabs
            customApiSetIds={validSetIds}
            onAddInstance={() => setIsPickerOpen(true)}
            isModelOwner={hasWritePermission}
            covesaApiCount={covesaApiCount}
          />
        </div>
        <div className="grow"></div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isCovesaTab ? (
          <ViewApiCovesa />
        ) : instance_id ? (
          <ViewCustomApiSet key={instance_id} instanceId={instance_id} />
        ) : (
          <ViewApiCovesa />
        )}
      </div>

      {/* Instance Picker Dialog */}
      {hasWritePermission && (
        <CustomApiSetPicker
          open={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={handleAddInstance}
          excludeIds={validSetIds}
        />
      )}
    </div>
  )
}

export default PageVehicleApi
