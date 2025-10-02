// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from 'react'
import useModelStore from '@/stores/modelStore'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaText from '@/components/atoms/DaText'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import ViewApiCovesa from '@/components/organisms/ViewApiCovesa'
import { ViewApiUSP } from '@/components/organisms/ViewApiUSP'
import ViewApiV2C from '@/components/organisms/ViewApiV2C'
import { updateModelService } from '@/services/model.service'

// Default V2C API list from JSON files (Swagger-compatible structure)
const DEFAULT_V2C = [
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
      KeyIdx_u8: {
        version: '1.0.0',
        description: 'Key number',
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
      RemCmd_u8: {
        version: '1.0.0',
        description: 'Remote control command (button status)',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x00': {
            name: 'None',
            description: 'Initial value',
          },
          '0x01': {
            name: 'LockDoor',
            description:
              'Remote control locking (click and briefly press the locking button)',
          },
          '0x02': {
            name: 'Reserved',
          },
          '0x03': {
            name: 'UnlockDoor',
            description:
              'Remote control unlocking (click and briefly press the unlock button)',
          },
          '0x04': {
            name: 'OpenTailgate',
            description:
              'Open the luggage compartment (click and hold the tailgate button for 2 seconds) (associated configuration word)',
          },
          '0x05': {
            name: 'OpenAllWin',
            description:
              'One-key window lowering (click and hold the locking button for 2 seconds)',
          },
          '0x06': {
            name: 'CloseAllWin',
            description:
              'One-key window lifting (click and long-press the unlock button for 2 seconds)',
          },
          '0x07': {
            name: 'Reserved',
          },
          '0x08': {
            name: 'Reserved',
          },
          '0x09': {
            name: 'FindCar',
            description:
              'Find the car (double-click the lock button briefly within 1 second)',
          },
          '0x0A': {
            name: 'TailgatePress',
            description: 'Click and briefly press the tailgate button',
          },
          '0x0B': {
            name: 'Rpa',
            description:
              'Remote parking (Click and hold the tailgate button for 2 seconds) (Related configuration words)',
          },
        },
      },
      KeyRemCmdInfo_stru: {
        version: '1.0.0',
        description: 'Key Remote Command Information',
        category: 'Struct',
        members: {
          KeyIdx: {
            position: 0,
            name: 'KeyIdx',
            datatype: 'KeyIdx_u8',
          },
          KeyRemCmd: {
            position: 1,
            name: 'KeyRemCmd',
            datatype: 'RemCmd_u8',
          },
          RemCmdCtr: {
            position: 2,
            name: 'RemCmdCtr',
            datatype: 'RollgCtr_u8',
          },
        },
      },
    },
  },
  {
    Name: 'Vehicle.Security.AntiTheft',
    ServiceName: 'BO_Bs_AntithftMgr',
    Type: 'Basic Service',
    ServiceDescription: 'Basic anti-theft service',
    ServiceID: 'd94c21b5-3876-49f2-b1e0-8f6a7d92c35e',
    Fields: {
      ntfArmedSt: {
        RPCType: 'Field',
        name: 'ntfArmedSt',
        method_id: '0x8001',
        desc: 'Notify the anti-theft status',
        field_type: 'Notification Event',
        ref_data_type: 'ArmedSt_u8',
      },
    },
    DataTypes: {
      ArmedSt_u8: {
        version: '1.1.0',
        description: 'Anti-theft Armed Status',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x0': {
            name: 'Disarm',
            description: 'Vehicle is disarmed',
          },
          '0x1': {
            name: 'PreDisarm',
            description: 'Pre-disarm state',
          },
          '0x2': {
            name: 'PreArmed',
            description: 'Pre-armed state',
          },
          '0x3': {
            name: 'HalfArmed',
            description: 'Partially armed state',
          },
          '0x4': {
            name: 'FullArmed',
            description: 'Fully armed state',
          },
          '0x5': {
            name: 'Alrm',
            description: 'Alarm is triggered',
          },
          '0x6': {
            name: 'ArmingFaultMode',
            description: 'Arming fault detected',
          },
        },
      },
    },
  },
  {
    Name: 'Vehicle.Body.Horn',
    ServiceName: 'BO_Bs_Horn',
    Type: 'Basic Service',
    ServiceDescription: 'Horn control basic service',
    ServiceID: '18a25dfc-6e73-4b9c-80a1-f29d56e84729',
    Fields: {
      ntfAcvClient: {
        RPCType: 'Field',
        name: 'ntfAcvClient',
        method_id: '0x8001',
        desc: 'Service status (current request source)',
        field_type: 'Notification Event',
        ref_data_type: 'PrioInfo_stru',
      },
    },
    Methods: {
      hornCtrl: {
        RPCType: 'R/R Method',
        name: 'hornCtrl',
        method_id: '0x0001',
        desc: 'Horn activation control',
        inputs: [
          {
            name: 'HornCmd_u8',
            description: 'Horn command',
          },
          {
            name: 'HornMod_stru',
            description: 'Horn mode parameters',
          },
          {
            name: 'PrioInfo_stru',
            description: 'Priority information',
          },
        ],
        outputs: [
          {
            name: 'BsRtnCod_u8',
            description: 'Service return code',
          },
        ],
      },
    },
    DataTypes: {
      Prio_u8: {
        version: '1.0.0',
        description: 'Priority level',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x00': {
            name: 'HighestPriority',
            description: 'Highest priority',
          },
          '0xFF': {
            name: 'LowestPriority',
            description: 'Lowest priority (release)',
          },
        },
      },
      PrioInfo_stru: {
        version: '1.0.0',
        description: 'Priority information',
        category: 'Struct',
        members: {
          ReqId: {
            position: 0,
            name: 'ReqId',
            description: 'Request ID',
            datatype: 'ReqId_u16',
          },
          Prio: {
            position: 1,
            name: 'Prio',
            description: 'Priority',
            datatype: 'Prio_u8',
          },
        },
      },
      ReqId_u16: {
        version: '1.0.0',
        description: 'Request ID',
        category: 'Integer',
        baseDatatype: 'uint16',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 65535,
        initialValue: 0,
        invalidValue: 65535,
        unit: '-',
      },
      Dur10Ms_q10_10ms_u16: {
        version: '1.0.0',
        description: 'Time (10x milliseconds)',
        category: 'Integer',
        baseDatatype: 'uint16',
        resolution: 10,
        offset: 0,
        physicalMin: 0,
        physicalMax: 655350,
        initialValue: 0,
        invalidValue: 65535,
        unit: '10ms',
        remark: '10x milliseconds; resolution 10ms; physical range 0-655340ms',
      },
      BsRtnCod_u8: {
        version: '1.0.0',
        description: 'Enhanced service return value',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x00': {
            name: 'OK',
            description: 'Request accepted',
          },
          '0x01': {
            name: 'WAITING_HIGHER_PRIORITY_TASK',
            description: 'Waiting for higher priority task to complete',
          },
          '0x02': {
            name: 'FAIL_WORKING_CONDITION_UNFULFILLED',
            description:
              'Current mode not supported (e.g., fault, heat protection)',
          },
          '0x03': {
            name: 'FAIL_HIGHER_PRIORITY_TASK_ONGOING',
            description: 'Higher priority task is busy',
          },
          '0x04': {
            name: 'FAIL_INVALID_REQUEST',
            description:
              'Invalid request (e.g., invalid parameters, priority/ReqID mismatch)',
          },
        },
      },
      HornCmd_u8: {
        version: '1.0.0',
        description: 'Horn command',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x0': {
            name: 'Off',
            description: 'Turn horn off',
          },
          '0x1': {
            name: 'On',
            description: 'Turn horn on',
          },
        },
      },
      HornMod_stru: {
        version: '1.0.0',
        description: 'Horn mode parameters',
        category: 'Struct',
        members: {
          HornFrq: {
            position: 0,
            name: 'HornFrq',
            description: 'Horn on/off frequency',
            datatype: 'HornFrq_stru',
          },
          RepCtr: {
            position: 1,
            name: 'RepCtr',
            description: 'Horn repeat count',
            datatype: 'RepCtr_u8',
          },
        },
      },
      HornFrq_stru: {
        version: '1.1.0',
        description: 'Horn on/off frequency',
        category: 'Struct',
        members: {
          OnDur: {
            position: 0,
            name: 'OnDur',
            description: 'Duration horn is on in a cycle (in 10ms units)',
            datatype: 'Dur10Ms_q10_10ms_u16',
          },
          OffDur: {
            position: 1,
            name: 'OffDur',
            description: 'Duration horn is off in a cycle (in 10ms units)',
            datatype: 'Dur10Ms_q10_10ms_u16',
          },
        },
      },
      RepCtr_u8: {
        version: '1.0.0',
        description: 'Repeat count',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x0': {
            name: 'Infinite',
            description: 'Infinite repetitions',
          },
        },
        remark:
          '0 means infinite repetitions, other values represent the specific number of repetitions',
      },
    },
  },
  {
    Name: 'Vehicle.Body.Lights.TurnLigh',
    ServiceName: 'BO_Bs_TurnLi',
    Type: 'Basic Service',
    ServiceDescription: 'Turn Light Basic Service',
    ServiceID: '3b92f5c6-0d47-48ae-b6f1-a2c4e9d78530',
    Fields: {
      setOnBriLvl: {
        RPCType: 'Field',
        name: 'setOnBriLvl',
        method_id: '0x0002',
        desc: 'Set turn light brightness level when on',
        field_type: 'Setter',
        ref_data_type: 'LiBriLvl_u8',
      },
      setGrdtTi: {
        RPCType: 'Field',
        name: 'setGrdtTi',
        method_id: '0x0003',
        desc: 'Set turn light gradual transition time',
        field_type: 'Setter',
        ref_data_type: 'ShadeTi_u16',
      },
      setStopPat: {
        RPCType: 'Field',
        name: 'setStopPat',
        method_id: '0x0004',
        desc: 'Set soft/hard stop mode',
        field_type: 'Setter',
        ref_data_type: 'TurnLiStopPat_stru',
      },
      ntfAcvClient: {
        RPCType: 'Field',
        name: 'ntfAcvClient',
        method_id: '0x8001',
        desc: 'Service status (current request source)',
        field_type: 'Notification Event',
        ref_data_type: 'AcvClient_stru',
      },
      ntfTurnLiSt: {
        RPCType: 'Field',
        name: 'ntfTurnLiSt',
        method_id: '0x8002',
        desc: "Turn light status (summary of each side's status)",
        field_type: 'Notification Event',
        ref_data_type: 'TurnLiSt_stru',
      },
      ntfTurnLiIndcnSt: {
        RPCType: 'Field',
        name: 'ntfTurnLiIndcnSt',
        method_id: '0x8003',
        desc: 'Turn light indication status (operation type: turn signal, hazard warning, etc.)',
        field_type: 'Notification Event',
        ref_data_type: 'TurnLiIndcnSt_u8',
      },
    },
    Methods: {
      liCtrl: {
        RPCType: 'R/R Method',
        name: 'liCtrl',
        method_id: '0x0001',
        desc: 'Turn light control',
        inputs: [
          {
            name: 'TurnLiCmd_u8',
            description: 'Turn light command',
          },
          {
            name: 'TurnLiId_u16',
            description: 'Turn light ID',
          },
          {
            name: 'TurnLiFlsPat_stru',
            description: 'Turn light flash pattern',
          },
          {
            name: 'PrioInfo_stru',
            description: 'Priority information',
          },
        ],
        outputs: [
          {
            name: 'BsRtnCod_u8',
            description: 'Service return code',
          },
        ],
      },
    },
    DataTypes: {
      TurnLiSt_stru: {
        version: '1.0.0',
        description: 'Turn light status',
        category: 'Struct',
        members: {
          TurnLiLeSt: {
            position: 1,
            name: 'TurnLiLeSt',
            description: 'Left turn light status',
            datatype: 'TurnLiOnOffSt_u8',
          },
          TurnLiRiSt: {
            position: 2,
            name: 'TurnLiRiSt',
            description: 'Right turn light status',
            datatype: 'TurnLiOnOffSt_u8',
          },
        },
      },
      TurnLiOnOffSt_u8: {
        version: '1.0.0',
        description: 'Turn light operation status',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x0': {
            name: 'NotActive',
            description: 'Not active',
          },
          '0x1': {
            name: 'Off',
            description: 'Off',
          },
          '0x2': {
            name: 'On',
            description: 'On',
          },
        },
      },
      TurnLiIndcnSt_u8: {
        version: '1.0.0',
        description: 'Turn light indication status',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x0': {
            name: 'None',
            description: 'No indication',
          },
          '0x1': {
            name: 'Left',
            description: 'Left turn indication',
          },
          '0x2': {
            name: 'Right',
            description: 'Right turn indication',
          },
          '0x3': {
            name: 'LeftAndRight',
            description: 'Both left and right turn indication',
          },
          '0x4': {
            name: 'HazardWarning',
            description: 'Hazard warning indication',
          },
        },
      },
      TurnLiCmd_u8: {
        version: '1.0.0',
        description: 'Turn light control request',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x0': {
            name: 'Off',
            description: 'Turn off',
          },
          '0x1': {
            name: 'LeftTurnLight',
            description: 'Left turn light',
          },
          '0x2': {
            name: 'RightTurnLight',
            description: 'Right turn light',
          },
          '0x3': {
            name: 'LeftAndRightTurnLight',
            description: 'Both left and right turn lights',
          },
          '0x4': {
            name: 'HazardWarning',
            description: 'Hazard warning',
          },
          '0x5': {
            name: 'LiShow',
            description: 'Light show',
          },
        },
      },
      TurnLiId_u16: {
        version: '1.0.0',
        description: 'Turn light ID',
        category: 'Integer',
        baseDatatype: 'uint16',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 65535,
        initialValue: 0,
        invalidValue: 65535,
        unit: '-',
        bitfields: {
          '0': {
            name: 'LeftFront',
            description: 'Left front turn light',
          },
          '1': {
            name: 'LeftRear',
            description: 'Left rear turn light',
          },
          '2': {
            name: 'Reserved2',
            description: 'Reserved',
          },
          '3': {
            name: 'Reserved3',
            description: 'Reserved',
          },
          '4': {
            name: 'RightFront',
            description: 'Right front turn light',
          },
          '5': {
            name: 'RightRear',
            description: 'Right rear turn light',
          },
          '6': {
            name: 'Reserved6',
            description: 'Reserved',
          },
          '7': {
            name: 'Reserved7',
            description: 'Reserved',
          },
        },
      },
      Prio_u8: {
        version: '1.0.0',
        description: 'Priority level',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x00': {
            name: 'HighestPriority',
            description: 'Highest priority',
          },
          '0xFF': {
            name: 'LowestPriority',
            description: 'Lowest priority (release)',
          },
        },
      },
      TurnLiFlsPat_stru: {
        version: '1.0.0',
        description: 'Turn light flash pattern',
        category: 'Struct',
        members: {
          FlsFrq: {
            position: 0,
            name: 'FlsFrq',
            description: 'Flash frequency',
            datatype: 'FlsFrq_stru',
          },
          FlsCyc: {
            position: 1,
            name: 'FlsCyc',
            description: 'Repeat count',
            datatype: 'FlsCyc_u8',
          },
        },
      },
      FlsFrq_stru: {
        version: '1.1.0',
        description: 'Flash frequency',
        category: 'Struct',
        members: {
          OnDur: {
            position: 0,
            name: 'OnDur',
            description: 'On duration in a flash cycle (in 10ms units)',
            datatype: 'Dur10Ms_q10_10ms_u16',
          },
          OffDur: {
            position: 1,
            name: 'OffDur',
            description: 'Off duration in a flash cycle (in 10ms units)',
            datatype: 'Dur10Ms_q10_10ms_u16',
          },
        },
      },
      PrioInfo_stru: {
        version: '1.0.0',
        description: 'Priority information',
        category: 'Struct',
        members: {
          ReqId: {
            position: 0,
            name: 'ReqId',
            description: 'Request ID',
            datatype: 'ReqId_u16',
          },
          Prio: {
            position: 1,
            name: 'Prio',
            description: 'Priority',
            datatype: 'Prio_u8',
          },
        },
      },
      AcvClient_stru: {
        version: '1.0.0',
        description: 'Service status',
        category: 'Struct',
        members: {
          ReqId: {
            position: 0,
            name: 'ReqId',
            description: 'Request ID',
            datatype: 'ReqId_u16',
          },
          Prio: {
            position: 1,
            name: 'Prio',
            description: 'Priority',
            datatype: 'Prio_u8',
          },
          ReqCtr: {
            position: 2,
            name: 'ReqCtr',
            description: 'Request counter',
            datatype: 'ReqCtr_u8',
          },
        },
      },
      ReqId_u16: {
        version: '1.0.0',
        description: 'Request ID',
        category: 'Integer',
        baseDatatype: 'uint16',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 65535,
        initialValue: 0,
        invalidValue: 65535,
        unit: '-',
      },
      Dur10Ms_q10_10ms_u16: {
        version: '1.0.0',
        description: 'Time (10x milliseconds)',
        category: 'Integer',
        baseDatatype: 'uint16',
        resolution: 10,
        offset: 0,
        physicalMin: 0,
        physicalMax: 655350,
        initialValue: 0,
        invalidValue: 65535,
        unit: '10ms',
        remark: '10x milliseconds; resolution 10ms; physical range 0-655340ms',
      },
      FlsCyc_u8: {
        version: '1.0.0',
        description: 'Flash cycle count',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x0': {
            name: 'Infinite',
            description: 'Continuous flashing',
          },
        },
        remark:
          '0 means continuous flashing, values 1-100 represent specific flash counts',
      },
      TurnLiStopPat_stru: {
        version: '1.0.0',
        description: 'Turn light stop pattern',
        category: 'Struct',
        members: {
          StopPatForPhaOn: {
            position: 0,
            name: 'StopPatForPhaOn',
            description: 'Stop pattern for ON phase',
            datatype: 'IndcnStopPat_u8',
          },
          StopPatForPhaOff: {
            position: 1,
            name: 'StopPatForPhaOff',
            description: 'Stop pattern for OFF phase',
            datatype: 'IndcnStopPat_u8',
          },
        },
      },
      IndcnStopPat_u8: {
        version: '1.0.0',
        description: 'Turn light soft/hard stop mode',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x0': {
            name: 'HardStop',
            description: 'Immediate stop',
          },
          '0x1': {
            name: 'SoftStop',
            description: 'Gradual fade stop',
          },
        },
      },
      BsRtnCod_u8: {
        version: '1.0.0',
        description: 'Enhanced service return value',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x00': {
            name: 'OK',
            description: 'Request accepted',
          },
          '0x01': {
            name: 'WAITING_HIGHER_PRIORITY_TASK',
            description: 'Waiting for higher priority task to complete',
          },
          '0x02': {
            name: 'FAIL_WORKING_CONDITION_UNFULFILLED',
            description:
              'Current mode not supported (e.g., fault, heat protection)',
          },
          '0x03': {
            name: 'FAIL_HIGHER_PRIORITY_TASK_ONGOING',
            description: 'Higher priority task is busy',
          },
          '0x04': {
            name: 'FAIL_INVALID_REQUEST',
            description:
              'Invalid request (e.g., invalid parameters, priority/ReqID mismatch)',
          },
        },
      },
      ReqCtr_u8: {
        version: '1.0.0',
        description: 'Session ID',
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
      LiBriLvl_u8: {
        version: '1.0.0',
        description: 'Light brightness level',
        category: 'Integer',
        baseDatatype: 'uint8',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 255,
        initialValue: 0,
        invalidValue: 255,
        unit: '-',
        values: {
          '0x00': {
            name: 'Off',
            description: 'Off',
          },
          '0x65': {
            name: 'CurrentBrightness',
            description: 'Use current brightness as starting point',
          },
        },
        remark:
          'Values 1-100 represent brightness percentage, 0x65 means use current brightness',
      },
      ShadeTi_u16: {
        version: '1.0.0',
        description: 'Transition time',
        category: 'Integer',
        baseDatatype: 'uint16',
        resolution: 1,
        offset: 0,
        physicalMin: 0,
        physicalMax: 65535,
        initialValue: 0,
        invalidValue: 65535,
        unit: 'ms',
        values: {
          '0xFFFE': {
            name: 'DefaultTime',
            description: 'Use default transition time',
          },
        },
        remark: 'Time in milliseconds, 0xFFFE means use default time',
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
  const DEFAULT_API = 'COVESA'
  const [activeTab, setActiveTab] = useState<String>(DEFAULT_API)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const [supportApis, model, refreshModel] = useModelStore((state) => [
    state.supportApis,
    state.model,
    state.refreshModel,
  ])

  useEffect(() => {
    if (supportApis && supportApis.length > 0) {
      setActiveTab(supportApis[0]?.code || DEFAULT_API)
    }
  }, [supportApis])

  const handleAddApi = async (apiCode: string) => {
    if (!model) return
    const currentSupports = model.extend?.vehicle_api?.supports || [
      {
        label: 'COVESA',
        code: 'COVESA',
      },
    ]
    const apiData =
      apiCode === 'USP'
        ? { label: 'USP 2.0', code: 'USP' }
        : { label: apiCode, code: apiCode }
    const newSupports = [...currentSupports, apiData]
    const updatedVehicleApi = {
      ...model.extend?.vehicle_api,
      supports: newSupports,
    }
    if (apiCode === 'USP') {
      updatedVehicleApi.USP = DEFAULT_USP
      updatedVehicleApi.USP_Tree = DEFAULT_USP_TREE
    }
    if (apiCode === 'V2C') {
      updatedVehicleApi.V2C = DEFAULT_V2C
    }

    const updatedExtend = {
      ...model.extend,
      vehicle_api: updatedVehicleApi,
    }
    try {
      await updateModelService(model.id, { extend: updatedExtend })
      await refreshModel()
    } catch (error) {
      console.error('Failed to add API:', error)
    }
  }

  return (
    <div className="w-full h-full">
      {
        <div className="flex items-center justify-start py-1 pl-4 bg-da-primary-500 text-white">
          <DaText variant="small-bold" className="mr-2">
            API:{' '}
          </DaText>
          {/* <DaSelect
        wrapperClassName="mt-1 min-w-[180px] py-1"
        onValueChange={setActiveTab}
        defaultValue={DEFAULT_API}
      >
        {(supportApis &&  supportApis.length>0) ? (
          supportApis.map((api: any) => (
            <DaSelectItem key={api.code} value={api.code} className='min-w-[180px]'>
              {api.label}
            </DaSelectItem>
          ))
        ) : (
          <>
            <DaSelectItem value={DEFAULT_API} className='min-w-[180px]'>{DEFAULT_API}</DaSelectItem>
          </>
        )}
      </DaSelect> */}

          <select
            className="min-w-[120px] text-xs px-2 py-0.5 text-white bg-transparent outline-none cursor-pointer rounded border border-white"
            onChange={(e: any) => setActiveTab(e.target.value)}
          >
            {supportApis && supportApis.length > 0 ? (
              supportApis.map((api: any) => (
                <option
                  key={api.code}
                  value={api.code}
                  className="text-da-gray-medium"
                >
                  {api.label}
                </option>
              ))
            ) : (
              <option value={DEFAULT_API}>{DEFAULT_API}</option>
            )}
          </select>

          {(() => {
            const availableApis = ['USP', 'V2C'].filter(
              (code) => !supportApis.some((s) => s.code === code),
            )
            return availableApis.length > 0 ? (
              <div className="relative ml-2">
                <button
                  className="min-w-[120px] text-xs px-2 py-0.5 text-white bg-transparent outline-none cursor-pointer rounded border border-white"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  Add API
                </button>
                {isDropdownOpen && (
                  <div className="absolute mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-[120px]">
                    {availableApis.map((apiCode) => (
                      <div
                        key={apiCode}
                        className="px-2 py-1 text-black hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          handleAddApi(apiCode)
                          setIsDropdownOpen(false)
                        }}
                      >
                        Add {apiCode}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null
          })()}
        </div>
      }
      {(activeTab == 'COVESA' || !activeTab) && <ViewApiCovesa />}
      {activeTab == 'USP' && <ViewApiUSP />}
      {activeTab == 'V2C' && <ViewApiV2C />}
    </div>
  )
}

export default PageVehicleApi
