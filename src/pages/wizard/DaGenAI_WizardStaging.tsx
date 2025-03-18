import DaText from '@/components/atoms/DaText'
import { useEffect, useState, useRef, createRef } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import DaGenAI_WizardRuntimeConnector from './DaGenAI_WizardRuntimeConnector'
import config from '@/configs/config'
import { cn } from '@/lib/utils'

const DEFAULT_KIT_SERVER = 'https://re01.digital.auto'

const TARGETS = [
  {
    name: 'Virtual WS',
    icon: '/imgs/targets/vm.png',
    prefix: 'Runtime-',
    version: 'v.1.0',
    state: { '3.1.1.1.1.1': '2.3.2' },
  },
  {
    name: 'Automation Kit',
    short_name: 'Kit-',
    icon: '/imgs/targets/automationKit.jpg',
    prefix: 'Kit-',
    version: 'v.1.0',
    state: { '3.1.1.1.1.1': '0.9.0' },
  },
  {
    name: 'Test Fleet',
    short_name: 'PilotCar-',
    icon: '/imgs/targets/pilotCar.png',
    prefix: 'PilotCar-',
    version: 'v.1.0',
    state: { '3.1.1.1.1.1': '2.3.0' },
  },
]

const DaGenAI_WizardStaging = () => {
  const [targets] = useState(TARGETS)
  // Global active runtime id (if needed)
  const [activeRtId, setActiveRtId] = useState<string>('')

  // Instead of a single log array, use an object keyed by target name.
  const [logs, setLogs] = useState<{ [key: string]: string[] }>({})

  // Global updating flag (could be extended per target if needed)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  // Create a ref mapping for each target.
  const runtimeRefs = useRef<{ [key: string]: any }>({})

  // New state for kit availability per target.
  const [availability, setAvailability] = useState<{ [key: string]: boolean }>(
    {},
  )

  // Timeout effect: for each target, if no log is received within 10 seconds,
  // add a timeout message then clear it after 3 seconds.
  useEffect(() => {
    if (isUpdating) {
      const timeoutDuration = 10000 // 10 seconds
      const timer = setTimeout(() => {
        setLogs((prevLogs) => {
          const newLogs = { ...prevLogs }
          targets.forEach((target) => {
            const targetLog = prevLogs[target.name] || []
            if (targetLog.length === 0) {
              newLogs[target.name] = [
                'Request timeout, please try again as the runtime may be busy or experiencing issues.',
              ]
            }
          })
          return newLogs
        })
        setIsUpdating(false)
        setTimeout(() => {
          setLogs((prevLogs) => {
            const newLogs = { ...prevLogs }
            targets.forEach((target) => {
              newLogs[target.name] = []
            })
            return newLogs
          })
        }, 3000)
      }, timeoutDuration)
      return () => clearTimeout(timer)
    }
  }, [isUpdating, logs, targets])

  return (
    <div className="flex w-full h-full items-center justify-center bg-slate-200">
      <div className="h-full  min-h-[400px] w-[90vw] min-w-[400px] xl:max-w-[70vw] ">
        <div className="mt-4 w-full">
          <div className="flex h-[40px] w-full bg-gray-200 text-da-gray-dark">
            <div className="flex grow items-center justify-center bg-gradient-to-r z-10 opacity-100 from-da-gradient-from to-da-gradient-to text-white rounded-lg font-bold">
              Stages
            </div>
          </div>
          <div className="flex space-x-6 mt-6">
            {targets.map((target) => {
              if (!runtimeRefs.current[target.name]) {
                runtimeRefs.current[target.name] = createRef()
              }
              return (
                <div
                  key={target.name}
                  className="flex min-w-[100px] bg-white h-[40vh] border rounded-lg p-4 flex-1 flex-col items-center justify-center overflow-x-hidden px-1 pb-2 pt-1 "
                >
                  <div className="flex w-full items-center justify-center">
                    <img
                      width={160}
                      src={target.icon}
                      alt={target.name}
                      className="rounded-lg"
                    />
                  </div>
                  <DaText
                    variant="regular-bold"
                    className="mt-8 text-da-gray-darkest !font-semibold"
                  >
                    {target.name}
                  </DaText>
                  <div className="mt-2">
                    <DaGenAI_WizardRuntimeConnector
                      targetPrefix={target.prefix || 'runtime-'}
                      kitServerUrl={config?.runtime?.url || DEFAULT_KIT_SERVER}
                      // Each connector instance notifies the parent of its active runtime.
                      onActiveRtChanged={(rtId: string | undefined) => {
                        console.log(
                          `Active runtime for ${target.name} is: ${rtId}`,
                        )
                        setActiveRtId(rtId || '')
                      }}
                      usedAPIs={[]}
                      onDeployResponse={(newLog: string, isDone: boolean) => {
                        // Update the log only for this target.
                        if (newLog) {
                          setLogs((prev) => {
                            const targetLog = prev[target.name] || []
                            const updatedLog = [...targetLog, newLog].slice(-3)
                            return { ...prev, [target.name]: updatedLog }
                          })
                        }
                        if (isDone) {
                          setIsUpdating(false)
                          setTimeout(() => {
                            setLogs((prev) => ({ ...prev, [target.name]: [] }))
                          }, 2000)
                        }
                      }}
                      hideLabel={true}
                      onKitAvailabilityChange={(available: boolean) => {
                        setAvailability((prev) => ({
                          ...prev,
                          [target.name]: available,
                        }))
                      }}
                      ref={runtimeRefs.current[target.name]}
                    />
                    {logs[target.name] && logs[target.name].length > 0 && (
                      <div className="mt-2 flex">
                        <div className="da-small-medium mr-2 line-clamp-3">
                          Response:
                        </div>
                        <div className="ml-2 bg-da-black text-da-white px-2 py-1.5 rounded da-label-tiny grow leading-tight">
                          {logs[target.name].map((entry, index) => (
                            <div key={index}>{entry}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <DaButton
                    variant="outline"
                    className={cn(
                      'my-1 w-[200px] !rounded-full mt-3',
                      !availability[target.name] &&
                        '!opacity-0 pointer-events-none',
                    )}
                    onClick={() => {
                      const currentConnector = runtimeRefs.current[target.name]
                      console.log(
                        `Deploying to ${target.name} using active runtime: `,
                        activeRtId,
                      )
                      if (
                        activeRtId &&
                        currentConnector &&
                        currentConnector.current
                      ) {
                        currentConnector.current.deploy()
                        setIsUpdating(true)
                      }
                    }}
                    size="sm"
                  >
                    Update
                  </DaButton>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DaGenAI_WizardStaging
