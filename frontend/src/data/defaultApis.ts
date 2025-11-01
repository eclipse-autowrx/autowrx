// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Default V2C API list exported from ViewApiV2C
export { DEFAULT_V2C } from '@/components/organisms/ViewApiV2C'

// Default USP data
export const DEFAULT_USP = [
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

export const DEFAULT_USP_TREE = {
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
