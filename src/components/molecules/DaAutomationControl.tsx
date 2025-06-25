import React, { useState, useEffect } from 'react'
import { DaButton } from '../atoms/DaButton'
import {
  executeAction,
  parseActionPath,
  Action,
  findElement,
} from '@/services/automation.service'
import useGlobalStore from '@/stores/globalStore'
import { FaSpinner, FaCheckCircle } from 'react-icons/fa'
import { FaTimes } from 'react-icons/fa'

interface ActionNodeProps {
  index: number
  action: Action
  onClick?: () => void
}

const ActionNode = ({ index, action, onClick }: ActionNodeProps) => {
  let icon
  switch (action.status) {
    case 'in_progress':
      icon = <FaSpinner className="animate-spin text-white text-xl mb-1" />
      break
    case 'finished':
      icon = <FaCheckCircle className="text-white text-xl mb-1" />
      break
    default:
      icon = (
        <div className="w-6 h-6 rounded-full border-[3px] border-white text-white text-sm grid place-items-center">
          {index + 1}
        </div>
      )
  }

  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center justify-center text-white cursor-pointer hover:underline"
    >
      {icon}
      <span className="mt-1 text-[12px] font-medium text-white text-center">
        {action.name || action.actionType}
      </span>
    </div>
  )
}

const DaAutomationControl: React.FC = () => {
  const [
    isShowedAutomationControl,
    automationSequence,
    setIsShowedAutomationControl,
    setAutomationSequence,
  ] = useGlobalStore((state) => [
    state.isShowedAutomationControl,
    state.automationSequence,
    state.setIsShowedAutomationControl,
    state.setAutomationSequence,
  ])
  const [isRunning, setIsRunning] = useState(false)

  const handleRequest = (request: any) => {
    if (!request || !request.cmd) {
      console.error('Invalid request received:', request)
    }

    if (request.type === 'automation_control') {
      const { sequence } = request
      if (sequence) {
        if (setAutomationSequence) {
          setAutomationSequence(sequence)
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
      ;(window as any).handleRequest = handleRequest
    }

    // method 2, listen for messages window.postMessage, this can be post from iframe or other windows
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'automation_control') {
        handleRequest(event.data)
      }
    })
  }

  useEffect(() => {
    startListeningForAutomationControl()
  }, [])

  const setActionStatus = (
    index: number,
    status: 'in_progress' | 'finished',
  ) => {
    if (!automationSequence || !setAutomationSequence) return

    const newSequence = JSON.parse(JSON.stringify(automationSequence))
    if (newSequence.actions && newSequence.actions[index]) {
      newSequence.actions[index].status = status
      setAutomationSequence(newSequence)
    }

    // handle auto next
    if (
      status == 'finished' &&
      newSequence.auto_run_next &&
      index < newSequence.actions.length - 1
    ) {
      setTimeout(() => {
        const nextIndex = index + 1
        if (newSequence.actions[nextIndex]) {
          setActionStatus(nextIndex, 'in_progress')
          executeAction(newSequence.actions[nextIndex])
          runnerCheckActionFinished(newSequence.actions[nextIndex], nextIndex)
        }
      }, 2000)
    }
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

    const checkRunner = (action: Action, timeout: number=60000) => {
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
                  console.log(
                    `Location matches: ${currentPath} matches ${action.finish_condition?.expectedValue}`,
                  )
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
          console.log(action.finish_condition)
          if (action.finish_condition?.target_element_path) {
            console.log(action.finish_condition?.target_element_path)
            const { targetRoute, identifierType, identifierValue } =
              parseActionPath(action.finish_condition?.target_element_path)
            // console.log(
            //   `Parsed action path: identifierType ${identifierType} identifierValue ${identifierValue}`,
            // )
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
                  console.log('getComputedStyle', style)
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
      className="fixed bottom-1 left-1 right-1 z-50 w-fit h-fit
                pl-4 pr-1 py-1 rounded bg-orange-400 text-white mx-auto overflow-y-auto"
    >
      <div className="flex space-x-2">
        <div className="flex items-center justify-center py-1 space-x-6">
          {automationSequence.actions &&
            automationSequence.actions.length > 0 &&
            automationSequence.actions.map((action: Action, index: number) => (
              <ActionNode
                key={index}
                index={index}
                action={action}
                onClick={() => {
                  setActionStatus(index, 'in_progress')
                  executeAction(action)
                  runnerCheckActionFinished(action, index)
                }}
              />
            ))}
        </div>

        <DaButton
          size="sm"
          onClick={() => {
            if (setIsShowedAutomationControl) {
              setIsShowedAutomationControl(false)
            }
          }}
          variant="plain"
          className="ml-8 px-2 py-2 rounded-md text-sm !text-white !bg-transparent hover:!bg-gray-600 hover:!text-white transition-colors duration-200"
        >
          <FaTimes className="text-lg" />
        </DaButton>
      </div>
    </div>
  )
}

export default DaAutomationControl
