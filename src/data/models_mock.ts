export const models = [
  {
    id: "1231",
    cvi: "ACME Car (ICE) v0.1",
    main_api: "main_api_endpoint",
    model_home_image_file:
      "https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/E-Car_Full_Vehicle.png",
    name: "ACME Car (ICE) v0.1",
    visibility: "public",
    tenant_id: "tenant_123",
    vehicle_category: "Sedan",
    created_by: "creator_1",
    created_at: new Date(),
    tags: [{ tag: "EV Car" }],
  },
  {
    id: "1232",
    cvi: "AUTOCRYPT",
    main_api: "main_api_endpoint",
    model_home_image_file:
      "https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/car_full_ed.PNG",
    name: "AUTOCRYPT",
    visibility: "public",
    tenant_id: "tenant_123",
    vehicle_category: "SUV",
    created_by: "creator_2",
    created_at: new Date(),
    tags: [{ tag: "AI Car" }],
  },
  {
    id: "1233",
    cvi: "Basic Actuators with COVESA",
    main_api: "main_api_endpoint",
    model_home_image_file:
      "https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/car_full_ed.PNG",
    name: "Basic Actuators with COVESA",
    visibility: "public",
    tenant_id: "tenant_123",
    vehicle_category: "Hatchback",
    created_by: "creator_3",
    created_at: new Date(),
    tags: [{ tag: "Combustion Car" }],
  },
  {
    id: "1234",
    cvi: "BCW24_digital_auto_cool_SBSBM",
    main_api: "main_api_endpoint",
    model_home_image_file:
      "https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/car_full_ed.PNG",
    name: "BCW24_digital_auto_cool_SBSBM",
    visibility: "public",
    tenant_id: "tenant_123",
    vehicle_category: "Convertible",
    created_by: "creator_4",
    created_at: new Date(),
    tags: [{ tag: "Hydrogen Car" }],
  },
];

