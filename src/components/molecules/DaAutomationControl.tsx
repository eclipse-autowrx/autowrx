import React, { useState, useEffect } from 'react'
import { FaPlay } from 'react-icons/fa'
import {
  executeAction,
  parseActionPath,
  Action,
  findElement,
} from '@/services/automation.service'
import useGlobalStore from '@/stores/globalStore'
import { FaSpinner, FaCheckCircle } from 'react-icons/fa'
import { FaTimes } from 'react-icons/fa'
import { shallow } from 'zustand/shallow'

interface ActionNodeProps {
  index: number
  action: Action
  onClick?: () => void
}

const ActionNode = ({ index, action, onClick }: ActionNodeProps) => {
  return (
    <>
      {index > 0 && (
        <div className="flex items-center justify-center mx-0 opacity-80 px-1">
          <svg
            width="17.85"
            height="50.4"
            viewBox="0 0 42 108"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 18L24 54L12 90" stroke="#42267e" strokeWidth="5" />
          </svg>
        </div>
      )}
      <div
        onClick={onClick}
        className="flex flex-col p-1 items-center justify-center text-white rounded-lg hover:bg-[#ffffff22]"
      >
        {action?.status == 'in_progress' && (
          <FaSpinner className="animate-spin text-[#42267e] text-xl mb-1" />
        )}
        {action?.status == 'finished' && (
          <FaCheckCircle className="text-[#42267e] text-xl mb-1" />
        )}
        {action?.status !== 'in_progress' && action?.status !== 'finished' && (
          <div className="w-6 h-6 rounded-full border-[3px] border-[#42267e] text-[#42267e] text-sm grid place-items-center">
            {index + 1}
          </div>
        )}
        <div
          className="mt-1 text-[12px] font-regular text-[#42267e] text-center max-w-[110px] 
                        line-clamp-2 leading-tight h-[30px]"
        >
          {action.name || action.actionType}
        </div>
        {/* <div className="text-[9px] font-mono h-4">{action?.status}</div> */}
      </div>
    </>
  )
}

