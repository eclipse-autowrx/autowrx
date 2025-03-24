import DaText from '@/components/atoms/DaText'
import { useEffect, useState, useRef, createRef } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import DaGenAI_WizardRuntimeConnector from './DaGenAI_WizardRuntimeConnector'
import config from '@/configs/config'
import { cn } from '@/lib/utils'
import ProgressBar from './ProgressBar'
import { PiInfo } from 'react-icons/pi'
import DaTooltip from '@/components/atoms/DaTooltip'

const DEFAULT_KIT_SERVER = 'https://re01.digital.auto'

const TARGETS = [
  {
    name: 'Virtual WS',
    icon: '/imgs/targets/vm.png',
    prefix: 'Runtime-',
    version: 'v.1.0',
  },
  {
    name: 'Automation Kit',
    short_name: 'Kit-',
    icon: '/imgs/targets/automationKit.jpg',
    prefix: 'Kit-',
    version: 'v.1.0',
  },
  {
    name: 'Test Fleet',
    short_name: 'PilotCar-',
    icon: '/imgs/targets/pilotCar.png',
    prefix: 'PilotCar-',
    version: 'v.1.0',
  },
]

const DaGenAI_WizardStaging = () => {
  const [targets] = useState(TARGETS)

  // Store active runtime id per target.
  const [activeRtIds, setActiveRtIds] = useState<{ [key: string]: string }>({})

  // Current log per target (only the latest log).
  const [logs, setLogs] = useState<{ [key: string]: string }>({})

  // Progress state for each target (0 to 6 steps).
  const [progress, setProgress] = useState<{ [key: string]: number }>({})

  // Updating state per target.
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({})

  // Create a ref mapping for each target.
  const runtimeRefs = useRef<{ [key: string]: any }>({})

  // Kit availability per target.
  const [availability, setAvailability] = useState<{ [key: string]: boolean }>(
    {},
  )

  // Timeout effect: if no log is received within 10 seconds for a target,
  // add a timeout message then clear logs and reset progress for that target.
  useEffect(() => {
    const timers: { [key: string]: ReturnType<typeof setTimeout> } = {}
    targets.forEach((target) => {
      if (updating[target.name]) {
        timers[target.name] = setTimeout(() => {
          setLogs((prev) => {
            // Only set the timeout log if there's no current log.
            if (!prev[target.name]) {
              return {
                ...prev,
                [target.name]:
                  'Request timeout, please try again as the runtime may be busy or experiencing issues.',
              }
            }
            return prev
          })
          setUpdating((prev) => ({ ...prev, [target.name]: false }))
          // After 3 seconds, clear the log and reset progress for this target.
          setTimeout(() => {
            setLogs((prev) => ({ ...prev, [target.name]: '' }))
            setProgress((prev) => ({ ...prev, [target.name]: 0 }))
          }, 3000)
        }, 10000)
      }
    })
    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer))
    }
  }, [updating, targets])

  return (
    <div className="flex w-full h-full items-center justify-center bg-slate-200">
      <div className="h-full min-h-[400px] w-[90vw] min-w-[400px] xl:max-w-[70vw]">
        <div className="mt-4 w-full">
          <div className="flex h-[40px] w-full bg-gray-200 text-da-gray-dark">
            <div className="flex grow items-center justify-center bg-gradient-to-r z-10 opacity-100 from-da-gradient-from to-da-gradient-to text-white rounded-lg font-bold">
              Stages
            </div>
          </div>
          <div className="flex space-x-6 mt-6">
            {targets.map((target) => {
              // Initialize ref only once.
              if (!runtimeRefs.current[target.name]) {
                runtimeRefs.current[target.name] = createRef()
              }
              const targetLog = logs[target.name] || ''
              const isTimeout = targetLog.includes('Request timeout')
              // Show progress bar only if kit is available and updating or progress is > 0.
              const showProgressBar =
                availability[target.name] &&
                (updating[target.name] || (progress[target.name] || 0) > 0)
              return (
                <div
                  key={target.name}
                  className="relative flex min-w-[100px] bg-white h-[40vh] border rounded-lg p-4 flex-1 flex-col items-center justify-center overflow-x-hidden px-1 pb-2 pt-1"
                >
                  {showProgressBar && (
                    <ProgressBar
                      value={progress[target.name] || 0}
                      max={6}
                      type="default"
                      className="w-full absolute bottom-0 right-0"
                    />
                  )}
                  {targetLog &&
                    (isTimeout ? (
                      <DaTooltip
                        content={<div className="text-sm">{targetLog}</div>}
                      >
                        <PiInfo
                          className={cn(
                            'absolute bottom-4 right-2 size-6 text-amber-500',
                          )}
                        />
                      </DaTooltip>
                    ) : (
                      <div
                        className={cn(
                          'absolute bottom-4 left-0 right-0 px-4 text-sm w-full truncate text-center text-da-gray-medium',
                        )}
                      >
                        {targetLog}
                      </div>
                    ))}
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
                      targetPrefix={target.prefix}
                      kitServerUrl={config?.runtime?.url || DEFAULT_KIT_SERVER}
                      onActiveRtChanged={(rtId: string | undefined) => {
                        setActiveRtIds((prev) => ({
                          ...prev,
                          [target.name]: rtId || '',
                        }))
                      }}
                      usedAPIs={[]}
                      onDeployResponse={(newLog: string, isDone: boolean) => {
                        // Replace the log with the current log (do not accumulate).
                        if (newLog) {
                          setLogs((prev) => ({
                            ...prev,
                            [target.name]: newLog,
                          }))
                          setProgress((prev) => {
                            const current = prev[target.name] || 0
                            return {
                              ...prev,
                              [target.name]: current < 6 ? current + 1 : 6,
                            }
                          })
                        }
                        if (isDone) {
                          setUpdating((prev) => ({
                            ...prev,
                            [target.name]: false,
                          }))
                          setProgress((prev) => ({
                            ...prev,
                            [target.name]: 6,
                          }))
                          // After 3 seconds, hide progress bar and clear log.
                          setTimeout(() => {
                            setLogs((prev) => ({ ...prev, [target.name]: '' }))
                            setProgress((prev) => ({
                              ...prev,
                              [target.name]: 0,
                            }))
                          }, 3000)
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
                  </div>
                  <DaButton
                    variant="outline"
                    className={cn(
                      'my-1 w-[200px] !rounded-full mt-3',
                      // Disable the button if the kit is not available.
                      !availability[target.name] &&
                        '!opacity-0 pointer-events-none',
                    )}
                    onClick={() => {
                      // Only trigger deploy if kit is available.
                      if (!availability[target.name]) return
                      const currentConnector = runtimeRefs.current[target.name]
                      if (
                        activeRtIds[target.name] &&
                        currentConnector &&
                        currentConnector.current
                      ) {
                        // Reset progress and log for this target on deploy.
                        setProgress((prev) => ({ ...prev, [target.name]: 0 }))
                        setLogs((prev) => ({ ...prev, [target.name]: '' }))
                        setUpdating((prev) => ({
                          ...prev,
                          [target.name]: true,
                        }))
                        currentConnector.current.deploy()
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
