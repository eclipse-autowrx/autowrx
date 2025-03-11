import { InventoryItem } from '@/types/inventory.type'
import { User } from '@/types/user.type'

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
      { $ref: 'base_object' },
      {
        type: 'object',
        properties: {
          domainScope: { type: 'string' },
        },
      },
    ],
    $id: 'asw_domain',
    title: 'ASW Domain',
    description: 'Represents a domain for application software (ASW).',
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
      { $ref: 'sdv_engineering_artefact' },
      {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The name of the stage.' },
          short_name: {
            type: 'string',
            description: 'An abbreviated name for the stage.',
          },
          icon: {
            type: 'string',
            format: 'uri',
            description: 'URL to the stage icon.',
          },
          prefix: {
            type: 'string',
            description: 'Prefix used for identifiers related to this stage.',
          },
          version: { type: 'string', description: 'Version of the stage.' },
          target_document_url: {
            type: 'string',
            format: 'uri',
            description: 'URL to the target documentation.',
          },
          state: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                version: {
                  type: 'string',
                  description: 'Version identifier of the state.',
                },
                cycle: {
                  type: 'object',
                  properties: {
                    'Infrastructure Maturity': {
                      type: 'integer',
                      minimum: 1,
                      maximum: 5,
                    },
                    'Functional Maturity': {
                      type: 'integer',
                      minimum: 1,
                      maximum: 5,
                    },
                    'Deployment Version': {
                      type: 'integer',
                      minimum: 1,
                      maximum: 5,
                    },
                    'Compliance Readiness': {
                      type: 'integer',
                      minimum: 1,
                      maximum: 5,
                    },
                    'Security Readiness': {
                      type: 'integer',
                      minimum: 1,
                      maximum: 5,
                    },
                    'Homologation Readiness': {
                      type: 'integer',
                      minimum: 1,
                      maximum: 5,
                    },
                  },
                  description:
                    'Readiness levels for various aspects of the system.',
                },
              },
              required: ['version', 'cycle'],
            },
            description:
              'Mapping of state identifiers to their respective versions and readiness levels.',
          },
        },
        required: ['name', 'version', 'state'],
      },
    ],
    $id: 'stage',
    title: 'Stage',
    description:
      'Defines a stage within an SDV system, associated with multiple states and maturity levels.',
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
      { $ref: 'sdv_engineering_artefact' },
      {
        type: 'object',
        properties: {
          regulationId: { type: 'string' },
          title: { type: 'string' },
          authority: {
            type: 'string',
            description:
              'The government body or organization enforcing this regulation.',
          },
          country: {
            type: 'string',
            description:
              'The country or region where the regulation is applicable.',
          },
          regulation_type: {
            type: 'string',
            enum: ['law', 'industry_rule', 'standard'],
            description:
              "The type of regulation, whether it's a law, an industry rule, or a standard.",
          },
          effective_date: {
            type: 'string',
            format: 'date',
            description: 'The date when the regulation comes into effect.',
          },
          expiry_date: {
            type: 'string',
            format: 'date',
            description:
              'The date when the regulation expires (if applicable).',
          },
          applicable_vehicle_categories: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'passenger',
                'commercial',
                'motorcycle',
                'off-road',
                'electric',
                'autonomous',
              ],
            },
            description:
              'The categories of vehicles affected by this regulation.',
          },
          reference_documents: {
            type: 'array',
            items: { type: 'string', format: 'uri' },
            description: 'Links to official regulation documents or websites.',
          },
        },
        required: [
          'regulationId',
          'title',
          'authority',
          'country',
          'regulation_type',
          'effective_date',
        ],
      },
    ],
    $id: 'regulation',
    title: 'Regulation',
    description:
      'A legal or industry regulation related to the SDV system, defining rules that depend on the country.',
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
          description: { type: 'string' },
          preconditions: { type: 'string' },
          test_steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                step_number: { type: 'integer' },
                action: { type: 'string' },
                expected_result: { type: 'string' },
              },
              required: ['step_number', 'action', 'expected_result'],
            },
          },
          requirements_coverage: {
            type: 'array',
            items: { type: 'string' },
          },
          pass_criteria: { type: 'string' },
        },
        required: ['name', 'test_steps'],
      },
    ],
    $id: 'test_case',
    title: 'Test Case',
    description:
      'Defines an individual test scenario with steps and expected outcomes, linked to multiple test runs.',
  },
  {
    allOf: [
      { $ref: 'sdv_engineering_artefact' },
      {
        type: 'object',
        properties: {
          executed_by: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['passed', 'failed', 'skipped'] },
          logs: { type: 'string' },
        },
        required: ['name', 'executed_by', 'timestamp', 'status'],
      },
    ],
    $id: 'test_run',
    title: 'Test Run',
    description:
      'Represents a test execution instance, storing results and logs.',
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
          description: { type: 'string' },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
          },
          status: {
            type: 'string',
            enum: ['draft', 'approved', 'implemented', 'verified', 'rejected'],
          },
          verification_method: {
            type: 'string',
            enum: ['analysis', 'review', 'test', 'demonstration'],
          },
          related_artifacts: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: [
          'name',
          'description',
          'priority',
          'status',
          'verification_method',
        ],
      },
    ],
    $id: 'requirement',
    title: 'Requirement',
    description:
      'Defines a single requirement within a requirements group, with priority, status, and verification method.',
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

