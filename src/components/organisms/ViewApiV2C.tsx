// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState } from 'react'
import DaText from '@/components/atoms/DaText'
import { DaInput } from '@/components/atoms/DaInput'
import { GoDotFill } from 'react-icons/go'
import { TbList, TbSearch } from 'react-icons/tb'

// Default V2C API list (Swagger-compatible structure)
export const DEFAULT_V2C = [
  {
    path: '/driver/hvac/preferences',
    method: 'GET',
    summary: 'Get Driver HVAC Preferences',
    description:
      'Retrieves the driver’s HVAC preferences based on the COVESA VSS standard.',
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
    info_url: 'https://digitalauto.marketplace.eu.axway.com/productDetails/8a2d85d6944cd41601944f4c1ea93c80/resources'
  },
  {
    path: '/driver/mirror/preferences',
    method: 'GET',
    summary: 'Get Driver Mirror Preferences',
    description:
      'Retrieves the driver’s mirror preferences based on the COVESA VSS standard.',
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
    info_url: 'https://digitalauto.marketplace.eu.axway.com/productDetails/8a2d92de944cd40d01944f4c53bb3ec7/overview'
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
    info_url: 'https://digitalauto.marketplace.eu.axway.com/productDetails/8a2d83ca944cd30301944f4d09b54427/overview'
  },
  {
    path: '/driver/seating/preferences',
    method: 'GET',
    summary: 'Get Driver Seating Preferences',
    description:
      'Retrieves the driver’s seating preferences based on the COVESA VSS standard.',
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
    info_url: 'https://digitalauto.marketplace.eu.axway.com/productDetails/8a2d92de944cd40d01944f4c89a93eec/overview'
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
    info_url: 'https://digitalauto.marketplace.eu.axway.com/productDetails/8a2d92de944cd40d01944f4cd3253f32/overview'
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
    info_url: 'https://digitalauto.marketplace.eu.axway.com/productDetails/8a2d92de944cd40d01944f4cd3253f32/overview'
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
    info_url: 'https://digitalauto.marketplace.eu.axway.com/productDetails/8a2d92de944cd40d01944f4cd3253f32/resources'
  },
]

interface V2CApiListProps {
  apis: any[]
  onApiSelected: (api: any) => void
  activeApi: any,
  hideSearch?: boolean
}

const V2CApiListItem = ({
  api,
  onClick,
  isSelected,
}: {
  api: any
  onClick: () => void
  isSelected: boolean
}) => {
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'text-green-600 bg-green-100'
      case 'POST':
        return 'text-blue-600 bg-blue-100'
      case 'PUT':
        return 'text-orange-600 bg-orange-100'
      case 'DELETE':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div
      className={`w-full border-b border-da-gray-light justify-between py-2 px-2 cursor-pointer hover:bg-da-primary-100 items-center ${isSelected ? 'bg-da-primary-100' : ''}`}
      onClick={onClick}
    >
      <div className="flex flex-1 truncate items-center">
        <span
          className={`text-xs font-bold px-2 py-1 rounded mr-2 ${getMethodColor(api.method)}`}
        >
          {api.method}
        </span>
        <div className="grow truncate">
          <div
            className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'} truncate`}
          >
            {api.path}
          </div>
          <div className="text-xs text-da-gray-medium truncate">
            {api.summary}
          </div>
        </div>

        { api.info_url && <div>
          <a href={api.info_url} target="_blank">
            <img className='w-16 h-8 object-contain' alt='axway' src='https://www.axway.com/themes/custom/axway2020/img/axway-logo-dark-gray.svg'/>
          </a>
        </div> }
      </div>
    </div>
  )
}

const V2CApiList = ({ apis, onApiSelected, activeApi, hideSearch }: V2CApiListProps) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredApis = apis.filter(
    (api) =>
      api.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.summary.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="w-full h-full flex flex-col">
      {/* <div className='fixed bottom-4 right-24'>
        <a href='https://www.axway.com' target="_blank">
          <img className='w-24 object-contain' alt='axway' src='https://www.axway.com/themes/custom/axway2020/img/axway-logo-dark-gray.svg'/>
        </a>
      </div> */}

      { !hideSearch && <div className="p-2 border-b">
        <DaInput
          placeholder="Search APIs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>}
      <div className="flex-1 overflow-auto">
        {filteredApis.map((api, index) => (
          <V2CApiListItem
            key={index}
            api={api}
            onClick={() => onApiSelected(api)}
            isSelected={
              activeApi?.path === api.path && activeApi?.method === api.method
            }
          />
        ))}
      </div>
    </div>
  )
}

