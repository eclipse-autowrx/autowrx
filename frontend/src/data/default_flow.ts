import { FlowStep, SignalFlow } from '@/types/flow.type'

const createFlowFromJourney = (
  title: string,
  who: string,
  what: string,
  touchPoints: string,
  p2c: SignalFlow | null,
  v2c: SignalFlow | null,
  s2s: SignalFlow | null,
  s2e: SignalFlow | null,
) => ({
  title,
  flows: [
    {
      offBoard: { smartPhone: who, p2c, cloud: '' },
      v2c,
      onBoard: {
        sdvRuntime: what,
        s2s,
        embedded: '',
        s2e,
        sensors: touchPoints,
      },
    },
  ],
})

export const default_flow: FlowStep[] = [
  createFlowFromJourney(
    'Step 1',
    'Driver',
    'Wipers turned on manually',
    'Windshield wiper switch',
    { direction: 'right', signal: 'Vehicle.Body.Windshield.Front.Wiping.Status' },
    { direction: 'right', signal: 'Vehicle.Body.Windshield.Front.Wiping.Status' },
    { direction: 'right', signal: 'Vehicle.Body.Windshield.Front.Wiping.TargetPosition' },
    { direction: 'right', signal: 'Vehicle.Body.Windshield.Front.Wiping.TargetPosition' },
  ),
  createFlowFromJourney(
    'Step 2',
    'User',
    'User opens the car door/trunk and the open status of door/trunk is set to true',
    'Door/trunk handle',
    null,
    { direction: 'bi-direction', signal: 'Vehicle.Cabin.Door.Row1.Left.IsOpen' },
    { direction: 'right', signal: 'Vehicle.Cabin.Door.Row1.Left.IsOpen' },
    { direction: 'right', signal: 'Vehicle.Body.Trunk.Front.IsOpen' },
  ),
  createFlowFromJourney(
    'Step 3',
    'System',
    'The wiping is immediately turned off by the software and user is notified',
    'Notification on car dashboard and mobile app',
    { direction: 'right', signal: 'Vehicle.Body.Windshield.Front.Wiping.Status' },
    { direction: 'bi-direction', signal: 'Vehicle.Body.Windshield.Front.Wiping.Status' },
    { direction: 'left', signal: 'Vehicle.Body.Windshield.Front.Wiping.TargetPosition' },
    { direction: 'left', signal: 'Vehicle.Body.Windshield.Front.Wiping.TargetPosition' },
  ),
]