const DaAutomationControl: React.FC = () => {
  const [
    isShowedAutomationControl,
    automationSequence,
    setIsShowedAutomationControl,
    setAutomationSequence,
    setAutomationSequenceActionAt,
  ] = useGlobalStore(
    (state) => [
      state.isShowedAutomationControl,
      state.automationSequence,
      state.setIsShowedAutomationControl,
      state.setAutomationSequence,
      state.setAutomationSequenceActionAt,
    ],
    shallow,
  )

  const [isRunning, setIsRunning] = useState(false)
  const [isAutoStart, setIsAutoStart] = useState(false)
  const [isAllowNext, setIsAllowNext] = useState(false)
  const [isWaitingForUser, setIsWaitingForUser] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [currentActionIndex, setCurrentActionIndex] = useState(0)

  const [triggerSource, setTriggerSource] = useState('')
  const [message, setMessage] = useState('')

  const onDialogClose = () => {
    if (setIsShowedAutomationControl) {
      setIsShowedAutomationControl(false)
    }
  }

  const handleRequest = (request: any) => {
    if (!request || !request.cmd) {
      console.error('Invalid request received:', request)
    }

    if (request.type === 'automation_control') {
      const { sequence } = request
      if (sequence) {
        if (setAutomationSequence) {
          // console.log('setAutomationSequence', sequence)
          setAutomationSequence(sequence)

          if(sequence.auto_start) {
            setMessage('Auto start automation sequence after 3 seconds')
            setTimeout(() => {
              setMessage('')
              runActionAtIndex(0)
            }, 3000)
          }
        }
        if (setIsShowedAutomationControl) {
          setIsShowedAutomationControl(true)
        }
      } else {
        console.error('No sequence provided in request')
      }
    } else {
      console.warn('Unknown request type:', request.type)
    }
  }

  const startListeningForAutomationControl = () => {
    // method 1, test with terminal by direct call window fucntion
    if (!(window as any).handleRequest) {
      ; (window as any).handleRequest = handleRequest
    }

    // method 2, listen for messages window.postMessage, this can be post from iframe or other windows
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'automation_control') {
        handleRequest(event.data)
      }
    })
  }

  useEffect(() => {
    // Check if any action is ongoing or all actions are finished
    const checkActionStatus = (sequence: any) => {
      if (!sequence?.actions?.length) {
        setIsRunning(false)
        return
      }

      const inProgressActions = sequence.actions.filter(
        (action: any) => 'in_progress' == action.status,
      )

      const finishedActions = sequence.actions.filter(
        (action: any) => 'finished' == action.status,
      )

      setIsRunning(inProgressActions.length + finishedActions.length > 0)
      setIsAllowNext(
        inProgressActions.length == 0 &&
        finishedActions.length > 0 &&
        finishedActions.length < sequence.actions.length,
      )
      setIsAutoStart(!!sequence.auto_start)
      setIsWaitingForUser(inProgressActions.length > 0)
      setIsFinished(
        finishedActions.length == sequence.actions.length &&
        inProgressActions.length == 0,
      )
    }

    // Run the check whenever automationSequence changes
    checkActionStatus(automationSequence)
  }, [automationSequence])

  useEffect(() => {
    startListeningForAutomationControl()
  }, [])

  const setActionStatus = (
    index: number,
    status: 'in_progress' | 'finished',
  ) => {
    if (!automationSequence || !setAutomationSequence) return

    // const newSequence = JSON.parse(JSON.stringify(automationSequence))
    if (
      automationSequence.actions &&
      automationSequence.actions[index] &&
      setAutomationSequenceActionAt
    ) {
      setAutomationSequenceActionAt(index, {
        ...automationSequence.actions[index],
        status: status,
      })
    }

    // handle auto next
    if (status == 'finished') {
      console.log(`Action ${index} finished, checking for next action...`)
      if (
        automationSequence.auto_run_next &&
        index < automationSequence.actions.length - 1
      ) {
        setTimeout(async () => {
          const nextIndex = index + 1
          runActionAtIndex(nextIndex)
        }, 200)
      } else {
        console.log('No auto run next action configured or last action reached')
      }
    }
  }

  const runActionAtIndex = (index: number) => {
    if (!automationSequence || !automationSequence.actions) return

    const action = automationSequence.actions[index]
    if (!action) return

    console.log(`Run action at index ${index}`)

    setActionStatus(index, 'in_progress')
    executeAction(action).then(() => {
      runnerCheckActionFinished(action, index)
    })
    setCurrentActionIndex(index)
  }

  const runnerCheckActionFinished = (action: Action, index: number) => {
    if (
      !action.finish_condition ||
      ['automatic'].includes(action.finish_condition.type)
    ) {
      setTimeout(() => {
        setActionStatus(index, 'finished')
      }, 2000)
      return
    }

    const checkRunner = (action: Action, timeout: number = 60000 * 10) => {
      return new Promise((resolve) => {
        const startTime = Date.now()
        const interval = setInterval(() => {
          if (Date.now() - startTime > timeout) {
            clearInterval(interval)
            resolve(false)
          }

          let text = ''
          let condition = action.finish_condition?.type || 'automatic'

          switch (condition) {
            case 'location-match':
              if (!action.finish_condition?.expectedValue) {
                clearInterval(interval)
                resolve(true)
              }
              // If target_url contains params like /model/:model_id/prototype/:prototype_id/code
              // Convert it to a regex and test against window.location.pathname (with optional query string)
              if (action.finish_condition?.expectedValue) {
                // Remove trailing slash for consistency
                const pattern = action.finish_condition.expectedValue.replace(
                  /\/$/,
                  '',
                )
                // Replace :param with wildcard, escape slashes
                const regexPattern = pattern
                  .replace(/:[^/]+/g, '[^/]+')
                  .replace(/\//g, '\\/')
                // Allow for optional query string at the end
                const regex = new RegExp(`^${regexPattern}(\\?.*)?$`)
                // Remove trailing slash from pathname for matching
                const currentPath =
                  window.location.pathname.replace(/\/$/, '') +
                  window.location.search
                if (regex.test(currentPath)) {
                  clearInterval(interval)
                  resolve(true)
                } else {
                  console.log(
                    `Location does not match: ${currentPath} does not match ${action.finish_condition?.expectedValue}`,
                  )
                }
              }
              break
            default:
              break
          }

          let element = null
          if (action.finish_condition?.target_element_path) {
            const { targetRoute, identifierType, identifierValue } =
              parseActionPath(action.finish_condition?.target_element_path)
            element = findElement(identifierType, identifierValue) as any
            if (!element) {
              console.warn(
                `Element not found for action ${action.name} at index ${index}. Path: ${action.finish_condition.target_element_path}`,
              )
            }
          }
          //   console.log(
          //     `Checking condition: ${condition} for action: ${action.name} at element: ${element}`,
          //   )

          if (element) {
            switch (condition) {
              case 'element_exists':
                if (element) {
                  clearInterval(interval)
                  resolve(true)
                }
                break
              case 'element_not_exists':
                if (!element) {
                  clearInterval(interval)
                  resolve(true)
                }
                break
              case 'element_visible':
                // Check if element is visible, considering parent visibility as well
                const isVisible = (el: HTMLElement | null): boolean => {
                  if (!el) return false
                  if (el.offsetWidth === 0 || el.offsetHeight === 0)
                    return false
                  const style = window.getComputedStyle(el)
                  if (
                    style.display === 'none' ||
                    style.visibility === 'hidden' ||
                    style.opacity === '0'
                  )
                    return false
                  //   if (el.parentElement) return isVisible(el.parentElement)
                  return true
                }
                if (isVisible(element)) {
                  clearInterval(interval)
                  resolve(true)
                } else {
                  console.log('Element is not visible:', element)
                }
                break
              case 'element_invisible':
                if (element.offsetWidth === 0 && element.offsetHeight === 0) {
                  clearInterval(interval)
                  resolve(true)
                }
                break
              case 'has-value':
                // Implement has value logic here
                if (
                  element instanceof HTMLInputElement ||
                  element instanceof HTMLTextAreaElement
                ) {
                  text = element.value
                } else {
                  text = element.textContent || ''
                }
                if (text.trim().length > 0) {
                  clearInterval(interval)
                  resolve(true)
                }
                break
              case 'text_contains':
                // Implement text contains logic here
                // For input or textarea, check value; otherwise, check textContent
                if (
                  element instanceof HTMLInputElement ||
                  element instanceof HTMLTextAreaElement
                ) {
                  text = element.value
                } else {
                  text = element.textContent || ''
                }
                if (text.includes(action.finish_condition?.expectedValue)) {
                  clearInterval(interval)
                  resolve(true)
                }
                break
              case 'text_not_contains':
                // Implement text not contains logic here
                if (
                  element instanceof HTMLInputElement ||
                  element instanceof HTMLTextAreaElement
                ) {
                  text = element.value
                } else {
                  text = element.textContent || ''
                }
                if (!text.includes(action.finish_condition?.expectedValue)) {
                  clearInterval(interval)
                  resolve(true)
                }

                break
              case 'element_clicked':
                // Implement element clicked logic here
                if (element) {
                  const handleClick = () => {
                    clearInterval(interval)
                    element.removeEventListener('click', handleClick)
                    resolve(true)
                  }
                  element.addEventListener('click', handleClick, { once: true })
                }
                break
              default:
                clearInterval(interval)
                resolve(false)
            }
          }
        }, 1000)
      })
    }

    if (!action.finish_condition?.type) {
      setTimeout(() => {
        setActionStatus(index, 'finished')
      }, 1000)
    } else {
      checkRunner(action, 30000)
        .then((result) => {
          if (result) {
            setActionStatus(index, 'finished')
          } else {
            setActionStatus(index, 'in_progress')
          }
        })
        .catch((error) => {
          console.error('Error checking action condition:', error)
          setActionStatus(index, 'in_progress')
        })
    }
  }

  if (!isShowedAutomationControl || !automationSequence) return <></>

  return (
    <div
      className="fixed bottom-1 left-1 right-1 z-[10000] w-fit h-fit
                p-0 rounded  text-white mx-auto overflow-y-auto shadow-2xl shadow-slate-500"
    >
      <div className="">
        <div className="px-2 py-1 flex items-center bg-gradient-purple">
          <div className="text-white font-bold text-sm">
            {automationSequence.name || ''}
          </div>
          <div className="ml-4 w-fit flex items-center justify-center">
            {!isRunning && !isAutoStart && (
              <div
                className="rounded cursor-pointer purple-gradient-button px-3 py-0.5 text-sm 
                            font-semibold text-white hover:opacity-60 shadow-sm select-none flex items-center"
                onClick={() => {
                  runActionAtIndex(0)
                }}
              >
                Start
                <FaPlay className="ml-2 text-[10px] text-white" />
              </div>
            )}
            {isAllowNext && (
              <div
                className="rounded cursor-pointer purple-gradient-button px-3 py-0.5 text-sm 
                            font-semibold text-white hover:opacity-60 shadow-sm select-none flex items-center"
                onClick={() => {
                  runActionAtIndex(currentActionIndex + 1)
                }}
              >
                Next
                <FaPlay className="ml-2 text-[10px] text-white" />
              </div>
            )}

            {isWaitingForUser && (
              <div className="text-xs leading-tight animate-pulse text-yellow-400 font-mono font-semibold">
                Your turn: follow the on-screen tooltip
              </div>
            )}
            {isFinished && (
              <div className="text-xs leading-tight  text-emerald-400 font-mono font-bold">
                Congratulations! All actions are finished!
              </div>
            )}

            {message && (
              <div className="text-xs leading-tight text-white font-mono font-bold animate-pulse">
                {message}
              </div>
            )}
          </div>

          <div className="grow"></div>
          <div
            className="p-1 select-none cursor-pointer hover:opacity-50"
            onClick={onDialogClose}
          >
            <FaTimes className="text-lg" />
          </div>
        </div>
        {/* <div className="border-b border-white opacity-20"></div> */}
        <div className="px-4 py-2 flex items-center justify-center space-x-2 bg-[#d4b3dd]">
          {automationSequence.actions &&
            automationSequence.actions.length > 0 &&
            automationSequence.actions.map((action: Action, index: number) => (
              <ActionNode
                key={index}
                index={index}
                action={action}
                onClick={() => {
                  runActionAtIndex(index)
                }}
              />
            ))}
        </div>
      </div>
    </div>
  )
}

export default DaAutomationControl