export const prototypes = [
  {
    apis: {
      VSC: [],
      VSS: [],
    },
    code: "from sdv_model import Vehicle import plugins from browser import aio vehicle = Vehicle() # write your code here",
    complexity_level: 3,
    customer_journey:
      " #Step 1 Who: Driver What: Wipers turned on manually Customer TouchPoints: Windshield wiper switch #Step 2 Who: User What: User opens the car door/trunk and the open status of door/trunk is set to true Customer TouchPoints: Door/trunk handle #Step 3 Who: System What: The wiping is immediately turned off by the software and user is notified Customer TouchPoints: Notification on car dashboard and mobile app ",
    image_file:
      "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FWipers.jpeg?alt=media&token=33d83cb0-ac4e-4636-a5ae-d39c2d52d571",
    model_id: "1231",
    name: "Smart Wipers",
    portfolio: {
      effort_estimation: 0,
      needs_addressed: 0,
      relevance: 0,
    },
    skeleton: "",
    state: "development",
    tags: [],
    widget_config: "",
    description: {
      problems: "Manual control of wipers is inconvenient.",
      says_who: "Driver",
      solution: "Automatic control of wipers based on door/trunk open status.",
      status: "In Development",
    },
  },
  {
    apis: {
      VSC: [],
      VSS: [],
    },
    code: "from sdv_model import Vehicle import plugins from browser import aio vehicle = Vehicle() # write your code here",
    complexity_level: 3,
    customer_journey:
      " #Step 1 Who: Driver What: Recognized by the vehicle Customer TouchPoints: Vehicle sensors #Step 2 Who: System What: Individual settings applied Customer TouchPoints: Vehicle settings",
    image_file:
      "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FPersonApproachingVehicle_L_1036.png?alt=media&token=710950f6-733c-48df-b9c8-8920bb082e07",
    model_id: "1232",
    name: "Mercedes-Benz EQS Welcome Sequence",
    portfolio: {
      effort_estimation: 0,
      needs_addressed: 0,
      relevance: 0,
    },
    skeleton: "",
    state: "development",
    tags: [],
    widget_config: "",
    description: {
      problems: "Driver needs to manually adjust settings.",
      says_who: "Driver",
      solution: "Automatically apply individual settings when recognized.",
      status: "In Development",
    },
  },
  {
    apis: {
      VSC: [],
      VSS: [],
    },
    code: "from sdv_model import Vehicle import plugins from browser import aio vehicle = Vehicle() # write your code here",
    complexity_level: 3,
    customer_journey:
      " #Step 1 Who: Driver What: Recognized by the vehicle Customer TouchPoints: Vehicle sensors #Step 2 Who: System What: Individual settings applied Customer TouchPoints: Vehicle settings",
    image_file:
      "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FPersonApproachingVehicle_L_1036.png?alt=media&token=710950f6-733c-48df-b9c8-8920bb082e07",
    model_id: "1233",
    name: "EQS Dev – Digital Twin",
    portfolio: {
      effort_estimation: 0,
      needs_addressed: 0,
      relevance: 0,
    },
    skeleton: "",
    state: "development",
    tags: [],
    widget_config: "",
    description: {
      problems: "Driver needs to manually adjust settings.",
      says_who: "Driver",
      solution: "Automatically apply individual settings when recognized.",
      status: "In Development",
    },
  },
  {
    apis: {
      VSC: [],
      VSS: [],
    },
    code: "from sdv_model import Vehicle import plugins from browser import aio vehicle = Vehicle() # write your code here",
    complexity_level: 3,
    customer_journey:
      " #Step 1 Who: Driver What: Battery running low Customer TouchPoints: Vehicle dashboard #Step 2 Who: System What: Suggests optimization Customer TouchPoints: Vehicle system",
    image_file:
      "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fshutterstock_2076658843O_mod.jpg?alt=media&token=b0018688-29b1-4df1-a633-85bbff84a52e",
    model_id: "1234",
    name: "EV Power Optimization",
    portfolio: {
      effort_estimation: 0,
      needs_addressed: 0,
      relevance: 0,
    },
    skeleton: "",
    state: "development",
    tags: [],
    widget_config: "",
    description: {
      problems: "Battery usage is inefficient.",
      says_who: "Driver",
      solution: "Optimize power usage based on system suggestions.",
      status: "In Development",
    },
  },
  {
    apis: {
      VSC: [],
      VSS: [],
    },
    code: "from sdv_model import Vehicle import plugins from browser import aio vehicle = Vehicle() # write your code here",
    complexity_level: 3,
    customer_journey:
      " #Step 1 Who: Passenger What: Approaching vehicle Customer TouchPoints: Vehicle sensors #Step 2 Who: System What: Welcomes passenger Customer TouchPoints: Vehicle system",
    image_file:
      "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FScreenshot%202023-06-26%20at%2015.58.25.png?alt=media&token=da5b9b60-b063-4cd4-9aea-2891dc637524",
    model_id: "1231",
    name: "Passenger Welcome V2",
    portfolio: {
      effort_estimation: 0,
      needs_addressed: 0,
      relevance: 0,
    },
    skeleton: "",
    state: "development",
    tags: [],
    widget_config: "",
    description: {
      problems: "Passenger does not feel welcomed.",
      says_who: "Passenger",
      solution: "Automatically welcome passenger when approaching vehicle.",
      status: "In Development",
    },
  },
  {
    apis: {
      VSC: [],
      VSS: [],
    },
    code: "from sdv_model import Vehicle import plugins from browser import aio vehicle = Vehicle() # write your code here",
    complexity_level: 3,
    customer_journey:
      " #Step 1 Who: Driver What: Looks away Customer TouchPoints: Vehicle sensors #Step 2 Who: System What: Detects distraction Customer TouchPoints: Vehicle system",
    image_file:
      "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fistockphoto-1168160989-612x612.jpg?alt=media&token=ab10f015-94f4-48a9-8cb8-dee55c345c37",
    model_id: "1232",
    name: "Driver Distraction Detection [AI + Tensorflow.Js]",
    portfolio: {
      effort_estimation: 0,
      needs_addressed: 0,
      relevance: 0,
    },
    skeleton: "",
    state: "development",
    tags: [],
    widget_config: "",
    description: {
      problems: "Driver gets distracted easily.",
      says_who: "System",
      solution: "Detect driver distraction using AI and TensorFlow.js.",
      status: "In Development",
    },
  },
  {
    apis: {
      VSC: [],
      VSS: [],
    },
    code: "from sdv_model import Vehicle import plugins from browser import aio vehicle = Vehicle() # write your code here",
    complexity_level: 3,
    customer_journey:
      " #Step 1 Who: Passenger What: Feels dizzy Customer TouchPoints: Vehicle sensors #Step 2 Who: System What: Adjusts settings Customer TouchPoints: Vehicle system",
    image_file:
      "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FAntiKinetosis.png?alt=media&token=c1ab5c64-3703-4ad8-a3e9-2f5836626cab",
    model_id: "1233",
    name: "Anti-Kinetosis With Landing.Ai",
    portfolio: {
      effort_estimation: 0,
      needs_addressed: 0,
      relevance: 0,
    },
    skeleton: "",
    state: "development",
    tags: [],
    widget_config: "",
    description: {
      problems: "Passenger feels dizzy during the ride.",
      says_who: "Passenger",
      solution: "Adjust settings to reduce dizziness using AI.",
      status: "In Development",
    },
  },
  {
    apis: {
      VSC: [],
      VSS: [],
    },
    code: "from sdv_model import Vehicle import plugins from browser import aio vehicle = Vehicle() # write your code here",
    complexity_level: 3,
    customer_journey:
      " #Step 1 Who: Driver/Passenger What: Opens car door Customer TouchPoints: Car door handle #Step 2 Who: System What: Opens door automatically Customer TouchPoints: Vehicle system",
    image_file:
      "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FDALL%C2%B7E%202024-01-18%2011.02.32%20-%20A%20professional%20demonstration%20image%20of%20a%20vehicle's%20auto-door%20opening%20feature%20in%20a%20minimalistic%20style.%20The%20scene%20shows%20a%20regular%20car%20with%20the%20driver's%20s.png?alt=media&token=13df7bff-f0ea-4ccf-b802-61bf2daf6e7f",
    model_id: "1234",
    name: "Smart Door",
    portfolio: {
      effort_estimation: 0,
      needs_addressed: 0,
      relevance: 0,
    },
    skeleton: "",
    state: "development",
    tags: [],
    widget_config: "",
    description: {
      problems: "Manual opening of car doors is inconvenient.",
      says_who: "Driver/Passenger",
      solution: "Automatically open car doors when the handle is touched.",
      status: "In Development",
    },
  },
];
