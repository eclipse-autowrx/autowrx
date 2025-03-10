import { InventoryItem } from '@/types/inventory.type'

export const roles = [
  {
    name: 'SDV Feature Owner',
    image:
      'https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/Picture1.jpg',
    description:
      'Responsible for defining and managing the feature set of Software-Defined Vehicles (SDV), ensuring alignment with business and technical goals.',
  },
  {
    name: 'SDV Requirements Engineer',
    image:
      'https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/Picture2.jpg',
    description:
      'Gathers, analyzes, and defines system and software requirements for SDV components, ensuring compliance with industry standards.',
  },
  {
    name: 'SDV System Architect',
    image:
      'https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/Picture4.jpg',
    description:
      'Designs the architecture of SDV software and systems, integrating components such as compute nodes, networks, and middleware services.',
  },
  {
    name: 'SDV Staging Expert',
    image:
      'https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/Picture5.jpg',
    description:
      'Manages the staging and deployment lifecycle of SDV software, ensuring smooth integration and compatibility across different stages.',
  },
  {
    name: 'SDV Developer',
    image:
      'https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/developer.png', // Placeholder URL
    description:
      'Develops and implements software components for SDVs, working on embedded, middleware, and cloud-based services.',
  },
  {
    name: 'SDV Test Manager',
    image:
      'https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/test%20manager.png', // Placeholder URL
    description:
      'Leads testing efforts for SDV software, ensuring reliability, security, and compliance through structured test plans and automated testing.',
  },
  {
    name: 'SDV Homologation Expert',
    image:
      'https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/homologations.png', // Placeholder URL
    description:
      'Ensures SDV compliance with regulatory standards and homologation requirements for different markets and regions.',
  },
  {
    name: 'Security Engineer',
    image:
      'https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/security.png', // Placeholder URL
    description:
      'Implements cybersecurity measures in SDV software and networks, protecting against vulnerabilities and ensuring secure data communication.',
  },
  {
    name: 'OTA Deployment Manager',
    image:
      'https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/OTA%20Engineer.png', // Placeholder URL
    description:
      'Manages Over-the-Air (OTA) software updates for SDVs, ensuring smooth and secure remote deployment of new software features and patches.',
  },
]

