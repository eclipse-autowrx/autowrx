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
    id: 'system',
    name: 'System',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['On-Board', 'Off-Board'],
        },
        manufacturer: {
          type: 'string',
        },
        model: {
          type: 'string',
        },
        softwareVersion: {
          type: 'string',
        },
        hardwareVersion: {
          type: 'string',
        },
      },
      required: ['type', 'manufacturer', 'model'],
    },
    relations: [
      {
        target: 'sub_system',
        type: 'composition',
        multiplicity: 'one-to-many',
      },
      {
        target: 'sdv_system_artefact',
        type: 'inheritance',
      },
    ],
  },
  {
    id: 'sub_system',
    name: 'Sub-System',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['VehicleZone', 'Cloud', 'Enterprise', 'SmartDevice', 'Other'],
        },
        functionality: {
          type: 'string',
        },
        powerConsumption: {
          type: 'number',
          unit: 'W',
        },
      },
      required: ['type', 'functionality'],
    },
    relations: [
      {
        target: 'network',
        type: 'composition',
        multiplicity: 'one-to-many',
      },
      {
        target: 'compute_node',
        type: 'composition',
        multiplicity: 'one-to-many',
      },
      {
        target: 'sdv_system_artefact',
        type: 'inheritance',
      },
    ],
  },
  {
    id: 'network',
    name: 'Network',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['WLAN', 'ETH', 'CAN', 'LIN', 'FlexRay'],
        },
        bandwidth: {
          type: 'number',
          unit: 'Mbps',
        },
        latency: {
          type: 'number',
          unit: 'ms',
        },
      },
      required: ['type', 'bandwidth'],
    },
    relations: [
      {
        target: 'sdv_system_artefact',
        type: 'inheritance',
      },
    ],
  },
  {
    id: 'compute_node',
    name: 'Compute Node',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: [
            'Server',
            'ECU',
            'Gateway',
            'Chiplet',
            'Processor',
            'Peripheral',
          ],
        },
        cpuArchitecture: {
          type: 'string',
          enum: ['ARM', 'x86', 'RISC-V', 'Other'],
        },
        ramSize: {
          type: 'number',
          unit: 'GB',
        },
        storageSize: {
          type: 'number',
          unit: 'GB',
        },
      },
      required: ['type', 'cpuArchitecture', 'ramSize'],
    },
    relations: [
      {
        target: 'sw_stack_item',
        type: 'composition',
        multiplicity: 'one-to-many',
      },
      {
        target: 'asw_component',
        type: 'composition',
        multiplicity: 'one-to-many',
      },
      {
        target: 'sdv_system_artefact',
        type: 'inheritance',
      },
    ],
  },
  {
    id: 'sw_stack_item',
    name: 'SW Stack Item',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: [
            'OS',
            'RTOS',
            'HyperVisor',
            'Middleware',
            'Container Runtime',
            'Container',
          ],
        },
        version: {
          type: 'string',
        },
        vendor: {
          type: 'string',
        },
      },
      required: ['type', 'version', 'vendor'],
    },
    relations: [
      {
        target: 'sdv_system_artefact',
        type: 'inheritance',
      },
    ],
  },
  {
    id: 'asw_component',
    name: 'ASW Component',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: [
            'AppLogic',
            'AI-Inference',
            'State Engine',
            'Simulation',
            'MockUp',
          ],
        },
        framework: {
          type: 'string',
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      required: ['type'],
    },
    relations: [
      {
        target: 'asw_service',
        type: 'composition',
        multiplicity: 'one-to-many',
      },
      {
        target: 'asw_domain',
        type: 'inheritance',
        multiplicity: 'one-to-one',
      },
      {
        target: 'sdv_system_artefact',
        type: 'inheritance',
      },
    ],
  },
  {
    id: 'asw_domain',
    name: 'ASW Domain',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        purpose: {
          type: 'string',
        },
      },
      required: ['name'],
    },
    relations: [
      {
        target: 'sdv_system_artefact',
        type: 'inheritance',
      },
    ],
  },
  {
    id: 'asw_service',
    name: 'ASW Service',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        functionality: {
          type: 'string',
        },
      },
      required: ['name'],
    },
    relations: [
      {
        target: 'api',
        type: 'association',
        multiplicity: 'zero-to-one',
      },
      {
        target: 'sdv_system_artefact',
        type: 'inheritance',
      },
    ],
  },
  {
    id: 'api',
    name: 'API',
    schema: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
        },
        protocol: {
          type: 'string',
          enum: ['HTTP', 'gRPC', 'MQTT'],
        },
      },
      required: ['endpoint'],
    },
    relations: [
      {
        target: 'sdv_system_artefact',
        type: 'inheritance',
      },
    ],
  },
  {
    id: 'peripheral',
    name: 'Peripheral',
    schema: {
      type: 'object',
      properties: {
        peripheralType: {
          type: 'string',
          enum: ['Actuator', 'Sensor'],
        },
        powerRequirement: {
          type: 'number',
          unit: 'W',
        },
      },
      required: ['peripheralType'],
    },
    relations: [
      {
        target: 'sdv_system_artefact',
        type: 'inheritance',
      },
    ],
  },
  {
    id: 'sdv_system_artefact',
    name: 'SDV System Artefact',
    schema: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
      },
      required: ['identifier'],
    },
    relations: [],
  },
  {
    id: 'test_plan',
    name: 'Test Plan',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        objective: { type: 'string' },
        testStrategy: { type: 'string' },
        testScope: { type: 'string' },
        criteria: { type: 'string' },
      },
      required: ['name', 'objective'],
    },
    relations: [
      {
        target: 'requirement',
        type: 'association',
        multiplicity: 'one-to-many',
      },
    ],
  },
  {
    id: 'hara',
    name: 'HARA',
    schema: {
      type: 'object',
      properties: {
        hazard: { type: 'string' },
        riskLevel: {
          type: 'string',
          enum: ['Low', 'Medium', 'High', 'Critical'],
        },
        mitigationPlan: { type: 'string' },
      },
      required: ['hazard', 'riskLevel'],
    },
    relations: [
      {
        target: 'requirement',
        type: 'association',
        multiplicity: 'one-to-many',
      },
    ],
  },
  {
    id: 'stage',
    name: 'Stage',
    schema: {
      type: 'object',
      properties: {
        stageType: {
          type: 'string',
          enum: [
            'Concept',
            'Development',
            'Testing',
            'Deployment',
            'Maintenance',
          ],
        },
        description: { type: 'string' },
      },
      required: ['stageType'],
    },
    relations: [],
  },
  {
    id: 'requirement',
    name: 'Requirement',
    schema: {
      type: 'object',
      properties: {
        identifier: { type: 'string' },
        description: { type: 'string' },
        requirementType: {
          type: 'string',
          enum: ['Functional', 'Non-Functional', 'Safety', 'Regulatory'],
        },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
      },
      required: ['identifier', 'requirementType'],
    },
    relations: [
      { target: 'test_plan', type: 'association', multiplicity: 'one-to-many' },
      { target: 'sdv_system_artefact', type: 'inheritance' },
    ],
  },
  {
    id: 'tool_artefact',
    name: 'Tool Artefact',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        toolType: {
          type: 'string',
          enum: [
            'Simulation',
            'Validation',
            'Testing',
            'Monitoring',
            'Debugging',
          ],
        },
        vendor: { type: 'string' },
      },
      required: ['name', 'toolType'],
    },
    relations: [],
  },
  {
    id: 'sdv_engineering_artefact',
    name: 'SDV Engineering Artefact',
    schema: {
      type: 'object',
      properties: {
        identifier: { type: 'string' },
        artefactType: {
          type: 'string',
          enum: ['Specification', 'Design', 'Simulation Model', 'Report'],
        },
        owner: { type: 'string' },
      },
      required: ['identifier', 'artefactType'],
    },
    relations: [{ target: 'sdv_system_artefact', type: 'inheritance' }],
  },
]