const ApiDetail = ({ api }: { api: any }) => {
  if (!api)
    return (
      <div className="w-full h-full flex items-center justify-center text-da-gray-medium">
        Select an API to view details
      </div>
    )

  return (
    <div className="w-full h-full overflow-auto p-4">

      <div className="mb-4">

        { api.path && <div className="flex items-center mb-2">
          <span
            className={`text-sm font-bold px-2 py-1 rounded mr-2 ${
              api.method === 'GET'
                ? 'text-green-600 bg-green-100'
                : api.method === 'POST'
                  ? 'text-blue-600 bg-blue-100'
                  : api.method === 'PUT'
                    ? 'text-orange-600 bg-orange-100'
                    : 'text-gray-600 bg-gray-100'
            }`}
          >
            {api.method}
          </span>
          <DaText variant="title" className="text-lg">
            {api.path}
          </DaText>
        </div> }

        <DaText variant="small" className="text-da-gray-medium mb-4">
          {api.description}
        </DaText>

        {api.server && (
          <div className="mb-1">
            <DaText variant="sub-title" className="mr-2">
              Server:
            </DaText>
            <div className="overflow-auto text-xs text-blue-600">
              {api.server}
            </div>
          </div>
        )}
      </div>

      {api.parameters && api.parameters.length > 0 && (
        <div className="mb-4">
          <DaText variant="sub-title" className="mb-2">
            Parameters
          </DaText>
          <div className="space-y-2">
            {api.parameters.map((param: any, index: number) => (
              <div key={index} className="border rounded p-2">
                <div className="flex items-center">
                  <DaText variant="small-bold" className="mr-2">
                    {param.name}
                  </DaText>
                  <span
                    className={`text-xs px-1 py-0.5 rounded ${param.required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {param.required ? 'Required' : 'Optional'}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-600 px-1 py-0.5 rounded ml-1">
                    {param.in}
                  </span>
                </div>
                <DaText variant="small" className="text-da-gray-medium mt-1">
                  {param.schema?.description || param.description}
                </DaText>
              </div>
            ))}
          </div>
        </div>
      )}

      {api.requestBody && (
        <div className="mb-4">
          <DaText variant="sub-title" className="mb-2">
            Request Body
          </DaText>
          <div className="border rounded p-2">
            <DaText variant="small" className="text-da-gray-medium">
              Content-Type: application/json
            </DaText>
            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(
                api.requestBody.content['application/json'].schema,
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      )}

      { api.responses && <div className="mb-4">
        <DaText variant="sub-title" className="mb-2">
          Responses
        </DaText>
        <div className="space-y-2">
          {Object.entries(api.responses).map(
            ([code, response]: [string, any]) => (
              <div key={code} className="border rounded p-2">
                <div className="flex items-center mb-1">
                  <span
                    className={`text-sm font-bold px-2 py-1 rounded mr-2 ${
                      code.startsWith('2')
                        ? 'text-green-600 bg-green-100'
                        : code.startsWith('4')
                          ? 'text-orange-600 bg-orange-100'
                          : 'text-red-600 bg-red-100'
                    }`}
                  >
                    {code}
                  </span>
                  <DaText variant="small-bold">{response.description}</DaText>
                </div>
                {response.content && response.content['application/json'] && (
                  <div className="mt-2">
                    <DaText
                      variant="small"
                      className="text-da-gray-medium mb-1"
                    >
                      Response Schema:
                    </DaText>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                      {JSON.stringify(
                        response.content['application/json'].schema,
                        null,
                        2,
                      )}
                    </pre>
                    {response.content['application/json'].example && (
                      <>
                        <DaText
                          variant="small"
                          className="text-da-gray-medium mb-1 mt-2"
                        >
                          Example:
                        </DaText>
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                          {JSON.stringify(
                            response.content['application/json'].example,
                            null,
                            2,
                          )}
                        </pre>
                      </>
                    )}
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      </div> }
    </div>
  )
}

const ViewApiV2C = () => {
  const [activeApi, setActiveApi] = useState<any>(null)

  return (
    <div className="bg-white rounded-md h-full w-full pb-8 flex flex-col">
      <div className="grow w-full h-full flex overflow-auto ">
        <div className="flex-1 flex w-full h-full overflow-auto">
          <V2CApiList
            apis={DEFAULT_V2C}
            activeApi={activeApi}
            onApiSelected={setActiveApi}
          />
        </div>
        <div className="flex-1 flex w-full h-full overflow-auto">
          <ApiDetail api={activeApi} />
        </div>
      </div>
    </div>
  )
}

export default ViewApiV2C
export { V2CApiList, ApiDetail }