export const relations = [
  {
    source: 'sdv_engineering_artefact',
    to: 'sdv_system_artefact',
    type: 'governs',
    multiplicity: 'one-to-many',
  },
  {
    source: 'asw_component',
    to: 'stage',
    type: 'associates',
    multiplicity: 'one-to-many',
  },
  {
    source: 'stage',
    to: 'system',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'vehicle_model',
    to: 'system',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'requirements_group',
    to: 'requirements_group',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'requirements_group',
    to: 'requirement',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'test_plan',
    target: 'test_case',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'test_case',
    target: 'test_run',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'requirements_group',
    target: 'requirement',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
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
  {
    source: 'asw_component',
    target: 'sw_stack_item',
    type: 'deployed_on',
    multiplicity: 'one-to-one',
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

export const instances: InventoryItem[] = [
  // Passenger Welcome Sequence
  {
    id: 'inst_vehicle_model',
    type: 'vehicle_model',
    data: {
      name: 'NextGen Auto Model X',
      description:
        'High-end vehicle model designed for multiple export markets (Germany, China, USA, India, UK).',
      createdAt: '2025-03-11T10:00:00Z',
      updatedAt: '2025-03-11T12:00:00Z',
    },
  },
  {
    id: 'inst_asw_domain',
    type: 'asw_domain',
    data: {
      name: 'Passenger Welcome Sequence',
      description:
        'Application software domain that implements the passenger welcome flow based on driver proximity and cloud preferences.',
      domainScope:
        'Driver presence, ambient light, door safety, and cloud-synced personalization.',
      createdAt: '2025-03-11T10:05:00Z',
      updatedAt: '2025-03-11T12:05:00Z',
    },
  },
  {
    id: 'inst_asw_component_1',
    type: 'asw_component',
    data: {
      name: 'Display Manager',
      description:
        'Manages all dashboard and ambient display outputs for the welcome sequence.',
      componentType: 'AppLogic',
      framework: 'React Automotive Framework',
      dependencies: ['Cloud Sync Module'],
      createdAt: '2025-03-11T10:10:00Z',
      updatedAt: '2025-03-11T12:10:00Z',
    },
  },
  {
    id: 'inst_asw_component_2',
    type: 'asw_component',
    data: {
      name: 'Door Controller',
      description:
        'Controls secure door operations including open/close, lock/unlock, ensuring safety and permission checks.',
      componentType: 'StateEngine',
      framework: 'Automotive Safety Stack',
      dependencies: ['Sensor Array'],
      createdAt: '2025-03-11T10:12:00Z',
      updatedAt: '2025-03-11T12:12:00Z',
    },
  },
  {
    id: 'inst_asw_component_3',
    type: 'asw_component',
    data: {
      name: 'Light Sequencer',
      description:
        'Orchestrates the exterior and ambient light sequences to welcome the driver.',
      componentType: 'Simulation',
      framework: 'LED Matrix Suite',
      dependencies: ['Display Manager'],
      createdAt: '2025-03-11T10:14:00Z',
      updatedAt: '2025-03-11T12:14:00Z',
    },
  },
  {
    id: 'inst_asw_component_4',
    type: 'asw_component',
    data: {
      name: 'HVAC Adjuster',
      description:
        'Adjusts in-vehicle climate based on driver preferences from the cloud.',
      componentType: 'Other',
      framework: 'ThermoControl v2',
      dependencies: ['Cloud Sync Module'],
      createdAt: '2025-03-11T10:16:00Z',
      updatedAt: '2025-03-11T12:16:00Z',
    },
  },
  {
    id: 'inst_asw_component_5',
    type: 'asw_component',
    data: {
      name: 'Seat Adjuster',
      description:
        'Configures seat positions automatically to match driver profiles.',
      componentType: 'AppLogic',
      framework: 'ErgoDrive',
      dependencies: ['Door Controller'],
      createdAt: '2025-03-11T10:18:00Z',
      updatedAt: '2025-03-11T12:18:00Z',
    },
  },
  {
    id: 'inst_asw_component_6',
    type: 'asw_component',
    data: {
      name: 'Cloud Sync Module',
      description:
        'Handles retrieval of driver preferences and vehicle configuration updates from the cloud.',
      componentType: 'AI-Inference',
      framework: 'CloudLink v3',
      dependencies: ['Light Sequencer'],
      createdAt: '2025-03-11T10:20:00Z',
      updatedAt: '2025-03-11T12:20:00Z',
    },
  },
  {
    id: 'inst_asw_service_1_1',
    type: 'asw_service',
    data: {
      name: 'Render Dashboard',
      description: 'Service to render the main vehicle dashboard.',
      serviceInterface: 'HTTP API',
      functionality: 'Display vehicle status and ambient light configuration.',
      createdAt: '2025-03-11T10:22:00Z',
      updatedAt: '2025-03-11T12:22:00Z',
    },
  },
  {
    id: 'inst_asw_service_1_2',
    type: 'asw_service',
    data: {
      name: 'Update Ambient Light',
      description:
        'Service to adjust cabin and exterior lighting during the welcome sequence.',
      serviceInterface: 'MQTT',
      functionality: 'Control LED matrix and ambient sensors.',
      createdAt: '2025-03-11T10:23:00Z',
      updatedAt: '2025-03-11T12:23:00Z',
    },
  },
  {
    id: 'inst_asw_service_1_3',
    type: 'asw_service',
    data: {
      name: 'Refresh Display',
      description: 'Service to refresh display outputs in case of errors.',
      serviceInterface: 'WebSocket',
      functionality: 'Ensure real-time updates to the dashboard.',
      createdAt: '2025-03-11T10:24:00Z',
      updatedAt: '2025-03-11T12:24:00Z',
    },
  },
  {
    id: 'inst_asw_service_1_4',
    type: 'asw_service',
    data: {
      name: 'Diagnostic Report',
      description:
        'Service to perform a quick diagnostic check of display outputs.',
      serviceInterface: 'REST',
      functionality: 'Trigger diagnostic routines and report errors.',
      createdAt: '2025-03-11T10:25:00Z',
      updatedAt: '2025-03-11T12:25:00Z',
    },
  },
  {
    id: 'inst_system_onboard',
    type: 'system',
    data: {
      name: 'On-Board Vehicle Control',
      description: 'On-board system responsible for in-vehicle controls.',
      systemType: 'On-Board',
      manufacturer: 'NextGen Motors',
      model: 'Model X OB',
      createdAt: '2025-03-11T10:30:00Z',
      updatedAt: '2025-03-11T12:30:00Z',
    },
  },
  {
    id: 'inst_system_offboard',
    type: 'system',
    data: {
      name: 'Off-Board Service Gateway',
      description:
        'Off-board system handling cloud connectivity and remote updates.',
      systemType: 'Off-Board',
      manufacturer: 'NextGen Motors',
      model: 'Model X OB Offboard',
      createdAt: '2025-03-11T10:32:00Z',
      updatedAt: '2025-03-11T12:32:00Z',
    },
  },
  {
    id: 'inst_subsystem_onboard_1',
    type: 'sub_system',
    data: {
      name: 'Smartphone Interface',
      description:
        'On-board subsystem interfacing with the driver’s mobile app.',
      subSystemType: 'HMI',
      powerConsumption: 15,
      createdAt: '2025-03-11T10:35:00Z',
      updatedAt: '2025-03-11T12:35:00Z',
    },
  },
  {
    id: 'inst_subsystem_onboard_2',
    type: 'sub_system',
    data: {
      name: 'Cloud Connectivity',
      description:
        'On-board connection module to access remote driver profiles.',
      subSystemType: 'Other',
      powerConsumption: 20,
      createdAt: '2025-03-11T10:37:00Z',
      updatedAt: '2025-03-11T12:37:00Z',
    },
  },
  {
    id: 'inst_subsystem_offboard_1',
    type: 'sub_system',
    data: {
      name: 'SDV Runtime',
      description:
        'Core off-board runtime environment for executing SDV processes.',
      subSystemType: 'Other',
      powerConsumption: 100,
      createdAt: '2025-03-11T10:40:00Z',
      updatedAt: '2025-03-11T12:40:00Z',
    },
  },
  {
    id: 'inst_subsystem_offboard_2',
    type: 'sub_system',
    data: {
      name: 'Embedded Control',
      description: 'Handles embedded computing for off-board services.',
      subSystemType: 'Other',
      powerConsumption: 80,
      createdAt: '2025-03-11T10:42:00Z',
      updatedAt: '2025-03-11T12:42:00Z',
    },
  },
  {
    id: 'inst_subsystem_offboard_3',
    type: 'sub_system',
    data: {
      name: 'Sensors Array',
      description:
        'Collects environmental and vehicle data from multiple sensor nodes.',
      subSystemType: 'Other',
      powerConsumption: 50,
      createdAt: '2025-03-11T10:44:00Z',
      updatedAt: '2025-03-11T12:44:00Z',
    },
  },
  {
    id: 'inst_subsystem_offboard_4',
    type: 'sub_system',
    data: {
      name: 'Actuators Network',
      description: 'Manages off-board actuator signals and control.',
      subSystemType: 'Other',
      powerConsumption: 60,
      createdAt: '2025-03-11T10:46:00Z',
      updatedAt: '2025-03-11T12:46:00Z',
    },
  },
  {
    id: 'inst_stage_1',
    type: 'stage',
    data: {
      name: 'Vehicle MockUp',
      description: 'Early physical prototype stage of the vehicle.',
      version: '1.0',
      state: {
        preliminary: {
          version: '1.0',
          cycle: {
            'Infrastructure Maturity': 2,
            'Functional Maturity': 2,
            'Deployment Version': 1,
            'Compliance Readiness': 1,
            'Security Readiness': 1,
            'Homologation Readiness': 1,
          },
        },
      },
      createdAt: '2025-03-11T10:50:00Z',
      updatedAt: '2025-03-11T12:50:00Z',
    },
  },
  {
    id: 'inst_stage_2',
    type: 'stage',
    data: {
      name: 'Virtual Vehicle',
      description: 'Digital simulation stage representing vehicle behavior.',
      version: '2.0',
      state: {
        simulation: {
          version: '2.0',
          cycle: {
            'Infrastructure Maturity': 3,
            'Functional Maturity': 3,
            'Deployment Version': 2,
            'Compliance Readiness': 2,
            'Security Readiness': 2,
            'Homologation Readiness': 2,
          },
        },
      },
      createdAt: '2025-03-11T10:55:00Z',
      updatedAt: '2025-03-11T12:55:00Z',
    },
  },
  {
    id: 'inst_stage_3',
    type: 'stage',
    data: {
      name: 'Desktop Demonstrator',
      description:
        'Stage where vehicle functionality is demonstrated via desktop simulation.',
      version: '3.0',
      state: {
        demo: {
          version: '3.0',
          cycle: {
            'Infrastructure Maturity': 4,
            'Functional Maturity': 4,
            'Deployment Version': 3,
            'Compliance Readiness': 3,
            'Security Readiness': 3,
            'Homologation Readiness': 3,
          },
        },
      },
      createdAt: '2025-03-11T11:00:00Z',
      updatedAt: '2025-03-11T13:00:00Z',
    },
  },
  {
    id: 'inst_stage_4',
    type: 'stage',
    data: {
      name: 'Test Vehicle',
      description:
        'Final stage – fully instrumented vehicle used for comprehensive road testing.',
      version: '4.0',
      state: {
        final: {
          version: '4.0',
          cycle: {
            'Infrastructure Maturity': 5,
            'Functional Maturity': 5,
            'Deployment Version': 4,
            'Compliance Readiness': 4,
            'Security Readiness': 4,
            'Homologation Readiness': 4,
          },
        },
      },
      createdAt: '2025-03-11T11:05:00Z',
      updatedAt: '2025-03-11T13:05:00Z',
    },
  },
  {
    id: 'inst_req_group_1',
    type: 'requirements_group',
    data: {
      name: 'Safety Requirements',
      groupScope: 'Vehicle safety and secure door operations',
      relatedTo: 'Door Controller, HARA',
      createdAt: '2025-03-11T11:10:00Z',
      updatedAt: '2025-03-11T13:10:00Z',
    },
  },
  {
    id: 'inst_requirement_1_1',
    type: 'requirement',
    data: {
      name: 'Emergency Door Lock',
      description:
        'Doors must automatically lock when safety sensors detect a hazard.',
      priority: 'critical',
      status: 'approved',
      verification_method: 'test',
      createdAt: '2025-03-11T11:12:00Z',
      updatedAt: '2025-03-11T13:12:00Z',
    },
  },
  {
    id: 'inst_requirement_1_2',
    type: 'requirement',
    data: {
      name: 'Door Open Safety Check',
      description:
        'Ensure no obstacles exist before initiating door open sequence.',
      priority: 'high',
      status: 'approved',
      verification_method: 'review',
      createdAt: '2025-03-11T11:14:00Z',
      updatedAt: '2025-03-11T13:14:00Z',
    },
  },
  {
    id: 'inst_requirement_1_3',
    type: 'requirement',
    data: {
      name: 'Sensor Data Fusion',
      description:
        'All sensor inputs must be fused for an accurate safety check.',
      priority: 'medium',
      status: 'approved',
      verification_method: 'analysis',
      createdAt: '2025-03-11T11:16:00Z',
      updatedAt: '2025-03-11T13:16:00Z',
    },
  },
  {
    id: 'inst_requirement_1_4',
    type: 'requirement',
    data: {
      name: 'Automatic Brake Override',
      description: 'Brake override must engage if a door is obstructed.',
      priority: 'critical',
      status: 'approved',
      verification_method: 'demonstration',
      createdAt: '2025-03-11T11:18:00Z',
      updatedAt: '2025-03-11T13:18:00Z',
    },
  },
  {
    id: 'inst_req_group_2',
    type: 'requirements_group',
    data: {
      name: 'Performance Requirements',
      groupScope: 'Response times and system throughput',
      relatedTo: 'Cloud Sync Module, SDV Runtime',
      createdAt: '2025-03-11T11:20:00Z',
      updatedAt: '2025-03-11T13:20:00Z',
    },
  },
  {
    id: 'inst_requirement_2_1',
    type: 'requirement',
    data: {
      name: 'Low Latency Communication',
      description: 'System response must be under 50ms for door commands.',
      priority: 'high',
      status: 'approved',
      verification_method: 'test',
      createdAt: '2025-03-11T11:22:00Z',
      updatedAt: '2025-03-11T13:22:00Z',
    },
  },
  {
    id: 'inst_requirement_2_2',
    type: 'requirement',
    data: {
      name: 'High Throughput Data Sync',
      description:
        'Data exchange with the cloud should support high volume under peak loads.',
      priority: 'medium',
      status: 'approved',
      verification_method: 'analysis',
      createdAt: '2025-03-11T11:24:00Z',
      updatedAt: '2025-03-11T13:24:00Z',
    },
  },
  {
    id: 'inst_requirement_2_3',
    type: 'requirement',
    data: {
      name: 'Efficient Resource Usage',
      description:
        'Ensure CPU and memory use are within acceptable limits under load.',
      priority: 'medium',
      status: 'approved',
      verification_method: 'review',
      createdAt: '2025-03-11T11:26:00Z',
      updatedAt: '2025-03-11T13:26:00Z',
    },
  },
  {
    id: 'inst_requirement_2_4',
    type: 'requirement',
    data: {
      name: 'Rapid Cloud Response',
      description: 'Cloud services must respond within defined SLA limits.',
      priority: 'high',
      status: 'approved',
      verification_method: 'test',
      createdAt: '2025-03-11T11:28:00Z',
      updatedAt: '2025-03-11T13:28:00Z',
    },
  },
  {
    id: 'inst_req_group_3',
    type: 'requirements_group',
    data: {
      name: 'User Experience Requirements',
      groupScope: 'Interface, personalization, and overall UX',
      relatedTo: 'Display Manager, Seat Adjuster',
      createdAt: '2025-03-11T11:30:00Z',
      updatedAt: '2025-03-11T13:30:00Z',
    },
  },
  {
    id: 'inst_requirement_3_1',
    type: 'requirement',
    data: {
      name: 'Customizable Dashboard Layout',
      description: 'Allow the driver to choose dashboard widget layouts.',
      priority: 'low',
      status: 'approved',
      verification_method: 'demonstration',
      createdAt: '2025-03-11T11:32:00Z',
      updatedAt: '2025-03-11T13:32:00Z',
    },
  },
  {
    id: 'inst_requirement_3_2',
    type: 'requirement',
    data: {
      name: 'Personalized Seat Memory',
      description:
        'Seats must recall and adjust to individual driver profiles.',
      priority: 'medium',
      status: 'approved',
      verification_method: 'test',
      createdAt: '2025-03-11T11:34:00Z',
      updatedAt: '2025-03-11T13:34:00Z',
    },
  },
  {
    id: 'inst_requirement_3_3',
    type: 'requirement',
    data: {
      name: 'Adaptive Ambient Lighting',
      description:
        'Lighting adjusts based on external conditions and driver preferences.',
      priority: 'medium',
      status: 'approved',
      verification_method: 'review',
      createdAt: '2025-03-11T11:36:00Z',
      updatedAt: '2025-03-11T13:36:00Z',
    },
  },
  {
    id: 'inst_requirement_3_4',
    type: 'requirement',
    data: {
      name: 'Intuitive UI Feedback',
      description:
        'Provide visual and haptic feedback for all touch interactions.',
      priority: 'low',
      status: 'approved',
      verification_method: 'demonstration',
      createdAt: '2025-03-11T11:38:00Z',
      updatedAt: '2025-03-11T13:38:00Z',
    },
  },
  {
    id: 'inst_regulation_1',
    type: 'regulation',
    data: {
      regulationId: 'EU-REG-2025-001',
      name: 'European Safety Standard',
      authority: 'European Commission',
      country: 'Germany',
      regulation_type: 'law',
      effective_date: '2025-01-01',
      expiry_date: '2030-01-01',
      applicable_vehicle_categories: ['passenger', 'electric'],
      reference_documents: ['https://europa.eu/regulations/safety'],
      createdAt: '2025-03-11T11:40:00Z',
      updatedAt: '2025-03-11T13:40:00Z',
    },
  },
  {
    id: 'inst_regulation_2',
    type: 'regulation',
    data: {
      regulationId: 'USA-STD-2025-007',
      name: 'US Federal Automotive Standard',
      authority: 'NHTSA',
      country: 'USA',
      regulation_type: 'standard',
      effective_date: '2025-02-01',
      expiry_date: '',
      applicable_vehicle_categories: ['passenger', 'commercial'],
      reference_documents: ['https://nhtsa.gov/standards'],
      createdAt: '2025-03-11T11:42:00Z',
      updatedAt: '2025-03-11T13:42:00Z',
    },
  },
  {
    id: 'inst_test_plan',
    type: 'test_plan',
    data: {
      name: 'Passenger Welcome Sequence Test Plan',
      objective:
        'Validate the safe and personalized execution of the passenger welcome sequence',
      scope:
        'Integration of ASW components, safety checks, and cloud retrieval',
      criteria: 'All test cases must pass with no critical failures',
      createdAt: '2025-03-11T11:50:00Z',
      updatedAt: '2025-03-11T13:50:00Z',
    },
  },
  {
    id: 'inst_test_case_1',
    type: 'test_case',
    data: {
      name: 'Test Door Safety and Operation',
      description:
        'Verify that the door controller properly checks for obstacles and permissions before operation.',
      test_steps: [
        {
          step_number: 1,
          action: 'Activate door open sequence via mobile app',
          expected_result:
            'System verifies safety sensors and grants permission.',
        },
        {
          step_number: 2,
          action: 'Observe door movement',
          expected_result: 'Door opens securely without collision.',
        },
      ],
      createdAt: '2025-03-11T11:55:00Z',
      updatedAt: '2025-03-11T13:55:00Z',
    },
  },
  {
    id: 'inst_test_run_1_1',
    type: 'test_run',
    data: {
      name: 'TC1 Run 1',
      executed_by: 'On-board Test System',
      timestamp: '2025-03-11T12:00:00Z',
      status: 'passed',
      logs: 'All safety sensors and door operations validated.',
      createdAt: '2025-03-11T12:00:00Z',
      updatedAt: '2025-03-11T12:05:00Z',
    },
  },
  {
    id: 'inst_test_run_1_2',
    type: 'test_run',
    data: {
      name: 'TC1 Run 2',
      executed_by: 'Lab Simulation Suite',
      timestamp: '2025-03-11T12:10:00Z',
      status: 'failed',
      logs: 'Test failed due to sensor timeout error during door verification.',
      createdAt: '2025-03-11T12:10:00Z',
      updatedAt: '2025-03-11T12:15:00Z',
    },
  },
  {
    id: 'inst_test_case_2',
    type: 'test_case',
    data: {
      name: 'Test Cloud Sync and UI Feedback',
      description:
        'Validate that driver preferences are properly fetched and applied with appropriate UI feedback.',
      test_steps: [
        {
          step_number: 1,
          action: 'Trigger cloud sync via welcome sequence',
          expected_result:
            'Cloud preferences are retrieved and UI updates accordingly.',
        },
        {
          step_number: 2,
          action: 'Simulate network delay',
          expected_result: 'System displays error and retries the operation.',
        },
      ],
      createdAt: '2025-03-11T12:20:00Z',
      updatedAt: '2025-03-11T12:25:00Z',
    },
  },
  {
    id: 'inst_test_run_2_1',
    type: 'test_run',
    data: {
      name: 'TC2 Run 1',
      executed_by: 'Cloud Test Agent',
      timestamp: '2025-03-11T12:30:00Z',
      status: 'passed',
      logs: 'Cloud sync and UI feedback functioned as expected.',
      createdAt: '2025-03-11T12:30:00Z',
      updatedAt: '2025-03-11T12:35:00Z',
    },
  },
  {
    id: 'inst_test_run_2_2',
    type: 'test_run',
    data: {
      name: 'TC2 Run 2',
      executed_by: 'Lab Simulation Suite',
      timestamp: '2025-03-11T12:40:00Z',
      status: 'failed',
      logs: 'Test run encountered a cloud sync timeout.',
      createdAt: '2025-03-11T12:40:00Z',
      updatedAt: '2025-03-11T12:45:00Z',
    },
  },
  {
    id: 'inst_test_case_3',
    type: 'test_case',
    data: {
      name: 'Test Light Sequence and Display',
      description:
        'Ensure that the light sequencer and display manager coordinate correctly during the welcome sequence.',
      test_steps: [
        {
          step_number: 1,
          action: 'Initiate light sequence',
          expected_result: 'Ambient lights and display adjust in sync.',
        },
        {
          step_number: 2,
          action: 'Monitor for error messages',
          expected_result: 'No critical errors reported in logs.',
        },
      ],
      createdAt: '2025-03-11T12:50:00Z',
      updatedAt: '2025-03-11T12:55:00Z',
    },
  },
  {
    id: 'inst_test_run_3_1',
    type: 'test_run',
    data: {
      name: 'TC3 Run 1',
      executed_by: 'On-board Test System',
      timestamp: '2025-03-11T13:00:00Z',
      status: 'passed',
      logs: 'Light and display coordination met expectations.',
      createdAt: '2025-03-11T13:00:00Z',
      updatedAt: '2025-03-11T13:05:00Z',
    },
  },
  {
    id: 'inst_test_run_3_2',
    type: 'test_run',
    data: {
      name: 'TC3 Run 2',
      executed_by: 'Lab Simulation Suite',
      timestamp: '2025-03-11T13:10:00Z',
      status: 'failed',
      logs: 'Intermittent display lag observed during light transition.',
      createdAt: '2025-03-11T13:10:00Z',
      updatedAt: '2025-03-11T13:15:00Z',
    },
  },
  {
    id: 'inst_asw_service_2_1',
    type: 'asw_service',
    data: {
      name: 'Door Safety Validator',
      description:
        'Service that verifies door sensor data and safety protocols before any door operation.',
      serviceInterface: 'REST',
      functionality:
        'Checks sensor inputs and ensures no hazards are present before allowing door activation.',
      createdAt: '2025-03-11T10:26:00Z',
      updatedAt: '2025-03-11T10:27:00Z',
    },
  },
  {
    id: 'inst_asw_service_2_2',
    type: 'asw_service',
    data: {
      name: 'Lock Command Dispatcher',
      description:
        'Dispatches and monitors door locking commands to ensure secure closure.',
      serviceInterface: 'MQTT',
      functionality:
        'Transmits lock/unlock signals and confirms door status with real-time feedback.',
      createdAt: '2025-03-11T10:28:00Z',
      updatedAt: '2025-03-11T10:29:00Z',
    },
  },
  {
    id: 'inst_asw_service_2_3',
    type: 'asw_service',
    data: {
      name: 'Permission Checker',
      description:
        'Validates driver permissions and vehicle status before door operations.',
      serviceInterface: 'WebSocket',
      functionality:
        'Integrates with vehicle security systems to approve door commands.',
      createdAt: '2025-03-11T10:30:00Z',
      updatedAt: '2025-03-11T10:31:00Z',
    },
  },
  {
    id: 'inst_asw_service_2_4',
    type: 'asw_service',
    data: {
      name: 'Door Status Monitor',
      description:
        'Monitors door movement and confirms secure open/close status in real time.',
      serviceInterface: 'REST',
      functionality:
        'Continuously tracks door sensor data to flag any irregularities.',
      createdAt: '2025-03-11T10:32:00Z',
      updatedAt: '2025-03-11T10:33:00Z',
    },
  },
  {
    id: 'inst_asw_service_3_1',
    type: 'asw_service',
    data: {
      name: 'Exterior Light Controller',
      description:
        'Manages dynamic patterns for the vehicle’s exterior light matrix during the welcome sequence.',
      serviceInterface: 'MQTT',
      functionality:
        'Adjusts light intensity and pattern based on sensor input and ambient conditions.',
      createdAt: '2025-03-11T10:34:00Z',
      updatedAt: '2025-03-11T10:35:00Z',
    },
  },
  {
    id: 'inst_asw_service_3_2',
    type: 'asw_service',
    data: {
      name: 'Ambient Light Adjuster',
      description:
        'Modulates interior ambient lighting based on driver preferences and environmental cues.',
      serviceInterface: 'WebSocket',
      functionality:
        'Calibrates indoor lighting levels to complement exterior sequences.',
      createdAt: '2025-03-11T10:36:00Z',
      updatedAt: '2025-03-11T10:37:00Z',
    },
  },
  {
    id: 'inst_asw_service_3_3',
    type: 'asw_service',
    data: {
      name: 'Brightness Regulator',
      description:
        'Ensures that both exterior and ambient light outputs maintain optimal brightness levels.',
      serviceInterface: 'REST',
      functionality:
        'Dynamically regulates light intensity to match vehicle and environmental states.',
      createdAt: '2025-03-11T10:38:00Z',
      updatedAt: '2025-03-11T10:39:00Z',
    },
  },
  {
    id: 'inst_asw_service_3_4',
    type: 'asw_service',
    data: {
      name: 'Color Pattern Manager',
      description:
        'Orchestrates complex color patterns and transitions during the welcome light sequence.',
      serviceInterface: 'MQTT',
      functionality:
        'Manages predefined color sequences and adapts patterns based on time-of-day and weather.',
      createdAt: '2025-03-11T10:40:00Z',
      updatedAt: '2025-03-11T10:41:00Z',
    },
  },
  {
    id: 'inst_asw_service_4_1',
    type: 'asw_service',
    data: {
      name: 'Climate Controller',
      description:
        'Coordinates cabin temperature regulation by interfacing with HVAC sensors.',
      serviceInterface: 'REST',
      functionality:
        'Collects temperature data and issues commands to balance the cabin climate.',
      createdAt: '2025-03-11T10:42:00Z',
      updatedAt: '2025-03-11T10:43:00Z',
    },
  },
  {
    id: 'inst_asw_service_4_2',
    type: 'asw_service',
    data: {
      name: 'Temperature Adjuster',
      description:
        'Fine-tunes temperature settings to meet the driver’s preset preferences.',
      serviceInterface: 'WebSocket',
      functionality:
        'Continuously adjusts the HVAC output for precise cabin comfort.',
      createdAt: '2025-03-11T10:44:00Z',
      updatedAt: '2025-03-11T10:45:00Z',
    },
  },
  {
    id: 'inst_asw_service_4_3',
    type: 'asw_service',
    data: {
      name: 'Airflow Monitor',
      description:
        'Monitors and reports the airflow distribution across the cabin.',
      serviceInterface: 'REST',
      functionality:
        'Ensures air is evenly distributed and flags deviations for corrective action.',
      createdAt: '2025-03-11T10:46:00Z',
      updatedAt: '2025-03-11T10:47:00Z',
    },
  },
  {
    id: 'inst_asw_service_4_4',
    type: 'asw_service',
    data: {
      name: 'Fan Speed Optimizer',
      description:
        'Adjusts fan speeds dynamically based on current airflow and temperature readings.',
      serviceInterface: 'MQTT',
      functionality:
        'Optimizes fan output to ensure energy efficiency and comfort.',
      createdAt: '2025-03-11T10:48:00Z',
      updatedAt: '2025-03-11T10:49:00Z',
    },
  },
  {
    id: 'inst_asw_service_5_1',
    type: 'asw_service',
    data: {
      name: 'Seat Memory Loader',
      description:
        'Retrieves and loads driver-specific seat memory configurations.',
      serviceInterface: 'REST',
      functionality:
        'Interfaces with cloud profiles to recall optimal seating positions.',
      createdAt: '2025-03-11T10:50:00Z',
      updatedAt: '2025-03-11T10:51:00Z',
    },
  },
  {
    id: 'inst_asw_service_5_2',
    type: 'asw_service',
    data: {
      name: 'Position Calibration',
      description:
        'Calibrates seat adjustment motors to ensure precise positioning.',
      serviceInterface: 'WebSocket',
      functionality:
        'Monitors motor feedback and fine-tunes adjustments in real time.',
      createdAt: '2025-03-11T10:52:00Z',
      updatedAt: '2025-03-11T10:53:00Z',
    },
  },
  {
    id: 'inst_asw_service_5_3',
    type: 'asw_service',
    data: {
      name: 'Motion Smoothing',
      description:
        'Ensures smooth transitions during seat adjustments to avoid abrupt movements.',
      serviceInterface: 'REST',
      functionality:
        'Applies gradual control algorithms to seat actuator signals.',
      createdAt: '2025-03-11T10:54:00Z',
      updatedAt: '2025-03-11T10:55:00Z',
    },
  },
  {
    id: 'inst_asw_service_5_4',
    type: 'asw_service',
    data: {
      name: 'Comfort Analyzer',
      description:
        'Analyzes real-time feedback to optimize seating comfort during adjustments.',
      serviceInterface: 'MQTT',
      functionality:
        'Monitors sensor data from the seat and adjusts profiles dynamically.',
      createdAt: '2025-03-11T10:56:00Z',
      updatedAt: '2025-03-11T10:57:00Z',
    },
  },
  {
    id: 'inst_asw_service_6_1',
    type: 'asw_service',
    data: {
      name: 'Driver Profile Fetcher',
      description:
        'Fetches the latest driver profiles and preferences from the cloud.',
      serviceInterface: 'REST',
      functionality:
        'Ensures that the vehicle is updated with the most current driver configuration data.',
      createdAt: '2025-03-11T10:58:00Z',
      updatedAt: '2025-03-11T10:59:00Z',
    },
  },
  {
    id: 'inst_asw_service_6_2',
    type: 'asw_service',
    data: {
      name: 'Preference Updater',
      description:
        'Updates vehicle configurations based on the latest driver preferences.',
      serviceInterface: 'WebSocket',
      functionality:
        'Pushes updated settings to various vehicle subsystems after cloud sync.',
      createdAt: '2025-03-11T11:00:00Z',
      updatedAt: '2025-03-11T11:01:00Z',
    },
  },
  {
    id: 'inst_asw_service_6_3',
    type: 'asw_service',
    data: {
      name: 'Data Integrity Checker',
      description:
        'Verifies that data exchanged with the cloud remains accurate and untampered.',
      serviceInterface: 'REST',
      functionality:
        'Performs checksum and validation tests on incoming and outgoing data.',
      createdAt: '2025-03-11T11:02:00Z',
      updatedAt: '2025-03-11T11:03:00Z',
    },
  },
  {
    id: 'inst_asw_service_6_4',
    type: 'asw_service',
    data: {
      name: 'Cloud Communication Monitor',
      description:
        'Monitors the communication channel between the vehicle and cloud services.',
      serviceInterface: 'MQTT',
      functionality:
        'Detects latency or errors in the cloud connectivity and triggers alerts.',
      createdAt: '2025-03-11T11:04:00Z',
      updatedAt: '2025-03-11T11:05:00Z',
    },
  },
  // Passenger Welcome Sequence
  // {
  //   id: 'artefact-1',
  //   type: 'artefact',
  //   data: {
  //     name: 'SDV Artefact - Firmware Release',
  //     description: 'Firmware release package for vehicle control modules.',
  //     version: 'v1.0.0',
  //     createdAt: '2025-03-10T12:20:00Z',
  //     updatedAt: '2025-03-10T12:20:00Z',
  //   },
  // },
  // {
  //   id: 'artefact-2',
  //   type: 'artefact',
  //   data: {
  //     name: 'SDV Artefact - Calibration Data',
  //     description: 'Vehicle sensor calibration data for ADAS systems.',
  //     version: 'v1.1.2',
  //     createdAt: '2025-03-10T12:25:00Z',
  //     updatedAt: '2025-03-10T12:25:00Z',
  //   },
  // },
  // {
  //   id: 'tool_artefact-1',
  //   type: 'tool_artefact',
  //   data: {
  //     name: 'Vehicle Simulation Tool',
  //     description:
  //       'A simulation tool used for virtual vehicle testing and HIL integration.',
  //     version: 'v2.0',
  //     toolType: 'Simulation',
  //     vendor: 'SimuAuto Inc.',
  //     createdAt: '2025-03-10T12:30:00Z',
  //     updatedAt: '2025-03-10T12:30:00Z',
  //   },
  // },
  // {
  //   id: 'tool_artefact-2',
  //   type: 'tool_artefact',
  //   data: {
  //     name: 'SDV Testing Suite',
  //     description:
  //       'Comprehensive testing tool for verifying vehicle control algorithms.',
  //     version: 'v2.1',
  //     toolType: 'Testing',
  //     vendor: 'AutoTest Solutions',
  //     createdAt: '2025-03-10T12:35:00Z',
  //     updatedAt: '2025-03-10T12:35:00Z',
  //   },
  // },
  // {
  //   id: 'sdv_system_artefact-1',
  //   type: 'sdv_system_artefact',
  //   data: {
  //     name: 'ADAS Control System Artefact',
  //     description:
  //       'Artefact representing the overall Advanced Driver Assistance System.',
  //     version: 'v3.0',
  //     domain: 'ADAS',
  //     createdAt: '2025-03-10T12:40:00Z',
  //     updatedAt: '2025-03-10T12:40:00Z',
  //   },
  // },
  // {
  //   id: 'sdv_system_artefact-2',
  //   type: 'sdv_system_artefact',
  //   data: {
  //     name: 'Infotainment System Artefact',
  //     description:
  //       'Artefact covering the vehicle’s connectivity and infotainment features.',
  //     version: 'v3.2',
  //     domain: 'Infotainment',
  //     createdAt: '2025-03-10T12:45:00Z',
  //     updatedAt: '2025-03-10T12:45:00Z',
  //   },
  // },
  // {
  //   id: 'sdv_engineering_artefact-1',
  //   type: 'sdv_engineering_artefact',
  //   data: {
  //     name: 'Test Plan Documentation',
  //     description:
  //       'Detailed documentation for the validation of vehicle safety features.',
  //     version: 'v1.0',
  //     engineeringFocus: 'Testing',
  //     referenceLinks: ['http://autotest-docs.com/testplan'],
  //     createdAt: '2025-03-10T12:50:00Z',
  //     updatedAt: '2025-03-10T12:50:00Z',
  //   },
  // },
  // {
  //   id: 'sdv_engineering_artefact-2',
  //   type: 'sdv_engineering_artefact',
  //   data: {
  //     name: 'Requirements Specification',
  //     description:
  //       'Comprehensive requirements for system safety and performance.',
  //     version: 'v1.2',
  //     engineeringFocus: 'Design',
  //     referenceLinks: ['http://autoreq-spec.com'],
  //     createdAt: '2025-03-10T12:55:00Z',
  //     updatedAt: '2025-03-10T12:55:00Z',
  //   },
  // },
  // {
  //   id: 'system-1',
  //   type: 'system',
  //   data: {
  //     name: 'On-Board Control System',
  //     description:
  //       'Primary vehicle control system managing powertrain and chassis operations.',
  //     version: 'v1.0',
  //     systemType: 'On-Board',
  //     manufacturer: 'AutoMotive Tech',
  //     model: 'ControlX',
  //     createdAt: '2025-03-10T13:00:00Z',
  //     updatedAt: '2025-03-10T13:00:00Z',
  //   },
  // },
  // {
  //   id: 'system-2',
  //   type: 'system',
  //   data: {
  //     name: 'Off-Board Diagnostic System',
  //     description:
  //       'Remote diagnostic system providing telematics and analytics.',
  //     version: 'v1.1',
  //     systemType: 'Off-Board',
  //     manufacturer: 'DiagnoSys Inc.',
  //     model: 'RemoteX',
  //     createdAt: '2025-03-10T13:05:00Z',
  //     updatedAt: '2025-03-10T13:05:00Z',
  //   },
  // },
  // {
  //   id: 'sub_system-1',
  //   type: 'sub_system',
  //   data: {
  //     name: 'Chassis & Suspension',
  //     description:
  //       'Subsystem responsible for vehicle stability and ride comfort.',
  //     version: 'v1.0',
  //     subSystemType: 'Chassis',
  //     powerConsumption: 450,
  //     createdAt: '2025-03-10T13:10:00Z',
  //     updatedAt: '2025-03-10T13:10:00Z',
  //   },
  // },
  // {
  //   id: 'sub_system-2',
  //   type: 'sub_system',
  //   data: {
  //     name: 'Power Distribution Unit',
  //     description: 'Handles the distribution of power across vehicle modules.',
  //     version: 'v1.1',
  //     subSystemType: 'PowerDistribution',
  //     powerConsumption: 600,
  //     createdAt: '2025-03-10T13:15:00Z',
  //     updatedAt: '2025-03-10T13:15:00Z',
  //   },
  // },
  // {
  //   id: 'network-1',
  //   type: 'network',
  //   data: {
  //     name: 'High-Speed Ethernet Bus',
  //     description:
  //       'Ethernet network connecting compute nodes and central controllers.',
  //     version: 'v1.0',
  //     networkType: 'Ethernet',
  //     bandwidth: 1000,
  //     createdAt: '2025-03-10T13:20:00Z',
  //     updatedAt: '2025-03-10T13:20:00Z',
  //   },
  // },
  // {
  //   id: 'network-2',
  //   type: 'network',
  //   data: {
  //     name: 'CAN Bus',
  //     description:
  //       'Controller Area Network used for sensor and actuator communication.',
  //     version: 'v1.1',
  //     networkType: 'CAN',
  //     bandwidth: 500,
  //     createdAt: '2025-03-10T13:25:00Z',
  //     updatedAt: '2025-03-10T13:25:00Z',
  //   },
  // },
  // {
  //   id: 'compute_node-1',
  //   type: 'compute_node',
  //   data: {
  //     name: 'Vehicle Gateway ECU',
  //     description:
  //       'Electronic control unit responsible for interfacing between sensors and central control.',
  //     version: 'v1.0',
  //     nodeType: 'Gateway',
  //     cpuArchitecture: 'ARM',
  //     ramSize: 4,
  //     storageSize: 64,
  //     createdAt: '2025-03-10T13:30:00Z',
  //     updatedAt: '2025-03-10T13:30:00Z',
  //   },
  // },
  // {
  //   id: 'compute_node-2',
  //   type: 'compute_node',
  //   data: {
  //     name: 'Infotainment Server ECU',
  //     description: 'Handles multimedia, navigation, and connectivity features.',
  //     version: 'v1.1',
  //     nodeType: 'Server',
  //     cpuArchitecture: 'x86',
  //     ramSize: 8,
  //     storageSize: 256,
  //     createdAt: '2025-03-10T13:35:00Z',
  //     updatedAt: '2025-03-10T13:35:00Z',
  //   },
  // },
  // {
  //   id: 'sw_stack_item-1',
  //   type: 'sw_stack_item',
  //   data: {
  //     name: 'Embedded OS for Gateway',
  //     description:
  //       'Operating system for the vehicle gateway ECU providing real-time performance.',
  //     version: 'v1.0',
  //     swType: 'OS',
  //     vendor: 'EmbeddedSys',
  //     createdAt: '2025-03-10T13:40:00Z',
  //     updatedAt: '2025-03-10T13:40:00Z',
  //   },
  // },
  // {
  //   id: 'sw_stack_item-2',
  //   type: 'sw_stack_item',
  //   data: {
  //     name: 'Middleware for Infotainment',
  //     description:
  //       'Software middleware providing integration for multimedia applications.',
  //     version: 'v1.1',
  //     swType: 'Middleware',
  //     vendor: 'MediaSoft',
  //     createdAt: '2025-03-10T13:45:00Z',
  //     updatedAt: '2025-03-10T13:45:00Z',
  //   },
  // },
  // {
  //   id: 'asw_component-1',
  //   type: 'asw_component',
  //   data: {
  //     name: 'ADAS Vision Processing',
  //     description:
  //       'Component handling image processing for collision avoidance.',
  //     version: 'v1.0',
  //     componentType: 'AI-Inference',
  //     framework: 'TensorFlow',
  //     dependencies: ['OpenCV', 'LibVision'],
  //     createdAt: '2025-03-10T13:50:00Z',
  //     updatedAt: '2025-03-10T13:50:00Z',
  //   },
  // },
  // {
  //   id: 'asw_component-2',
  //   type: 'asw_component',
  //   data: {
  //     name: 'Infotainment UI Engine',
  //     description:
  //       'Component responsible for managing the vehicle infotainment user interface.',
  //     version: 'v1.0',
  //     componentType: 'AppLogic',
  //     framework: 'React',
  //     dependencies: ['Redux', 'StyledComponents'],
  //     createdAt: '2025-03-10T13:55:00Z',
  //     updatedAt: '2025-03-10T13:55:00Z',
  //   },
  // },
  // {
  //   id: 'asw_component-3',
  //   type: 'asw_component',
  //   data: {
  //     name: 'Engine Control Logic',
  //     description:
  //       'Component managing the powertrain control and engine performance.',
  //     version: 'v1.0',
  //     componentType: 'StateEngine',
  //     framework: 'Angular',
  //     dependencies: ['RxJS'],
  //     createdAt: '2025-03-10T14:00:00Z',
  //     updatedAt: '2025-03-10T14:00:00Z',
  //   },
  // },
  // {
  //   id: 'asw_component-4',
  //   type: 'asw_component',
  //   data: {
  //     name: 'Simulation Data Aggregator',
  //     description: 'Component that aggregates simulation data for HIL testing.',
  //     version: 'v1.0',
  //     componentType: 'Simulation',
  //     framework: 'Vue',
  //     dependencies: ['D3.js', 'Axios'],
  //     createdAt: '2025-03-10T14:05:00Z',
  //     updatedAt: '2025-03-10T14:05:00Z',
  //   },
  // },
  // {
  //   id: 'asw_component-5',
  //   type: 'asw_component',
  //   data: {
  //     name: 'Connectivity Module',
  //     description: 'Component managing in-vehicle connectivity and telematics.',
  //     version: 'v1.1',
  //     componentType: 'AppLogic',
  //     framework: 'Svelte',
  //     dependencies: ['WebSocket', 'MQTT'],
  //     createdAt: '2025-03-10T14:10:00Z',
  //     updatedAt: '2025-03-10T14:10:00Z',
  //   },
  // },
  // {
  //   id: 'asw_component-6',
  //   type: 'asw_component',
  //   data: {
  //     name: 'Advanced Sensor Fusion',
  //     description:
  //       'Component integrating data from multiple ADAS sensors for improved perception.',
  //     version: 'v1.1',
  //     componentType: 'AI-Inference',
  //     framework: 'PyTorch',
  //     dependencies: ['NumPy', 'SciPy'],
  //     createdAt: '2025-03-10T14:15:00Z',
  //     updatedAt: '2025-03-10T14:15:00Z',
  //   },
  // },
  // {
  //   id: 'asw_component-7',
  //   type: 'asw_component',
  //   data: {
  //     name: 'ADAS Decision Engine',
  //     description:
  //       'Component that processes sensor data to make real‑time driving decisions.',
  //     version: 'v1.1',
  //     componentType: 'StateEngine',
  //     framework: 'Ember',
  //     dependencies: ['Lodash'],
  //     createdAt: '2025-03-10T14:20:00Z',
  //     updatedAt: '2025-03-10T14:20:00Z',
  //   },
  // },
  // {
  //   id: 'asw_component-8',
  //   type: 'asw_component',
  //   data: {
  //     name: 'Vehicle Diagnostics Manager',
  //     description:
  //       'Component responsible for collecting and processing diagnostic data.',
  //     version: 'v1.1',
  //     componentType: 'Simulation',
  //     framework: 'Backbone',
  //     dependencies: ['D3.js'],
  //     createdAt: '2025-03-10T14:25:00Z',
  //     updatedAt: '2025-03-10T14:25:00Z',
  //   },
  // },
  // {
  //   id: 'asw_component-9',
  //   type: 'asw_component',
  //   data: {
  //     name: 'Mobile App Control Interface',
  //     description:
  //       'Component for managing user interactions via the vehicle mobile app.',
  //     version: 'v1.2',
  //     componentType: 'AppLogic',
  //     framework: 'React Native',
  //     dependencies: ['Expo', 'Redux'],
  //     createdAt: '2025-03-10T14:30:00Z',
  //     updatedAt: '2025-03-10T14:30:00Z',
  //   },
  // },
  // {
  //   id: 'asw_component-10',
  //   type: 'asw_component',
  //   data: {
  //     name: 'Cloud Connectivity Gateway',
  //     description:
  //       'Component enabling secure data exchange between the vehicle and cloud services.',
  //     version: 'v1.2',
  //     componentType: 'AI-Inference',
  //     framework: 'MXNet',
  //     dependencies: ['OpenSSL'],
  //     createdAt: '2025-03-10T14:35:00Z',
  //     updatedAt: '2025-03-10T14:35:00Z',
  //   },
  // },
  // {
  //   id: 'asw_service-1',
  //   type: 'asw_service',
  //   data: {
  //     name: 'ADAS Vision API',
  //     description:
  //       'Service providing image analytics and collision detection outputs.',
  //     version: 'v1.0',
  //     serviceInterface: 'REST',
  //     functionality: 'Process and return visual detection data',
  //     createdAt: '2025-03-10T14:40:00Z',
  //     updatedAt: '2025-03-10T14:40:00Z',
  //   },
  // },
  // {
  //   id: 'asw_service-2',
  //   type: 'asw_service',
  //   data: {
  //     name: 'Infotainment GraphQL API',
  //     description:
  //       'Service to query multimedia and navigation data for infotainment.',
  //     version: 'v1.0',
  //     serviceInterface: 'GraphQL',
  //     functionality: 'Return multimedia and map data',
  //     createdAt: '2025-03-10T14:45:00Z',
  //     updatedAt: '2025-03-10T14:45:00Z',
  //   },
  // },
  // {
  //   id: 'asw_service-3',
  //   type: 'asw_service',
  //   data: {
  //     name: 'Engine Diagnostics REST API',
  //     description:
  //       'Service offering real‑time engine performance metrics via REST.',
  //     version: 'v1.0',
  //     serviceInterface: 'REST',
  //     functionality: 'Deliver engine performance data',
  //     createdAt: '2025-03-10T14:50:00Z',
  //     updatedAt: '2025-03-10T14:50:00Z',
  //   },
  // },
  // {
  //   id: 'asw_service-4',
  //   type: 'asw_service',
  //   data: {
  //     name: 'Legacy SOAP Interface',
  //     description: 'Service to support legacy integrations using SOAP.',
  //     version: 'v1.0',
  //     serviceInterface: 'SOAP',
  //     functionality: 'Provide backward compatibility for older modules',
  //     createdAt: '2025-03-10T14:55:00Z',
  //     updatedAt: '2025-03-10T14:55:00Z',
  //   },
  // },
  // {
  //   id: 'asw_service-5',
  //   type: 'asw_service',
  //   data: {
  //     name: 'Data Update REST API',
  //     description: 'Service to push over-the-air updates for vehicle software.',
  //     version: 'v1.1',
  //     serviceInterface: 'REST',
  //     functionality: 'Transmit software update packages',
  //     createdAt: '2025-03-10T15:00:00Z',
  //     updatedAt: '2025-03-10T15:00:00Z',
  //   },
  // },
  // {
  //   id: 'asw_service-6',
  //   type: 'asw_service',
  //   data: {
  //     name: 'Telematics GraphQL API',
  //     description:
  //       'Service managing vehicle subscriptions and remote diagnostics via GraphQL.',
  //     version: 'v1.1',
  //     serviceInterface: 'GraphQL',
  //     functionality: 'Handle remote monitoring and subscription data',
  //     createdAt: '2025-03-10T15:05:00Z',
  //     updatedAt: '2025-03-10T15:05:00Z',
  //   },
  // },
  // {
  //   id: 'asw_service-7',
  //   type: 'asw_service',
  //   data: {
  //     name: 'Payment Processing REST API',
  //     description:
  //       'Service for secure payment transactions within connected vehicles.',
  //     version: 'v1.1',
  //     serviceInterface: 'REST',
  //     functionality: 'Process in-vehicle payment transactions',
  //     createdAt: '2025-03-10T15:10:00Z',
  //     updatedAt: '2025-03-10T15:10:00Z',
  //   },
  // },
  // {
  //   id: 'asw_service-8',
  //   type: 'asw_service',
  //   data: {
  //     name: 'Reporting SOAP Service',
  //     description:
  //       'Service delivering vehicle performance and usage reports via SOAP.',
  //     version: 'v1.1',
  //     serviceInterface: 'SOAP',
  //     functionality: 'Generate and deliver detailed performance reports',
  //     createdAt: '2025-03-10T15:15:00Z',
  //     updatedAt: '2025-03-10T15:15:00Z',
  //   },
  // },
  // {
  //   id: 'asw_service-9',
  //   type: 'asw_service',
  //   data: {
  //     name: 'Notification Service REST API',
  //     description:
  //       'Service for pushing alert notifications and vehicle status updates.',
  //     version: 'v1.2',
  //     serviceInterface: 'REST',
  //     functionality: 'Push real-time notifications to driver apps',
  //     createdAt: '2025-03-10T15:20:00Z',
  //     updatedAt: '2025-03-10T15:20:00Z',
  //   },
  // },
  // {
  //   id: 'asw_service-10',
  //   type: 'asw_service',
  //   data: {
  //     name: 'Cloud Data Sync GraphQL API',
  //     description:
  //       'Service ensuring secure real-time data synchronization between the vehicle and cloud services.',
  //     version: 'v1.2',
  //     serviceInterface: 'GraphQL',
  //     functionality: 'Enable secure cloud connectivity and data exchange',
  //     createdAt: '2025-03-10T15:25:00Z',
  //     updatedAt: '2025-03-10T15:25:00Z',
  //   },
  // },
  // {
  //   id: 'hara-1',
  //   type: 'hara',
  //   data: {
  //     name: 'Hazard: Overheating Risk',
  //     description:
  //       'Risk assessment for potential engine overheating during extreme operation.',
  //     version: 'v1.0',
  //     hazard: 'Engine Overheating',
  //     riskLevel: 'High',
  //     mitigationPlan: 'Enhance cooling system design and improve airflow.',
  //     createdAt: '2025-03-10T15:30:00Z',
  //     updatedAt: '2025-03-10T15:30:00Z',
  //   },
  // },
  // {
  //   id: 'hara-2',
  //   type: 'hara',
  //   data: {
  //     name: 'Hazard: Electrical Short Circuit',
  //     description:
  //       'Risk assessment addressing potential electrical short circuits in the vehicle wiring harness.',
  //     version: 'v1.1',
  //     hazard: 'Electrical Short Circuit',
  //     riskLevel: 'Critical',
  //     mitigationPlan:
  //       'Implement redundant wiring and use higher-grade insulation.',
  //     createdAt: '2025-03-10T15:35:00Z',
  //     updatedAt: '2025-03-10T15:35:00Z',
  //   },
  // },
  // {
  //   id: 'country-1',
  //   type: 'country',
  //   data: {
  //     name: 'United States',
  //     description: 'Primary market region in North America.',
  //     version: 'v1.0',
  //     isoCode: 'US',
  //     region: 'North America',
  //     createdAt: '2025-03-10T15:40:00Z',
  //     updatedAt: '2025-03-10T15:40:00Z',
  //   },
  // },
  // {
  //   id: 'country-2',
  //   type: 'country',
  //   data: {
  //     name: 'Germany',
  //     description:
  //       'Major market region in Europe with stringent automotive standards.',
  //     version: 'v1.1',
  //     isoCode: 'DE',
  //     region: 'Europe',
  //     createdAt: '2025-03-10T15:45:00Z',
  //     updatedAt: '2025-03-10T15:45:00Z',
  //   },
  // },
  // {
  //   id: 'regulation-1',
  //   type: 'regulation',
  //   data: {
  //     name: 'Federal Motor Vehicle Safety Standard',
  //     description: 'U.S. safety regulation for onboard electronic systems.',
  //     version: 'v1.0',
  //     regulationId: 'FMVSS-126',
  //     authority: 'NHTSA',
  //     createdAt: '2025-03-10T15:50:00Z',
  //     updatedAt: '2025-03-10T15:50:00Z',
  //   },
  // },
  // {
  //   id: 'regulation-2',
  //   type: 'regulation',
  //   data: {
  //     name: 'European Emission Standards',
  //     description:
  //       'EU regulation targeting low emissions and enhanced fuel efficiency.',
  //     version: 'v1.1',
  //     regulationId: 'Euro6',
  //     authority: 'European Commission',
  //     createdAt: '2025-03-10T15:55:00Z',
  //     updatedAt: '2025-03-10T15:55:00Z',
  //   },
  // },
  // {
  //   id: 'hil-1',
  //   type: 'hil',
  //   data: {
  //     name: 'HIL Setup - Engine Test Rig',
  //     description:
  //       'Hardware-in-the-loop configuration for engine performance testing.',
  //     version: 'v1.0',
  //     rigConfiguration: 'EngineTestRig-A',
  //     hardwareInLoop: true,
  //     createdAt: '2025-03-10T16:00:00Z',
  //     updatedAt: '2025-03-10T16:00:00Z',
  //   },
  // },
  // {
  //   id: 'hil-2',
  //   type: 'hil',
  //   data: {
  //     name: 'HIL Setup - Infotainment Rig',
  //     description:
  //       'HIL configuration for testing vehicle multimedia and connectivity systems.',
  //     version: 'v1.1',
  //     rigConfiguration: 'InfotainmentRig-B',
  //     hardwareInLoop: false,
  //     createdAt: '2025-03-10T16:05:00Z',
  //     updatedAt: '2025-03-10T16:05:00Z',
  //   },
  // },
  // {
  //   id: 'test_plan-1',
  //   type: 'test_plan',
  //   data: {
  //     name: 'SDV Safety Test Plan',
  //     description:
  //       'Plan outlining tests for ADAS, infotainment, and control systems to meet regulatory standards.',
  //     version: 'v1.0',
  //     engineeringFocus: 'Testing',
  //     referenceLinks: ['http://sdv-tests.com/safety'],
  //     objective: 'Verify system responses under critical conditions',
  //     scope: 'Full vehicle integration tests',
  //     criteria: 'All safety thresholds met under simulated stress',
  //     createdAt: '2025-03-10T16:10:00Z',
  //     updatedAt: '2025-03-10T16:10:00Z',
  //   },
  // },
  // {
  //   id: 'test_plan-2',
  //   type: 'test_plan',
  //   data: {
  //     name: 'SDV Simulation Test Plan',
  //     description:
  //       'Test plan for validating simulation models and HIL configurations for virtual testing.',
  //     version: 'v1.1',
  //     engineeringFocus: 'Simulation',
  //     referenceLinks: ['http://sdv-tests.com/simulation'],
  //     objective: 'Ensure simulation fidelity and hardware integration',
  //     scope: 'Subsystem-level simulation with live HIL feedback',
  //     criteria: 'Simulation outputs match physical test data',
  //     createdAt: '2025-03-10T16:15:00Z',
  //     updatedAt: '2025-03-10T16:15:00Z',
  //   },
  // },
  // {
  //   id: 'requirements_group-1',
  //   type: 'requirements_group',
  //   data: {
  //     name: 'ADAS Functional Requirements',
  //     description:
  //       'Grouping of requirements related to advanced driver assistance functionalities.',
  //     version: 'v1.0',
  //     engineeringFocus: 'Requirements',
  //     referenceLinks: ['http://sdv-reqs.com/adas'],
  //     groupScope: 'Subsystem level',
  //     relatedTo: 'ADAS Control',
  //     createdAt: '2025-03-10T16:20:00Z',
  //     updatedAt: '2025-03-10T16:20:00Z',
  //   },
  // },
  // {
  //   id: 'requirements_group-2',
  //   type: 'requirements_group',
  //   data: {
  //     name: 'Infotainment and Connectivity Requirements',
  //     description:
  //       'Collection of requirements ensuring seamless connectivity and user experience.',
  //     version: 'v1.1',
  //     engineeringFocus: 'Design',
  //     referenceLinks: ['http://sdv-reqs.com/infotainment'],
  //     groupScope: 'System level',
  //     relatedTo: 'Infotainment UI',
  //     createdAt: '2025-03-10T16:25:00Z',
  //     updatedAt: '2025-03-10T16:25:00Z',
  //   },
  // },
  // {
  //   id: 'requirement-1',
  //   type: 'requirement',
  //   data: {
  //     name: 'Brake System Response Time',
  //     description:
  //       'The braking system must respond within 200ms under emergency conditions.',
  //     version: 'v1.0',
  //     engineeringFocus: 'Functional',
  //     referenceLinks: ['http://sdv-reqs.com/brakes'],
  //     requirementType: 'Functional',
  //     priority: 'High',
  //     createdAt: '2025-03-10T16:30:00Z',
  //     updatedAt: '2025-03-10T16:30:00Z',
  //   },
  // },
  // {
  //   id: 'requirement-2',
  //   type: 'requirement',
  //   data: {
  //     name: 'Infotainment Latency',
  //     description:
  //       'Infotainment system response time should not exceed 100ms for user inputs.',
  //     version: 'v1.1',
  //     engineeringFocus: 'Non-Functional',
  //     referenceLinks: ['http://sdv-reqs.com/infotainment-latency'],
  //     requirementType: 'Safety',
  //     priority: 'Medium',
  //     createdAt: '2025-03-10T16:35:00Z',
  //     updatedAt: '2025-03-10T16:35:00Z',
  //   },
  // },
  // {
  //   id: 'peripheral-1',
  //   type: 'peripheral',
  //   data: {
  //     name: 'Front Radar Sensor',
  //     description:
  //       'Sensor used for forward collision detection and adaptive cruise control.',
  //     version: 'v1.0',
  //     peripheralType: 'Sensor',
  //     powerRequirement: 12,
  //     createdAt: '2025-03-10T16:40:00Z',
  //     updatedAt: '2025-03-10T16:40:00Z',
  //   },
  // },
  // {
  //   id: 'peripheral-2',
  //   type: 'peripheral',
  //   data: {
  //     name: 'Rear Camera Module',
  //     description:
  //       'High-resolution camera module for parking assist and rear monitoring.',
  //     version: 'v1.1',
  //     peripheralType: 'Camera',
  //     powerRequirement: 15,
  //     createdAt: '2025-03-10T16:45:00Z',
  //     updatedAt: '2025-03-10T16:45:00Z',
  //   },
  // },
]

export const instanceRelations = [
  // Passenger Welcome Sequence
  {
    source: 'inst_asw_component_2',
    target: 'inst_asw_service_2_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_2',
    target: 'inst_asw_service_2_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_2',
    target: 'inst_asw_service_2_3',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_2',
    target: 'inst_asw_service_2_4',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_3',
    target: 'inst_asw_service_3_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_3',
    target: 'inst_asw_service_3_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_3',
    target: 'inst_asw_service_3_3',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_3',
    target: 'inst_asw_service_3_4',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_4',
    target: 'inst_asw_service_4_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_4',
    target: 'inst_asw_service_4_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_4',
    target: 'inst_asw_service_4_3',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_4',
    target: 'inst_asw_service_4_4',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_5',
    target: 'inst_asw_service_5_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_5',
    target: 'inst_asw_service_5_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_5',
    target: 'inst_asw_service_5_3',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_5',
    target: 'inst_asw_service_5_4',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_6',
    target: 'inst_asw_service_6_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_6',
    target: 'inst_asw_service_6_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_6',
    target: 'inst_asw_service_6_3',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_6',
    target: 'inst_asw_service_6_4',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_vehicle_model',
    target: 'inst_system_onboard',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_vehicle_model',
    target: 'inst_system_offboard',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_vehicle_model',
    target: 'inst_asw_domain',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_vehicle_model',
    target: 'inst_stage_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_vehicle_model',
    target: 'inst_stage_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_vehicle_model',
    target: 'inst_stage_3',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_vehicle_model',
    target: 'inst_stage_4',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_system_onboard',
    target: 'inst_subsystem_onboard_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_system_onboard',
    target: 'inst_subsystem_onboard_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_system_offboard',
    target: 'inst_subsystem_offboard_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_system_offboard',
    target: 'inst_subsystem_offboard_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_system_offboard',
    target: 'inst_subsystem_offboard_3',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_system_offboard',
    target: 'inst_subsystem_offboard_4',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_1',
    target: 'inst_asw_service_1_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_1',
    target: 'inst_asw_service_1_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_1',
    target: 'inst_asw_service_1_3',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_component_1',
    target: 'inst_asw_service_1_4',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_req_group_1',
    target: 'inst_requirement_1_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_req_group_1',
    target: 'inst_requirement_1_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_req_group_1',
    target: 'inst_requirement_1_3',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_req_group_1',
    target: 'inst_requirement_1_4',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_req_group_2',
    target: 'inst_requirement_2_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_req_group_2',
    target: 'inst_requirement_2_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_req_group_2',
    target: 'inst_requirement_2_3',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_req_group_2',
    target: 'inst_requirement_2_4',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_req_group_3',
    target: 'inst_requirement_3_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_req_group_3',
    target: 'inst_requirement_3_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_req_group_3',
    target: 'inst_requirement_3_3',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_req_group_3',
    target: 'inst_requirement_3_4',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_test_plan',
    target: 'inst_test_case_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_test_plan',
    target: 'inst_test_case_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_test_plan',
    target: 'inst_test_case_3',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_test_case_1',
    target: 'inst_test_run_1_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_test_case_1',
    target: 'inst_test_run_1_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_test_case_2',
    target: 'inst_test_run_2_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_test_case_2',
    target: 'inst_test_run_2_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_test_case_3',
    target: 'inst_test_run_3_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_test_case_3',
    target: 'inst_test_run_3_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_domain',
    target: 'inst_asw_component_1',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_domain',
    target: 'inst_asw_component_2',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_domain',
    target: 'inst_asw_component_3',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_domain',
    target: 'inst_asw_component_4',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_domain',
    target: 'inst_asw_component_5',
    type: 'composition',
    multiplicity: 'one-to-many',
  },
  {
    source: 'inst_asw_domain',
    target: 'inst_asw_component_6',
    type: 'composition',
    multiplicity: 'one-to-many',
  },

  // Passenger Welcome Sequence
  // {
  //   source: 'system-1',
  //   target: 'sub_system-1',
  //   type: 'composition',
  //   multiplicity: 'one-to-many',
  // },
  // {
  //   source: 'system-2',
  //   target: 'sub_system-2',
  //   type: 'composition',
  //   multiplicity: 'one-to-many',
  // },
  // {
  //   source: 'sub_system-1',
  //   target: 'compute_node-1',
  //   type: 'composition',
  //   multiplicity: 'one-to-many',
  // },
  // {
  //   source: 'sub_system-2',
  //   target: 'compute_node-2',
  //   type: 'composition',
  //   multiplicity: 'one-to-many',
  // },
  // {
  //   source: 'compute_node-1',
  //   target: 'network-1',
  //   type: 'composition',
  //   multiplicity: 'one-to-many',
  // },
  // {
  //   source: 'compute_node-2',
  //   target: 'network-2',
  //   type: 'composition',
  //   multiplicity: 'one-to-many',
  // },
  // {
  //   source: 'compute_node-1',
  //   target: 'sw_stack_item-1',
  //   type: 'composition',
  //   multiplicity: 'one-to-many',
  // },
  // {
  //   source: 'compute_node-2',
  //   target: 'sw_stack_item-2',
  //   type: 'composition',
  //   multiplicity: 'one-to-many',
  // },
  // {
  //   source: 'asw_component-1',
  //   target: 'asw_service-1',
  //   type: 'composition',
  //   multiplicity: 'one-to-one',
  // },
  // {
  //   source: 'asw_component-2',
  //   target: 'asw_service-2',
  //   type: 'composition',
  //   multiplicity: 'one-to-one',
  // },
  // {
  //   source: 'asw_component-3',
  //   target: 'asw_service-3',
  //   type: 'composition',
  //   multiplicity: 'one-to-one',
  // },
  // {
  //   source: 'asw_component-4',
  //   target: 'asw_service-4',
  //   type: 'composition',
  //   multiplicity: 'one-to-one',
  // },
  // {
  //   source: 'asw_component-5',
  //   target: 'asw_service-5',
  //   type: 'composition',
  //   multiplicity: 'one-to-one',
  // },
  // {
  //   source: 'asw_component-6',
  //   target: 'asw_service-6',
  //   type: 'composition',
  //   multiplicity: 'one-to-one',
  // },
  // {
  //   source: 'asw_component-7',
  //   target: 'asw_service-7',
  //   type: 'composition',
  //   multiplicity: 'one-to-one',
  // },
  // {
  //   source: 'asw_component-8',
  //   target: 'asw_service-8',
  //   type: 'composition',
  //   multiplicity: 'one-to-one',
  // },
  // {
  //   source: 'asw_component-9',
  //   target: 'asw_service-9',
  //   type: 'composition',
  //   multiplicity: 'one-to-one',
  // },
  // {
  //   source: 'asw_component-10',
  //   target: 'asw_service-10',
  //   type: 'composition',
  //   multiplicity: 'one-to-one',
  // },
  // {
  //   source: 'asw_service-1',
  //   target: 'peripheral-1',
  //   type: 'composition',
  //   multiplicity: 'one-to-many',
  // },
  // {
  //   source: 'asw_service-2',
  //   target: 'peripheral-2',
  //   type: 'composition',
  //   multiplicity: 'one-to-many',
  // },
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

export const joinTypeData = (data: any[]) => {
  const result: InventoryItem[] = data
  result.forEach((item) => {
    item.typeData = types.find((type) => type.$id === item.type)
  })
  return result
}

const hashStr = (s: string) => {
  let hash = 0,
    i,
    chr
  if (s.length === 0) return hash
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return hash
}

export const joinCreatedByData = (data: any[], users?: User[]) => {
  if (!users || users.length === 0) {
    return data
  }
  const result: InventoryItem[] = data
  result.forEach((item) => {
    if (item.data) {
      item.data.createdBy = users.at(hashStr(item.id) % users.length)
    }
  })
  return result
}

export const typeToImage = {
  asw_component:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/ASW Component.jpg',
  asw_service:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/ASW Service.jpg',
  asw_domain:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/ASW Domain.jpg',
  country:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/Country.jpg',
  hara: 'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/HARA.jpg',
  peripherals:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/Peripherals.jpg',
  requirement:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/Requirement.jpg',
  requirements_group:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/Requirements Group.jpg',
  stage:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/Stage.jpg',
  test_case:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/TestCase.jpg',
  test_plan:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/TestPlan.jpg',
  test_run:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/TestRun.jpg',
  api_layer:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/api layers.jpg',
  compute_node:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/compute node.jpg',
  asw_layer:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/layers.jpg',
  network:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/network.jpg',
  sub_system:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/sub-system.jpg',
  sw_stack_item:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/sw-stack-item.jpg',
  system:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/system.jpg',
  regulation:
    'https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/Regulation.jpg',
}
