import React, { useState, useEffect } from 'react'
import { DaButton } from '../atoms/DaButton'
import { executeAction, executeActionSequence, Action } from '@/services/automation.service'

const DaTestAutomation: React.FC = () => {

    const [isRunning, setIsRunning] = useState(false)
    const [selectedTest, setSelectedTest] = useState<string>('single')

    useEffect(() => {
        console.log('DaTestAutomation loaded')
        return () => {
            console.log('DaTestAutomation unloaded')
        }
    }, [])

    const testClickAction = async () => {
        setIsRunning(true)
        console.log('Starting single action test...')

        try {
            const action: Action = {
                name: '',
                path: `@[/]:<dataid:btn-launch-vehicle-models>`,
                actionType: 'show_tooltip',
                value: null,
                tooltipMessage: 'Click me to open Vehicle Models',
                delayBefore: 1000,
                delayAfter: 1000
            }

            console.log(`Executing action: ${action.actionType} on ${action.path}`)
            await executeAction(action)
            console.log('Single action test completed successfully!')
        } catch (error) {
            console.log(`Error in single action test: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setIsRunning(false)
        }
    }

    const runSequenceTest = async () => {
        setIsRunning(true)
        console.log('Starting action sequence test...')

        try {
            const actionSequence: Action[] = [
                {
                    name: '1',
                    path: `@[/]:<dataid:btn-launch-graphic>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click me to open Model Gallery',
                    delayBefore: 1000,
                    delayAfter: 1000,
                    autoHideAfter: 3000
                },
                {
                    name: '2',
                    path: `@[/]:<dataid:btn-launch-documentation>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click me to open Documentation',
                    delayBefore: 1500,
                    delayAfter: 1500,
                    autoHideAfter: 3000
                },
                {
                    name: '3',
                    path: `@[/]:<dataid:btn-launch-video>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click me to open Video',
                    delayBefore: 2000,
                    delayAfter: 2000,
                    autoHideAfter: 3000
                },
                {
                    name: '4',
                    path: `@[/]:<dataid:btn-launch-vehicle-models>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click me to open Vehicle Models',
                    delayBefore: 1000,
                    delayAfter: 1000,
                    autoHideAfter: 3000
                }
            ]

            console.log(`Executing sequence of ${actionSequence.length} actions...`)
            await executeActionSequence(actionSequence)
            console.log('Action sequence test completed successfully!')
        } catch (error) {
            console.log(`Error in sequence test: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="fixed bottom-1 left-1 z-50 w-[400px] h-fit p-0 mx-auto overflow-y-auto">
            <div className="bg-amber-50 rounded-lg shadow-md p-2">
                <div className="text-lg font-bold mb-1 text-gray-800">
                    Automation Service Test Component
                </div>

                {/* Test Selection */}
                <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Test Type:
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        <DaButton
                            size="sm"
                            onClick={() => {
                                if (!isRunning) {
                                    setSelectedTest('single')
                                    testClickAction()
                                }
                            }}
                            className={`px-3 py-2 rounded-md text-sm ${selectedTest === 'single'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            disabled={isRunning}
                        >
                            Single Action Test
                        </DaButton>
                        <DaButton
                            size="sm"
                            onClick={() => {
                                if (!isRunning) {
                                    setSelectedTest('sequence')
                                    runSequenceTest()
                                }
                            }}
                            className={`px-3 py-2 rounded-md text-sm ${selectedTest === 'sequence'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            disabled={isRunning}
                        >
                            Action Sequence Test
                        </DaButton>
                    </div>
                </div>

                {/* Control Buttons */}
                {isRunning && (
                    <div className="flex gap-2 mb-2">
                        <DaButton
                            onClick={() => setIsRunning(false)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                            Stop
                        </DaButton>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DaTestAutomation