export const types = [
  {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      createdBy: { type: 'string' },
    },
    required: ['createdAt', 'updatedAt', 'createdBy'],
    $id: 'base_object',
    title: 'Base Object',
    description: 'Common fields reused by all objects.',
  },
  {
    allOf: [
      { $ref: 'base_object' },
      {
        type: 'object',
        properties: {},
      },
    ],
    $id: 'vehicle_model',
    title: 'Vehicle Model',
    description: 'Represents the top-level vehicle model container.',
  },
  {
    allOf: [
      { $ref: 'base_object' },
      {
        type: 'object',
        properties: {
          version: { type: 'string' },
        },
      },
    ],
    $id: 'artefact',
    title: 'Artefact',
    description: 'Generic base for all higher-level artefacts.',
  },
  {
    allOf: [
      { $ref: 'artefact' },
      {
        type: 'object',
        properties: {
          toolType: {
            type: 'string',
            enum: ['Simulation', 'Testing', 'Monitoring', 'Debugging', 'Other'],
          },
          vendor: { type: 'string' },
        },
      },
    ],
    $id: 'tool_artefact',
    title: 'Tool Artefact',
    description:
      'An artefact representing a tool (e.g., simulation or testing tool).',
  },
  {
    allOf: [
      { $ref: 'artefact' },
      {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            enum: [
              'Powertrain',
              'Connectivity',
              'ADAS',
              'Infotainment',
              'Other',
            ],
          },
        },
      },
    ],
    $id: 'sdv_system_artefact',
    title: 'SDV System Artefact',
    description: 'Base class for all System-level SDV artefacts.',
  },
  {
    allOf: [
      { $ref: 'artefact' },
      {
        type: 'object',
        properties: {
          engineeringFocus: {
            type: 'string',
            enum: ['Requirements', 'Testing', 'Simulation', 'Design', 'Other'],
          },
          referenceLinks: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    ],
    $id: 'sdv_engineering_artefact',
    title: 'SDV Engineering Artefact',
    description:
      'Base class for engineering-related artefacts (e.g., test plans, requirements).',
  },
  {
    allOf: [
      { $ref: 'sdv_system_artefact' },
      {
        type: 'object',
        properties: {
          systemType: {
            type: 'string',
            enum: ['On-Board', 'Off-Board'],
          },
          manufacturer: { type: 'string' },
          model: { type: 'string' },
        },
        required: ['systemType'],
      },
    ],
    $id: 'system',
    title: 'System',
    description: 'Represents a top-level system in an SDV architecture.',
  },
  {
    allOf: [
      { $ref: 'sdv_system_artefact' },
      {
        type: 'object',
        properties: {
          subSystemType: {
            type: 'string',
            enum: ['PowerDistribution', 'Chassis', 'HMI', 'Other'],
          },
          powerConsumption: { type: 'number', unit: 'W' },
        },
      },
    ],
    $id: 'sub_system',
    title: 'Sub-System',
    description: 'A subsystem that is part of a larger SDV system.',
  },
  {
    allOf: [
      { $ref: 'sdv_system_artefact' },
      {
        type: 'object',
        properties: {
          networkType: {
            type: 'string',
            enum: ['CAN', 'LIN', 'Ethernet', 'FlexRay', 'Other'],
          },
          bandwidth: { type: 'number', unit: 'Mbps' },
        },
        required: ['networkType'],
      },
    ],
    $id: 'network',
    title: 'Network',
    description: 'Represents an in-vehicle network or communication bus.',
  },
  {
    allOf: [
      { $ref: 'sdv_system_artefact' },
      {
        type: 'object',
        properties: {
          nodeType: {
            type: 'string',
            enum: ['ECU', 'Server', 'Gateway', 'Processor', 'Other'],
          },
          cpuArchitecture: {
            type: 'string',
            enum: ['ARM', 'x86', 'RISC-V', 'Other'],
          },
          ramSize: { type: 'number', unit: 'GB' },
          storageSize: { type: 'number', unit: 'GB' },
        },
      },
    ],
    $id: 'compute_node',
    title: 'Compute Node',
    description: 'Represents a computing element in the SDV architecture.',
  },
  {
    allOf: [
      { $ref: 'sdv_system_artefact' },
      {
        type: 'object',
        properties: {
          swType: {
            type: 'string',
            enum: ['OS', 'Middleware', 'Hypervisor', 'Container', 'Other'],
          },
          version: { type: 'string' },
          vendor: { type: 'string' },
        },
      },
    ],
    $id: 'sw_stack_item',
    title: 'SW Stack Item',
    description: 'Software element in the stack (OS, middleware, etc.).',
  },
  {
    allOf: [
      { $ref: 'sdv_system_artefact' },
      {
        type: 'object',
        properties: {
          componentType: {
            type: 'string',
            enum: [
              'AppLogic',
              'AI-Inference',
              'StateEngine',
              'Simulation',
              'Other',
            ],
          },
          framework: { type: 'string' },
          dependencies: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    ],
    $id: 'asw_component',
    title: 'ASW Component',
    description: 'Application software component in the SDV system.',
  },
  {
    allOf: [
      { $ref: 'sdv_system_artefact' },
      {
        type: 'object',
        properties: {
          serviceInterface: { type: 'string' },
          functionality: { type: 'string' },
        },
      },
    ],
    $id: 'asw_service',
    title: 'ASW Service',
    description:
      'Service interface provided by application software components.',
  },
  {
    allOf: [
      { $ref: 'sdv_system_artefact' },
      {
        type: 'object',
        properties: {
          hazard: { type: 'string' },
          riskLevel: {
            type: 'string',
            enum: ['Low', 'Medium', 'High', 'Critical'],
          },
          mitigationPlan: { type: 'string' },
        },
      },
    ],
    $id: 'hara',
    title: 'HARA',
    description: 'Hazard Analysis and Risk Assessment.',
  },
  {
    allOf: [
      { $ref: 'sdv_system_artefact' },
      {
        type: 'object',
        properties: {
          isoCode: { type: 'string' },
          region: { type: 'string' },
        },
      },
    ],
    $id: 'country',
    title: 'Country',
    description:
      'Represents a country or region (e.g., for regulatory purposes).',
  },
  {
    allOf: [
      { $ref: 'sdv_system_artefact' },
      {
        type: 'object',
        properties: {
          regulationId: { type: 'string' },
          authority: { type: 'string' },
        },
      },
    ],
    $id: 'regulation',
    title: 'Regulation',
    description: 'Legal or industry regulation relevant to the SDV system.',
  },
  {
    allOf: [
      { $ref: 'sdv_system_artefact' },
      {
        type: 'object',
        properties: {
          rigConfiguration: { type: 'string' },
          hardwareInLoop: { type: 'boolean' },
        },
      },
    ],
    $id: 'hil',
    title: 'HIL',
    description: 'Hardware-in-the-loop setup or configuration.',
  },
  {
    allOf: [
      { $ref: 'sdv_engineering_artefact' },
      {
        type: 'object',
        properties: {
          objective: { type: 'string' },
          scope: { type: 'string' },
          criteria: { type: 'string' },
        },
        required: ['name', 'objective'],
      },
    ],
    $id: 'test_plan',
    title: 'Test Plan',
    description:
      'Plan describing test objectives, scope, and success criteria.',
  },
  {
    allOf: [
      { $ref: 'sdv_engineering_artefact' },
      {
        type: 'object',
        properties: {
          groupScope: { type: 'string' },
          relatedTo: { type: 'string' },
        },
      },
    ],
    $id: 'requirements_group',
    title: 'Requirements Group',
    description: 'A logical grouping of requirements.',
  },
  {
    allOf: [
      { $ref: 'sdv_engineering_artefact' },
      {
        type: 'object',
        properties: {
          requirementType: {
            type: 'string',
            enum: ['Functional', 'Non-Functional', 'Safety', 'Regulatory'],
          },
          priority: {
            type: 'string',
            enum: ['Low', 'Medium', 'High'],
          },
        },
        required: ['name', 'requirementType'],
      },
    ],
    $id: 'requirement',
    title: 'Requirement',
    description: 'Defines a specific requirement for the SDV system.',
  },
  {
    allOf: [
      { $ref: 'sdv_system_artefact' },
      {
        type: 'object',
        properties: {
          peripheralType: {
            type: 'string',
            enum: ['Sensor', 'Actuator', 'Camera', 'Other'],
          },
          powerRequirement: { type: 'number', unit: 'W' },
        },
      },
    ],
    $id: 'peripheral',
    title: 'Peripheral',
    description:
      'A device or module attached to the SDV system (sensor, actuator, etc.).',
  },
]

export const inheritanceRelations = [
  {
    source: 'artefact',
    target: 'base_object',
    type: 'inheritance',
  },
  {
    source: 'tool_artefact',
    target: 'artefact',
    type: 'inheritance',
  },
  {
    source: 'sdv_system_artefact',
    target: 'artefact',
    type: 'inheritance',
  },
  {
    source: 'sdv_engineering_artefact',
    target: 'artefact',
    type: 'inheritance',
  },
  { source: 'system', target: 'sdv_system_artefact', type: 'inheritance' },
  { source: 'sub_system', target: 'sdv_system_artefact', type: 'inheritance' },
  { source: 'network', target: 'sdv_system_artefact', type: 'inheritance' },
  {
    source: 'compute_node',
    target: 'sdv_system_artefact',
    type: 'inheritance',
  },
  {
    source: 'sw_stack_item',
    target: 'sdv_system_artefact',
    type: 'inheritance',
  },
  {
    source: 'asw_component',
    target: 'sdv_system_artefact',
    type: 'inheritance',
  },
  { source: 'asw_service', target: 'sdv_system_artefact', type: 'inheritance' },
  { source: 'hara', target: 'sdv_system_artefact', type: 'inheritance' },
  { source: 'country', target: 'sdv_system_artefact', type: 'inheritance' },
  { source: 'regulation', target: 'sdv_system_artefact', type: 'inheritance' },
  { source: 'hil', target: 'sdv_system_artefact', type: 'inheritance' },
  { source: 'peripheral', target: 'sdv_system_artefact', type: 'inheritance' },
  {
    source: 'test_plan',
    target: 'sdv_engineering_artefact',
    type: 'inheritance',
  },
  {
    source: 'requirements_group',
    target: 'sdv_engineering_artefact',
    type: 'inheritance',
  },
  {
    source: 'requirement',
    target: 'sdv_engineering_artefact',
    type: 'inheritance',
  },
]

export const relations = [
  {
    source: 'vehicle_model',
    target: 'asw_domain',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'vehicle_model',
    target: 'stage',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'vehicle_model',
    target: 'system_definition',
    type: 'composition',
    multiplicity: 'one-to-one',
  },
  {
    source: 'system_definition',
    target: 'system',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'system',
    target: 'sub_system',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'sub_system',
    target: 'compute_node',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'compute_node',
    target: 'network',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'compute_node',
    target: 'sw_stack_item',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'asw_domain',
    target: 'asw_component',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'asw_component',
    target: 'asw_service',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'asw_service',
    target: 'peripheral',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'asw_service',
    target: 'api_layer',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'asw_component',
    target: 'asw_layer',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
]

export const instances: InventoryItem[] = [
  {
    id: 'artefact-1',
    type: 'artefact',
    data: {
      name: 'SDV Artefact - Firmware Release',
      description: 'Firmware release package for vehicle control modules.',
      version: 'v1.0.0',
      createdAt: '2025-03-10T12:20:00Z',
      updatedAt: '2025-03-10T12:20:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'artefact-2',
    type: 'artefact',
    data: {
      name: 'SDV Artefact - Calibration Data',
      description: 'Vehicle sensor calibration data for ADAS systems.',
      version: 'v1.1.2',
      createdAt: '2025-03-10T12:25:00Z',
      updatedAt: '2025-03-10T12:25:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'tool_artefact-1',
    type: 'tool_artefact',
    data: {
      name: 'Vehicle Simulation Tool',
      description:
        'A simulation tool used for virtual vehicle testing and HIL integration.',
      version: 'v2.0',
      toolType: 'Simulation',
      vendor: 'SimuAuto Inc.',
      createdAt: '2025-03-10T12:30:00Z',
      updatedAt: '2025-03-10T12:30:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'tool_artefact-2',
    type: 'tool_artefact',
    data: {
      name: 'SDV Testing Suite',
      description:
        'Comprehensive testing tool for verifying vehicle control algorithms.',
      version: 'v2.1',
      toolType: 'Testing',
      vendor: 'AutoTest Solutions',
      createdAt: '2025-03-10T12:35:00Z',
      updatedAt: '2025-03-10T12:35:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'sdv_system_artefact-1',
    type: 'sdv_system_artefact',
    data: {
      name: 'ADAS Control System Artefact',
      description:
        'Artefact representing the overall Advanced Driver Assistance System.',
      version: 'v3.0',
      domain: 'ADAS',
      createdAt: '2025-03-10T12:40:00Z',
      updatedAt: '2025-03-10T12:40:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'sdv_system_artefact-2',
    type: 'sdv_system_artefact',
    data: {
      name: 'Infotainment System Artefact',
      description:
        'Artefact covering the vehicle’s connectivity and infotainment features.',
      version: 'v3.2',
      domain: 'Infotainment',
      createdAt: '2025-03-10T12:45:00Z',
      updatedAt: '2025-03-10T12:45:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'sdv_engineering_artefact-1',
    type: 'sdv_engineering_artefact',
    data: {
      name: 'Test Plan Documentation',
      description:
        'Detailed documentation for the validation of vehicle safety features.',
      version: 'v1.0',
      engineeringFocus: 'Testing',
      referenceLinks: ['http://autotest-docs.com/testplan'],
      createdAt: '2025-03-10T12:50:00Z',
      updatedAt: '2025-03-10T12:50:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'sdv_engineering_artefact-2',
    type: 'sdv_engineering_artefact',
    data: {
      name: 'Requirements Specification',
      description:
        'Comprehensive requirements for system safety and performance.',
      version: 'v1.2',
      engineeringFocus: 'Design',
      referenceLinks: ['http://autoreq-spec.com'],
      createdAt: '2025-03-10T12:55:00Z',
      updatedAt: '2025-03-10T12:55:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'system-1',
    type: 'system',
    data: {
      name: 'On-Board Control System',
      description:
        'Primary vehicle control system managing powertrain and chassis operations.',
      version: 'v1.0',
      systemType: 'On-Board',
      manufacturer: 'AutoMotive Tech',
      model: 'ControlX',
      createdAt: '2025-03-10T13:00:00Z',
      updatedAt: '2025-03-10T13:00:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'system-2',
    type: 'system',
    data: {
      name: 'Off-Board Diagnostic System',
      description:
        'Remote diagnostic system providing telematics and analytics.',
      version: 'v1.1',
      systemType: 'Off-Board',
      manufacturer: 'DiagnoSys Inc.',
      model: 'RemoteX',
      createdAt: '2025-03-10T13:05:00Z',
      updatedAt: '2025-03-10T13:05:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'sub_system-1',
    type: 'sub_system',
    data: {
      name: 'Chassis & Suspension',
      description:
        'Subsystem responsible for vehicle stability and ride comfort.',
      version: 'v1.0',
      subSystemType: 'Chassis',
      powerConsumption: 450,
      createdAt: '2025-03-10T13:10:00Z',
      updatedAt: '2025-03-10T13:10:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'sub_system-2',
    type: 'sub_system',
    data: {
      name: 'Power Distribution Unit',
      description: 'Handles the distribution of power across vehicle modules.',
      version: 'v1.1',
      subSystemType: 'PowerDistribution',
      powerConsumption: 600,
      createdAt: '2025-03-10T13:15:00Z',
      updatedAt: '2025-03-10T13:15:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'network-1',
    type: 'network',
    data: {
      name: 'High-Speed Ethernet Bus',
      description:
        'Ethernet network connecting compute nodes and central controllers.',
      version: 'v1.0',
      networkType: 'Ethernet',
      bandwidth: 1000,
      createdAt: '2025-03-10T13:20:00Z',
      updatedAt: '2025-03-10T13:20:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'network-2',
    type: 'network',
    data: {
      name: 'CAN Bus',
      description:
        'Controller Area Network used for sensor and actuator communication.',
      version: 'v1.1',
      networkType: 'CAN',
      bandwidth: 500,
      createdAt: '2025-03-10T13:25:00Z',
      updatedAt: '2025-03-10T13:25:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'compute_node-1',
    type: 'compute_node',
    data: {
      name: 'Vehicle Gateway ECU',
      description:
        'Electronic control unit responsible for interfacing between sensors and central control.',
      version: 'v1.0',
      nodeType: 'Gateway',
      cpuArchitecture: 'ARM',
      ramSize: 4,
      storageSize: 64,
      createdAt: '2025-03-10T13:30:00Z',
      updatedAt: '2025-03-10T13:30:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'compute_node-2',
    type: 'compute_node',
    data: {
      name: 'Infotainment Server ECU',
      description: 'Handles multimedia, navigation, and connectivity features.',
      version: 'v1.1',
      nodeType: 'Server',
      cpuArchitecture: 'x86',
      ramSize: 8,
      storageSize: 256,
      createdAt: '2025-03-10T13:35:00Z',
      updatedAt: '2025-03-10T13:35:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'sw_stack_item-1',
    type: 'sw_stack_item',
    data: {
      name: 'Embedded OS for Gateway',
      description:
        'Operating system for the vehicle gateway ECU providing real-time performance.',
      version: 'v1.0',
      swType: 'OS',
      vendor: 'EmbeddedSys',
      createdAt: '2025-03-10T13:40:00Z',
      updatedAt: '2025-03-10T13:40:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'sw_stack_item-2',
    type: 'sw_stack_item',
    data: {
      name: 'Middleware for Infotainment',
      description:
        'Software middleware providing integration for multimedia applications.',
      version: 'v1.1',
      swType: 'Middleware',
      vendor: 'MediaSoft',
      createdAt: '2025-03-10T13:45:00Z',
      updatedAt: '2025-03-10T13:45:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'asw_component-1',
    type: 'asw_component',
    data: {
      name: 'ADAS Vision Processing',
      description:
        'Component handling image processing for collision avoidance.',
      version: 'v1.0',
      componentType: 'AI-Inference',
      framework: 'TensorFlow',
      dependencies: ['OpenCV', 'LibVision'],
      createdAt: '2025-03-10T13:50:00Z',
      updatedAt: '2025-03-10T13:50:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'asw_component-2',
    type: 'asw_component',
    data: {
      name: 'Infotainment UI Engine',
      description:
        'Component responsible for managing the vehicle infotainment user interface.',
      version: 'v1.0',
      componentType: 'AppLogic',
      framework: 'React',
      dependencies: ['Redux', 'StyledComponents'],
      createdAt: '2025-03-10T13:55:00Z',
      updatedAt: '2025-03-10T13:55:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'asw_component-3',
    type: 'asw_component',
    data: {
      name: 'Engine Control Logic',
      description:
        'Component managing the powertrain control and engine performance.',
      version: 'v1.0',
      componentType: 'StateEngine',
      framework: 'Angular',
      dependencies: ['RxJS'],
      createdAt: '2025-03-10T14:00:00Z',
      updatedAt: '2025-03-10T14:00:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'asw_component-4',
    type: 'asw_component',
    data: {
      name: 'Simulation Data Aggregator',
      description: 'Component that aggregates simulation data for HIL testing.',
      version: 'v1.0',
      componentType: 'Simulation',
      framework: 'Vue',
      dependencies: ['D3.js', 'Axios'],
      createdAt: '2025-03-10T14:05:00Z',
      updatedAt: '2025-03-10T14:05:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'asw_component-5',
    type: 'asw_component',
    data: {
      name: 'Connectivity Module',
      description: 'Component managing in-vehicle connectivity and telematics.',
      version: 'v1.1',
      componentType: 'AppLogic',
      framework: 'Svelte',
      dependencies: ['WebSocket', 'MQTT'],
      createdAt: '2025-03-10T14:10:00Z',
      updatedAt: '2025-03-10T14:10:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'asw_component-6',
    type: 'asw_component',
    data: {
      name: 'Advanced Sensor Fusion',
      description:
        'Component integrating data from multiple ADAS sensors for improved perception.',
      version: 'v1.1',
      componentType: 'AI-Inference',
      framework: 'PyTorch',
      dependencies: ['NumPy', 'SciPy'],
      createdAt: '2025-03-10T14:15:00Z',
      updatedAt: '2025-03-10T14:15:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'asw_component-7',
    type: 'asw_component',
    data: {
      name: 'ADAS Decision Engine',
      description:
        'Component that processes sensor data to make real‑time driving decisions.',
      version: 'v1.1',
      componentType: 'StateEngine',
      framework: 'Ember',
      dependencies: ['Lodash'],
      createdAt: '2025-03-10T14:20:00Z',
      updatedAt: '2025-03-10T14:20:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'asw_component-8',
    type: 'asw_component',
    data: {
      name: 'Vehicle Diagnostics Manager',
      description:
        'Component responsible for collecting and processing diagnostic data.',
      version: 'v1.1',
      componentType: 'Simulation',
      framework: 'Backbone',
      dependencies: ['D3.js'],
      createdAt: '2025-03-10T14:25:00Z',
      updatedAt: '2025-03-10T14:25:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'asw_component-9',
    type: 'asw_component',
    data: {
      name: 'Mobile App Control Interface',
      description:
        'Component for managing user interactions via the vehicle mobile app.',
      version: 'v1.2',
      componentType: 'AppLogic',
      framework: 'React Native',
      dependencies: ['Expo', 'Redux'],
      createdAt: '2025-03-10T14:30:00Z',
      updatedAt: '2025-03-10T14:30:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'asw_component-10',
    type: 'asw_component',
    data: {
      name: 'Cloud Connectivity Gateway',
      description:
        'Component enabling secure data exchange between the vehicle and cloud services.',
      version: 'v1.2',
      componentType: 'AI-Inference',
      framework: 'MXNet',
      dependencies: ['OpenSSL'],
      createdAt: '2025-03-10T14:35:00Z',
      updatedAt: '2025-03-10T14:35:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'asw_service-1',
    type: 'asw_service',
    data: {
      name: 'ADAS Vision API',
      description:
        'Service providing image analytics and collision detection outputs.',
      version: 'v1.0',
      serviceInterface: 'REST',
      functionality: 'Process and return visual detection data',
      createdAt: '2025-03-10T14:40:00Z',
      updatedAt: '2025-03-10T14:40:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'asw_service-2',
    type: 'asw_service',
    data: {
      name: 'Infotainment GraphQL API',
      description:
        'Service to query multimedia and navigation data for infotainment.',
      version: 'v1.0',
      serviceInterface: 'GraphQL',
      functionality: 'Return multimedia and map data',
      createdAt: '2025-03-10T14:45:00Z',
      updatedAt: '2025-03-10T14:45:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'asw_service-3',
    type: 'asw_service',
    data: {
      name: 'Engine Diagnostics REST API',
      description:
        'Service offering real‑time engine performance metrics via REST.',
      version: 'v1.0',
      serviceInterface: 'REST',
      functionality: 'Deliver engine performance data',
      createdAt: '2025-03-10T14:50:00Z',
      updatedAt: '2025-03-10T14:50:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'asw_service-4',
    type: 'asw_service',
    data: {
      name: 'Legacy SOAP Interface',
      description: 'Service to support legacy integrations using SOAP.',
      version: 'v1.0',
      serviceInterface: 'SOAP',
      functionality: 'Provide backward compatibility for older modules',
      createdAt: '2025-03-10T14:55:00Z',
      updatedAt: '2025-03-10T14:55:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'asw_service-5',
    type: 'asw_service',
    data: {
      name: 'Data Update REST API',
      description: 'Service to push over-the-air updates for vehicle software.',
      version: 'v1.1',
      serviceInterface: 'REST',
      functionality: 'Transmit software update packages',
      createdAt: '2025-03-10T15:00:00Z',
      updatedAt: '2025-03-10T15:00:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'asw_service-6',
    type: 'asw_service',
    data: {
      name: 'Telematics GraphQL API',
      description:
        'Service managing vehicle subscriptions and remote diagnostics via GraphQL.',
      version: 'v1.1',
      serviceInterface: 'GraphQL',
      functionality: 'Handle remote monitoring and subscription data',
      createdAt: '2025-03-10T15:05:00Z',
      updatedAt: '2025-03-10T15:05:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'asw_service-7',
    type: 'asw_service',
    data: {
      name: 'Payment Processing REST API',
      description:
        'Service for secure payment transactions within connected vehicles.',
      version: 'v1.1',
      serviceInterface: 'REST',
      functionality: 'Process in-vehicle payment transactions',
      createdAt: '2025-03-10T15:10:00Z',
      updatedAt: '2025-03-10T15:10:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'asw_service-8',
    type: 'asw_service',
    data: {
      name: 'Reporting SOAP Service',
      description:
        'Service delivering vehicle performance and usage reports via SOAP.',
      version: 'v1.1',
      serviceInterface: 'SOAP',
      functionality: 'Generate and deliver detailed performance reports',
      createdAt: '2025-03-10T15:15:00Z',
      updatedAt: '2025-03-10T15:15:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'asw_service-9',
    type: 'asw_service',
    data: {
      name: 'Notification Service REST API',
      description:
        'Service for pushing alert notifications and vehicle status updates.',
      version: 'v1.2',
      serviceInterface: 'REST',
      functionality: 'Push real-time notifications to driver apps',
      createdAt: '2025-03-10T15:20:00Z',
      updatedAt: '2025-03-10T15:20:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'asw_service-10',
    type: 'asw_service',
    data: {
      name: 'Cloud Data Sync GraphQL API',
      description:
        'Service ensuring secure real-time data synchronization between the vehicle and cloud services.',
      version: 'v1.2',
      serviceInterface: 'GraphQL',
      functionality: 'Enable secure cloud connectivity and data exchange',
      createdAt: '2025-03-10T15:25:00Z',
      updatedAt: '2025-03-10T15:25:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'hara-1',
    type: 'hara',
    data: {
      name: 'Hazard: Overheating Risk',
      description:
        'Risk assessment for potential engine overheating during extreme operation.',
      version: 'v1.0',
      hazard: 'Engine Overheating',
      riskLevel: 'High',
      mitigationPlan: 'Enhance cooling system design and improve airflow.',
      createdAt: '2025-03-10T15:30:00Z',
      updatedAt: '2025-03-10T15:30:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'hara-2',
    type: 'hara',
    data: {
      name: 'Hazard: Electrical Short Circuit',
      description:
        'Risk assessment addressing potential electrical short circuits in the vehicle wiring harness.',
      version: 'v1.1',
      hazard: 'Electrical Short Circuit',
      riskLevel: 'Critical',
      mitigationPlan:
        'Implement redundant wiring and use higher-grade insulation.',
      createdAt: '2025-03-10T15:35:00Z',
      updatedAt: '2025-03-10T15:35:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'country-1',
    type: 'country',
    data: {
      name: 'United States',
      description: 'Primary market region in North America.',
      version: 'v1.0',
      isoCode: 'US',
      region: 'North America',
      createdAt: '2025-03-10T15:40:00Z',
      updatedAt: '2025-03-10T15:40:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'country-2',
    type: 'country',
    data: {
      name: 'Germany',
      description:
        'Major market region in Europe with stringent automotive standards.',
      version: 'v1.1',
      isoCode: 'DE',
      region: 'Europe',
      createdAt: '2025-03-10T15:45:00Z',
      updatedAt: '2025-03-10T15:45:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'regulation-1',
    type: 'regulation',
    data: {
      name: 'Federal Motor Vehicle Safety Standard',
      description: 'U.S. safety regulation for onboard electronic systems.',
      version: 'v1.0',
      regulationId: 'FMVSS-126',
      authority: 'NHTSA',
      createdAt: '2025-03-10T15:50:00Z',
      updatedAt: '2025-03-10T15:50:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'regulation-2',
    type: 'regulation',
    data: {
      name: 'European Emission Standards',
      description:
        'EU regulation targeting low emissions and enhanced fuel efficiency.',
      version: 'v1.1',
      regulationId: 'Euro6',
      authority: 'European Commission',
      createdAt: '2025-03-10T15:55:00Z',
      updatedAt: '2025-03-10T15:55:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'hil-1',
    type: 'hil',
    data: {
      name: 'HIL Setup - Engine Test Rig',
      description:
        'Hardware-in-the-loop configuration for engine performance testing.',
      version: 'v1.0',
      rigConfiguration: 'EngineTestRig-A',
      hardwareInLoop: true,
      createdAt: '2025-03-10T16:00:00Z',
      updatedAt: '2025-03-10T16:00:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'hil-2',
    type: 'hil',
    data: {
      name: 'HIL Setup - Infotainment Rig',
      description:
        'HIL configuration for testing vehicle multimedia and connectivity systems.',
      version: 'v1.1',
      rigConfiguration: 'InfotainmentRig-B',
      hardwareInLoop: false,
      createdAt: '2025-03-10T16:05:00Z',
      updatedAt: '2025-03-10T16:05:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'test_plan-1',
    type: 'test_plan',
    data: {
      name: 'SDV Safety Test Plan',
      description:
        'Plan outlining tests for ADAS, infotainment, and control systems to meet regulatory standards.',
      version: 'v1.0',
      engineeringFocus: 'Testing',
      referenceLinks: ['http://sdv-tests.com/safety'],
      objective: 'Verify system responses under critical conditions',
      scope: 'Full vehicle integration tests',
      criteria: 'All safety thresholds met under simulated stress',
      createdAt: '2025-03-10T16:10:00Z',
      updatedAt: '2025-03-10T16:10:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'test_plan-2',
    type: 'test_plan',
    data: {
      name: 'SDV Simulation Test Plan',
      description:
        'Test plan for validating simulation models and HIL configurations for virtual testing.',
      version: 'v1.1',
      engineeringFocus: 'Simulation',
      referenceLinks: ['http://sdv-tests.com/simulation'],
      objective: 'Ensure simulation fidelity and hardware integration',
      scope: 'Subsystem-level simulation with live HIL feedback',
      criteria: 'Simulation outputs match physical test data',
      createdAt: '2025-03-10T16:15:00Z',
      updatedAt: '2025-03-10T16:15:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'requirements_group-1',
    type: 'requirements_group',
    data: {
      name: 'ADAS Functional Requirements',
      description:
        'Grouping of requirements related to advanced driver assistance functionalities.',
      version: 'v1.0',
      engineeringFocus: 'Requirements',
      referenceLinks: ['http://sdv-reqs.com/adas'],
      groupScope: 'Subsystem level',
      relatedTo: 'ADAS Control',
      createdAt: '2025-03-10T16:20:00Z',
      updatedAt: '2025-03-10T16:20:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'requirements_group-2',
    type: 'requirements_group',
    data: {
      name: 'Infotainment and Connectivity Requirements',
      description:
        'Collection of requirements ensuring seamless connectivity and user experience.',
      version: 'v1.1',
      engineeringFocus: 'Design',
      referenceLinks: ['http://sdv-reqs.com/infotainment'],
      groupScope: 'System level',
      relatedTo: 'Infotainment UI',
      createdAt: '2025-03-10T16:25:00Z',
      updatedAt: '2025-03-10T16:25:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'requirement-1',
    type: 'requirement',
    data: {
      name: 'Brake System Response Time',
      description:
        'The braking system must respond within 200ms under emergency conditions.',
      version: 'v1.0',
      engineeringFocus: 'Functional',
      referenceLinks: ['http://sdv-reqs.com/brakes'],
      requirementType: 'Functional',
      priority: 'High',
      createdAt: '2025-03-10T16:30:00Z',
      updatedAt: '2025-03-10T16:30:00Z',
      createdBy: {
        name: 'Slama Dirk (G7/PJ-DO-SPP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
        id: '6724a8cb3e09ac00279ed6f5',
      },
    },
  },
  {
    id: 'requirement-2',
    type: 'requirement',
    data: {
      name: 'Infotainment Latency',
      description:
        'Infotainment system response time should not exceed 100ms for user inputs.',
      version: 'v1.1',
      engineeringFocus: 'Non-Functional',
      referenceLinks: ['http://sdv-reqs.com/infotainment-latency'],
      requirementType: 'Safety',
      priority: 'Medium',
      createdAt: '2025-03-10T16:35:00Z',
      updatedAt: '2025-03-10T16:35:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
  {
    id: 'peripheral-1',
    type: 'peripheral',
    data: {
      name: 'Front Radar Sensor',
      description:
        'Sensor used for forward collision detection and adaptive cruise control.',
      version: 'v1.0',
      peripheralType: 'Sensor',
      powerRequirement: 12,
      createdAt: '2025-03-10T16:40:00Z',
      updatedAt: '2025-03-10T16:40:00Z',
      createdBy: {
        name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
        id: '6714fe1a9c8a740026eb7f97',
      },
    },
  },
  {
    id: 'peripheral-2',
    type: 'peripheral',
    data: {
      name: 'Rear Camera Module',
      description:
        'High-resolution camera module for parking assist and rear monitoring.',
      version: 'v1.1',
      peripheralType: 'Camera',
      powerRequirement: 15,
      createdAt: '2025-03-10T16:45:00Z',
      updatedAt: '2025-03-10T16:45:00Z',
      createdBy: {
        name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
        image_file:
          'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
        id: '6699fa83964f3f002f35ea03',
      },
    },
  },
]

export const instanceRelations = [
  {
    source: 'system-1',
    target: 'sub_system-1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'system-2',
    target: 'sub_system-2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'sub_system-1',
    target: 'compute_node-1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'sub_system-2',
    target: 'compute_node-2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'compute_node-1',
    target: 'network-1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'compute_node-2',
    target: 'network-2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'compute_node-1',
    target: 'sw_stack_item-1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'compute_node-2',
    target: 'sw_stack_item-2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'asw_component-1',
    target: 'asw_service-1',
    type: 'composition',
    multiplicity: 'one-to-one',
  },
  {
    source: 'asw_component-2',
    target: 'asw_service-2',
    type: 'composition',
    multiplicity: 'one-to-one',
  },
  {
    source: 'asw_component-3',
    target: 'asw_service-3',
    type: 'composition',
    multiplicity: 'one-to-one',
  },
  {
    source: 'asw_component-4',
    target: 'asw_service-4',
    type: 'composition',
    multiplicity: 'one-to-one',
  },
  {
    source: 'asw_component-5',
    target: 'asw_service-5',
    type: 'composition',
    multiplicity: 'one-to-one',
  },
  {
    source: 'asw_component-6',
    target: 'asw_service-6',
    type: 'composition',
    multiplicity: 'one-to-one',
  },
  {
    source: 'asw_component-7',
    target: 'asw_service-7',
    type: 'composition',
    multiplicity: 'one-to-one',
  },
  {
    source: 'asw_component-8',
    target: 'asw_service-8',
    type: 'composition',
    multiplicity: 'one-to-one',
  },
  {
    source: 'asw_component-9',
    target: 'asw_service-9',
    type: 'composition',
    multiplicity: 'one-to-one',
  },
  {
    source: 'asw_component-10',
    target: 'asw_service-10',
    type: 'composition',
    multiplicity: 'one-to-one',
  },
  {
    source: 'asw_service-1',
    target: 'peripheral-1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'asw_service-2',
    target: 'peripheral-2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
]

export const rolesTypeMap: Record<string, string> = {
  'SDV Feature Owner': 'asw_component',
  'SDV Requirements Engineer': 'requirement',
  'SDV System Architect': 'system',
  'SDV Developer': 'asw_component',
  'SDV Staging Expert': 'stage',
  'SDV Homologation Expert': 'hara',
  'SDV Test Manager': 'test_plan',
  'Security Engineer': 'stage',
  'OTA Deployment Manager': 'stage',
}

export const joinData = (data: any[]) => {
  const result: InventoryItem[] = data
  result.forEach((item) => {
    item.typeData = types.find((type) => type.$id === item.type)
  })
  return result
}
