import { FlowStep, Direction, SignalFlow } from '@/types/flow.type'

export const flowData: FlowStep[] = [
  {
    title: 'Step 1: Detect Person Behind Vehicle',
    flows: [
      {
        offBoard: {
          smartPhone: '',
          p2c: null,
          cloud: '',
        },
        v2c: null,
        onBoard: {
          sdvRuntime: '',
          s2s: null,
          embedded: 'Initialize Sensors',
          s2e: {
            direction: 'bi-direction',
            signal: 'Vehicle.ADAS.Proximity.Rear.IsActive',
          },
          sensors: 'Start Monitoring',
        },
      },
      {
        offBoard: {
          smartPhone: '',
          p2c: null,
          cloud: 'Process Detection',
        },
        v2c: {
          direction: 'left',
          signal: 'Vehicle.ADAS.HumanDetection.IsDetected',
        },
        onBoard: {
          sdvRuntime: 'Person Detected',
          s2s: {
            direction: 'left',
            signal: 'Vehicle.ADAS.Proximity.Rear.IsWarning',
          },
          embedded: 'Process Proximity Data',
          s2e: {
            direction: 'left',
            signal: 'Vehicle.ADAS.Proximity.Rear.Distance',
          },
          sensors: 'Distance Reading',
        },
      },
    ],
  },
  {
    title: 'Step 2: Analyze Person with Heavy Load',
    flows: [
      {
        offBoard: {
          smartPhone: '',
          p2c: null,
          cloud: 'Start Analysis',
        },
        v2c: {
          direction: 'right',
          signal: 'Vehicle.Cabin.Camera.Rear.IsActive',
        },
        onBoard: {
          sdvRuntime: 'Activate Camera',
          s2s: {
            direction: 'right',
            signal: 'Vehicle.Cabin.Camera.Rear.IsStreaming',
          },
          embedded: 'Configure Camera',
          s2e: {
            direction: 'right',
            signal: 'Vehicle.Cabin.Camera.Rear.IsPowered',
          },
          sensors: 'Capture Image',
        },
      },
      {
        offBoard: {
          smartPhone: 'Popup Quick Access Request',
          p2c: {
            direction: 'left',
            signal: 'User.Notification.QuickAccess',
          },
          cloud: 'Heavy Load Detected',
        },
        v2c: {
          direction: 'left',
          signal: 'Vehicle.ADAS.LoadDetection.IsConfirmed',
        },
        onBoard: {
          sdvRuntime: 'Send Detection Result',
          s2s: {
            direction: 'left',
            signal: 'Vehicle.ADAS.LoadDetection.Confidence',
          },
          embedded: 'Process Image Analysis',
          s2e: {
            direction: 'left',
            signal: 'Vehicle.Cabin.Camera.Rear.Quality',
          },
          sensors: 'Raw Image Data',
        },
      },
    ],
  },
  {
    title: 'Step 3: Open Trunk Automatically',
    flows: [
      {
        offBoard: {
          smartPhone: 'Quick Access Granted',
          p2c: {
            direction: 'right',
            signal: 'User.Authorization.Granted',
          },
          cloud: 'Authorize Opening',
        },
        v2c: {
          direction: 'right',
          signal: 'Vehicle.Body.Trunk.IsLocked',
        },
        onBoard: {
          sdvRuntime: 'Unlock Trunk',
          s2s: {
            direction: 'right',
            signal: 'Vehicle.Body.Trunk.IsOpen',
          },
          embedded: 'Control Motor',
          s2e: {
            direction: 'right',
            signal: 'Vehicle.Body.Trunk.Position',
          },
          sensors: 'Actuate Trunk',
        },
      },
      {
        offBoard: {
          smartPhone: 'Show Status',
          p2c: {
            direction: 'left',
            signal: 'User.Notification.Status',
          },
          cloud: 'Operation Complete',
        },
        v2c: {
          direction: 'left',
          signal: 'Vehicle.Body.Trunk.IsOpen',
        },
        onBoard: {
          sdvRuntime: 'Verify Status',
          s2s: {
            direction: 'left',
            signal: 'Vehicle.Body.Trunk.Position',
          },
          embedded: 'Monitor Position',
          s2e: {
            direction: 'left',
            signal: 'Vehicle.Body.Trunk.IsOpen',
          },
          sensors: 'Position Reading',
        },
      },
    ],
  },
]