export const instances: InventoryItem[] = [
  {
    id: 'system_1',
    name: 'Vehicle On-Board System',
    type: 'system',
    manufacturer: 'Bosch',
    model: 'X1000',
    softwareVersion: '1.2.3',
    hardwareVersion: 'RevA',
    createdAt: '2025-02-01T08:30:00.000Z',
    updatedAt: '2025-02-02T08:30:00.000Z',
    created_by: {
      name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
      id: '6714fe1a9c8a740026eb7f97',
    },
    description:
      'A high-performance computing system designed for autonomous driving.',
    relations: [{ target: 'sub_system_1', type: 'composition' }],
  },
  {
    id: 'sub_system_1',
    name: 'Vehicle Control Sub-System',
    type: 'sub_system',
    functionality: 'ADAS Processing',
    powerConsumption: 200,
    createdAt: '2025-02-01T09:00:00.000Z',
    updatedAt: '2025-02-02T09:00:00.000Z',
    created_by: {
      name: 'Slama Dirk (G7/PJ-DO-SPP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
      id: '6724a8cb3e09ac00279ed6f5',
    },
    description: 'Handles perception and decision-making in ADAS.',
    relations: [{ target: 'network_1', type: 'composition' }],
  },
  {
    id: 'network_1',
    name: 'In-Vehicle Network',
    type: 'network',
    bandwidth: 1000,
    latency: 2,
    createdAt: '2025-02-01T10:00:00.000Z',
    updatedAt: '2025-02-02T10:00:00.000Z',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    description: 'Ethernet-based high-speed network for vehicle communication.',
    relations: [],
  },
  {
    id: 'compute_node_1',
    name: 'ECU Compute Node',
    type: 'compute_node',
    cpuArchitecture: 'ARM',
    ramSize: 16,
    storageSize: 256,
    createdAt: '2025-02-01T11:00:00.000Z',
    updatedAt: '2025-02-02T11:00:00.000Z',
    created_by: {
      name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
      id: '6714fe1a9c8a740026eb7f97',
    },
    description: 'Central ECU for ADAS computing.',
    relations: [{ target: 'sw_stack_item_1', type: 'composition' }],
  },
  {
    id: 'sw_stack_item_1',
    name: 'RTOS Stack',
    type: 'sw_stack_item',
    version: '3.0',
    vendor: 'QNX',
    createdAt: '2025-02-01T12:00:00.000Z',
    updatedAt: '2025-02-02T12:00:00.000Z',
    created_by: {
      name: 'Slama Dirk (G7/PJ-DO-SPP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
      id: '6724a8cb3e09ac00279ed6f5',
    },
    description: 'Real-time OS for embedded automotive systems.',
    relations: [],
  },
  {
    id: 'asw_component_1',
    name: 'ADAS Perception Module',
    type: 'asw_component',
    framework: 'OpenCV',
    dependencies: ['grpc', 'protobuf', 'tensorflow-serving-api'],
    createdAt: '2025-01-30T07:52:35.124479Z',
    updatedAt: '2025-02-01T07:52:35.124479Z',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    description:
      'Processes sensor data for ADAS, including object detection and lane recognition.',
    relations: [
      {
        target: 'asw_service_1',
        type: 'composition',
      },
    ],
  },
  {
    id: 'instance_56',
    name: 'Autonomous Navigation Module',
    type: 'asw_component',
    framework: 'ROS2',
    dependencies: ['rclcpp', 'nav2', 'tf2'],
    createdAt: '2025-06-01T08:30:00.000Z',
    updatedAt: '2025-06-02T08:30:00.000Z',
    created_by: {
      name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
      id: '6714fe1a9c8a740026eb7f97',
    },
    description:
      'A software module for autonomous vehicle path planning and navigation.',
    relations: [{ target: 'asw_service_3', type: 'composition' }],
  },
  {
    id: 'instance_57',
    name: 'In-Vehicle AI Assistant',
    type: 'asw_service',
    functionality: 'Voice interaction and driver assistance',
    createdAt: '2025-06-02T09:45:00.000Z',
    updatedAt: '2025-06-03T09:45:00.000Z',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    description:
      'A voice-controlled AI assistant for vehicle automation and entertainment.',
    relations: [{ target: 'api_4', type: 'association' }],
  },
  {
    id: 'instance_58',
    name: 'Vehicle Cybersecurity Firewall',
    type: 'network',
    bandwidth: 500,
    latency: 5,
    createdAt: '2025-06-04T10:15:00.000Z',
    updatedAt: '2025-06-05T10:15:00.000Z',
    created_by: {
      name: 'Slama Dirk (G7/PJ-DO-SPP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
      id: '6724a8cb3e09ac00279ed6f5',
    },
    description:
      'An embedded firewall protecting in-vehicle networks from cyber threats.',
    relations: [],
  },
  {
    id: 'instance_59',
    name: 'Smart Suspension Control ECU',
    type: 'compute_node',
    cpuArchitecture: 'RISC-V',
    ramSize: 8,
    storageSize: 128,
    createdAt: '2025-06-06T11:00:00.000Z',
    updatedAt: '2025-06-07T11:00:00.000Z',
    created_by: {
      name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
      id: '6714fe1a9c8a740026eb7f97',
    },
    description:
      'A real-time computing unit for active suspension adjustments based on road conditions.',
    relations: [{ target: 'sw_stack_item_4', type: 'composition' }],
  },
  {
    id: 'instance_60',
    name: 'IoT Vehicle Gateway',
    type: 'system',
    manufacturer: 'Qualcomm',
    model: 'VGate-5000',
    softwareVersion: '2.1.0',
    hardwareVersion: 'RevB',
    createdAt: '2025-06-08T12:00:00.000Z',
    updatedAt: '2025-06-09T12:00:00.000Z',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    description:
      'An IoT-enabled gateway for real-time vehicle connectivity and diagnostics.',
    relations: [{ target: 'sub_system_6', type: 'composition' }],
  },
  {
    id: 'instance_61',
    name: 'Dynamic Lane Detection Module',
    type: 'asw_component',
    framework: 'TensorFlow',
    dependencies: ['opencv', 'keras', 'numpy'],
    createdAt: '2025-06-10T08:30:00.000Z',
    updatedAt: '2025-06-11T08:30:00.000Z',
    created_by: {
      name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
      id: '6714fe1a9c8a740026eb7f97',
    },
    description:
      'AI-powered module for real-time lane detection and tracking in autonomous vehicles.',
    relations: [{ target: 'asw_service_5', type: 'composition' }],
  },
  {
    id: 'instance_62',
    name: 'Edge Computing Vehicle Hub',
    type: 'compute_node',
    cpuArchitecture: 'x86',
    ramSize: 32,
    storageSize: 512,
    createdAt: '2025-06-12T09:45:00.000Z',
    updatedAt: '2025-06-13T09:45:00.000Z',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    description:
      'High-performance edge computing hub for processing vehicle sensor data in real-time.',
    relations: [{ target: 'sw_stack_item_6', type: 'composition' }],
  },
  {
    id: 'instance_63',
    name: 'Real-Time Vehicle Diagnostics API',
    type: 'api',
    endpoint: '/vehicle/diagnostics',
    protocol: 'HTTP',
    createdAt: '2025-06-14T10:15:00.000Z',
    updatedAt: '2025-06-15T10:15:00.000Z',
    created_by: {
      name: 'Slama Dirk (G7/PJ-DO-SPP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
      id: '6724a8cb3e09ac00279ed6f5',
    },
    description:
      'An API providing real-time diagnostics and health monitoring for connected vehicles.',
    relations: [],
  },
  {
    id: 'instance_64',
    name: 'Autonomous Braking Control System',
    type: 'sub_system',
    functionality: 'Collision avoidance and emergency braking',
    powerConsumption: 120,
    createdAt: '2025-06-16T11:00:00.000Z',
    updatedAt: '2025-06-17T11:00:00.000Z',
    created_by: {
      name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
      id: '6714fe1a9c8a740026eb7f97',
    },
    description:
      'A safety system designed to autonomously apply brakes to prevent collisions.',
    relations: [{ target: 'network_7', type: 'composition' }],
  },
  {
    id: 'instance_65',
    name: 'Next-Gen Vehicle Infotainment System',
    type: 'system',
    manufacturer: 'Sony',
    model: 'XAV-9000',
    softwareVersion: '6.5.2',
    hardwareVersion: 'RevC',
    createdAt: '2025-06-18T12:00:00.000Z',
    updatedAt: '2025-06-19T12:00:00.000Z',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    description:
      'An advanced infotainment system integrating AI-driven features and seamless connectivity.',
    relations: [{ target: 'sub_system_8', type: 'composition' }],
  },
  {
    id: 'instance_66',
    name: 'Adaptive Cruise Control Module',
    type: 'asw_component',
    framework: 'PyTorch',
    dependencies: ['torchvision', 'numpy', 'matplotlib'],
    createdAt: '2025-06-20T08:30:00.000Z',
    updatedAt: '2025-06-21T08:30:00.000Z',
    created_by: {
      name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
      id: '6714fe1a9c8a740026eb7f97',
    },
    description:
      'An AI-powered module for dynamically adjusting vehicle speed based on traffic conditions.',
    relations: [{ target: 'asw_service_6', type: 'composition' }],
  },
  {
    id: 'instance_67',
    name: 'Real-Time Traffic Prediction Engine',
    type: 'asw_component',
    framework: 'TensorFlow',
    dependencies: ['scikit-learn', 'pandas', 'seaborn'],
    createdAt: '2025-06-22T09:45:00.000Z',
    updatedAt: '2025-06-23T09:45:00.000Z',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    description:
      'A deep learning-based engine predicting traffic congestion patterns in real-time.',
    relations: [{ target: 'asw_service_7', type: 'composition' }],
  },
  {
    id: 'instance_68',
    name: 'Driver Fatigue Detection System',
    type: 'asw_component',
    framework: 'OpenCV',
    dependencies: ['dlib', 'tensorflow-lite', 'mediapipe'],
    createdAt: '2025-06-24T10:15:00.000Z',
    updatedAt: '2025-06-25T10:15:00.000Z',
    created_by: {
      name: 'Slama Dirk (G7/PJ-DO-SPP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
      id: '6724a8cb3e09ac00279ed6f5',
    },
    description:
      'A machine learning-based system for detecting driver fatigue and alerting accordingly.',
    relations: [{ target: 'asw_service_8', type: 'composition' }],
  },
  {
    id: 'instance_69',
    name: 'Vehicle-to-Vehicle Communication Module',
    type: 'asw_component',
    framework: 'gRPC',
    dependencies: ['protobuf', 'grpcio', 'zmq'],
    createdAt: '2025-06-26T11:00:00.000Z',
    updatedAt: '2025-06-27T11:00:00.000Z',
    created_by: {
      name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
      id: '6714fe1a9c8a740026eb7f97',
    },
    description:
      'A module enabling secure real-time communication between vehicles.',
    relations: [{ target: 'asw_service_9', type: 'composition' }],
  },
  {
    id: 'instance_70',
    name: 'Emergency Collision Avoidance AI',
    type: 'asw_component',
    framework: 'PyTorch',
    dependencies: ['fastai', 'numpy', 'torchvision'],
    createdAt: '2025-06-28T12:00:00.000Z',
    updatedAt: '2025-06-29T12:00:00.000Z',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    description:
      'An AI-based system designed to take evasive action and prevent collisions in real time.',
    relations: [{ target: 'asw_service_10', type: 'composition' }],
  },
  {
    id: 'asw_service_1',
    name: 'ADAS Perception Service',
    type: 'asw_service',
    functionality:
      'Processes sensor data and provides object detection and lane recognition services',
    createdAt: '2025-02-01T13:00:00.000Z',
    updatedAt: '2025-02-02T13:00:00.000Z',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    description:
      'A service that provides real-time object detection and lane recognition for ADAS applications.',
    relations: [],
  },
  {
    id: 'system_2',
    name: 'Next-Gen Autonomous Driving System',
    type: 'system',
    manufacturer: 'Nvidia',
    model: 'DriveOrin-X',
    softwareVersion: '3.5.1',
    hardwareVersion: 'RevD',
    createdAt: '2025-07-01T08:30:00.000Z',
    updatedAt: '2025-07-02T08:30:00.000Z',
    created_by: {
      name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
      id: '6714fe1a9c8a740026eb7f97',
    },
    description:
      'A high-performance compute system for L4+ autonomous driving.',
    relations: [{ target: 'sub_system_2', type: 'composition' }],
  },
  {
    id: 'sub_system_2',
    name: 'Autonomous Perception Module',
    type: 'sub_system',
    functionality: 'Sensor fusion and environmental perception',
    powerConsumption: 180,
    createdAt: '2025-07-01T09:00:00.000Z',
    updatedAt: '2025-07-02T09:00:00.000Z',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    description:
      'Processes data from cameras, LiDAR, and radar for object detection.',
    relations: [{ target: 'network_2', type: 'composition' }],
  },
  {
    id: 'network_2',
    name: 'V2X Communication Network',
    type: 'network',
    bandwidth: 2000,
    latency: 1,
    createdAt: '2025-07-01T10:00:00.000Z',
    updatedAt: '2025-07-02T10:00:00.000Z',
    created_by: {
      name: 'Slama Dirk (G7/PJ-DO-SPP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
      id: '6724a8cb3e09ac00279ed6f5',
    },
    description:
      'Dedicated short-range communication for vehicle-to-vehicle (V2V) and vehicle-to-infrastructure (V2I).',
    relations: [],
  },
  {
    id: 'compute_node_2',
    name: 'Neural Processing Unit',
    type: 'compute_node',
    cpuArchitecture: 'ARM Cortex-A78AE',
    ramSize: 32,
    storageSize: 512,
    createdAt: '2025-07-01T11:00:00.000Z',
    updatedAt: '2025-07-02T11:00:00.000Z',
    created_by: {
      name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
      id: '6714fe1a9c8a740026eb7f97',
    },
    description:
      'AI-based neural processing for real-time object classification and decision-making.',
    relations: [{ target: 'sw_stack_item_2', type: 'composition' }],
  },
  {
    id: 'sw_stack_item_2',
    name: 'Autonomous Driving OS',
    type: 'sw_stack_item',
    version: '5.2',
    vendor: 'QNX',
    createdAt: '2025-07-01T12:00:00.000Z',
    updatedAt: '2025-07-02T12:00:00.000Z',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    description:
      'Real-time OS optimized for safety-critical autonomous driving applications.',
    relations: [],
  },
  {
    id: 'system_3',
    name: 'Autonomous Vehicle Core System',
    type: 'system',
    manufacturer: 'Bosch',
    model: 'AVCS-2025',
    softwareVersion: '4.0',
    hardwareVersion: 'RevC',
    createdAt: '2025-07-01T08:30:00.000Z',
    updatedAt: '2025-07-02T08:30:00.000Z',
    created_by: {
      name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
      id: '6714fe1a9c8a740026eb7f97',
    },
    description:
      'The central control system for autonomous vehicle operations.',
    relations: [{ target: 'sub_system_3', type: 'composition' }],
  },
  {
    id: 'sub_system_3',
    name: 'Advanced Sensor Fusion Module',
    type: 'sub_system',
    functionality: 'Multi-sensor data integration',
    powerConsumption: 220,
    createdAt: '2025-07-01T09:00:00.000Z',
    updatedAt: '2025-07-02T09:00:00.000Z',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    description:
      'Integrates data from cameras, LiDAR, and radar for situational awareness.',
    relations: [{ target: 'network_3', type: 'composition' }],
  },
  {
    id: 'network_3',
    name: '5G Vehicle-to-Cloud Network',
    type: 'network',
    bandwidth: 5000,
    latency: 2,
    createdAt: '2025-07-01T10:00:00.000Z',
    updatedAt: '2025-07-02T10:00:00.000Z',
    created_by: {
      name: 'Slama Dirk (G7/PJ-DO-SPP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
      id: '6724a8cb3e09ac00279ed6f5',
    },
    description:
      'High-speed wireless network for cloud-connected vehicle services.',
    relations: [],
  },
  {
    id: 'compute_node_3',
    name: 'Edge AI Processing Unit',
    type: 'compute_node',
    cpuArchitecture: 'ARM Neoverse N1',
    ramSize: 64,
    storageSize: 1024,
    createdAt: '2025-07-01T11:00:00.000Z',
    updatedAt: '2025-07-02T11:00:00.000Z',
    created_by: {
      name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
      id: '6714fe1a9c8a740026eb7f97',
    },
    description:
      'Processes AI-based perception models in real-time at the vehicle edge.',
    relations: [],
  },
  {
    id: 'asw_domain_2',
    name: 'Vehicle Motion Planning',
    type: 'asw_domain',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    description:
      'Software domain covering path planning and trajectory control.',
    relations: [],
    createdAt: '2025-07-01T11:00:00.000Z',
    updatedAt: '2025-07-02T11:00:00.000Z',
  },
  {
    id: 'api_2',
    name: 'Vehicle State API',
    type: 'api',
    endpoint: '/vehicle/state',
    protocol: 'gRPC',
    created_by: {
      name: 'Slama Dirk (G7/PJ-DO-SPP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
      id: '6724a8cb3e09ac00279ed6f5',
    },
    description: 'API providing real-time vehicle state data.',
    relations: [],
    createdAt: '2025-07-01T11:00:00.000Z',
    updatedAt: '2025-07-02T11:00:00.000Z',
  },
  {
    id: 'sdv_system_artefact_2',
    name: 'Autonomous Vehicle Middleware',
    type: 'sdv_system_artefact',
    created_by: {
      name: 'Phan Thanh Hoang (MS/ETA-Hub MS/ETA-DAP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/209ec591-ccd1-48db-bb23-6437444e84d2.jpg',
      id: '6714fe1a9c8a740026eb7f97',
    },
    description: 'Middleware for real-time data flow in autonomous vehicles.',
    relations: [],
    createdAt: '2025-07-01T11:00:00.000Z',
    updatedAt: '2025-07-02T11:00:00.000Z',
  },
  {
    id: 'test_plan_2',
    name: 'AV Performance Testing',
    type: 'test_plan',
    created_by: {
      name: 'Luong Nguyen Nhan (MS/PJ-ETA-Innov)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/5a4e8b26-66a1-4cfd-9c22-c16150b17739.jpg',
      id: '6699fa83964f3f002f35ea03',
    },
    relations: [],
    createdAt: '2025-07-01T11:00:00.000Z',
    updatedAt: '2025-07-02T11:00:00.000Z',
    description:
      'A structured plan for verifying autonomous vehicle performance.',
  },
  {
    id: 'hara_2',
    name: 'L3+ Safety Risk Assessment',
    type: 'hara',
    created_by: {
      name: 'Slama Dirk (G7/PJ-DO-SPP)',
      image_file:
        'https://backend-core-dev.digital.auto/v2/file/data/autowrx/7d0ff6e1-e5a3-4cf9-bd43-549f8593dd47.jpg',
      id: '6724a8cb3e09ac00279ed6f5',
    },
    description: 'Hazard and risk analysis for Level 3+ automated driving.',
    relations: [],
    createdAt: '2025-07-01T11:00:00.000Z',
    updatedAt: '2025-07-02T11:00:00.000Z',
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
    item.typeData = types.find((type) => type.id === item.type)
  })
  return result
}
