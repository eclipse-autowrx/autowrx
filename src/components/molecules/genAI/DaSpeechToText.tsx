import { DaButton } from '@/components/atoms/DaButton'
import { cn } from '@/lib/utils'
import React, { useState, useEffect, useRef } from 'react'
import {
  TbMicrophone,
  TbMicrophoneFilled,
  TbPlayerStopFilled,
} from 'react-icons/tb'

type DaSpeechToTextProps = {
  onRecognize: (text: string) => void
}

const BouncingDotsLoader = () => {
  const dotStyle = {
    width: '5px',
    height: '5px',
    margin: '0 2px',
    borderRadius: '50%',
    backgroundColor: '#005072',
    animation: 'bounce 0.6s infinite alternate',
  }

  const bounceKeyframes = `
    @keyframes bounce {
      0% { transform: translateY(0); opacity: 1; }
      100% { transform: translateY(-4px); opacity: 0.3; }
    }
  `

  return (
    <>
      <style>{bounceKeyframes}</style>
      <div className="flex items-center justify-center">
        <div style={{ ...dotStyle, animationDelay: '0s' }}></div>
        <div style={{ ...dotStyle, animationDelay: '0.2s' }}></div>
        <div style={{ ...dotStyle, animationDelay: '0.4s' }}></div>
      </div>
    </>
  )
}

const DaSpeechToText: React.FC<DaSpeechToTextProps> = ({ onRecognize }) => {
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [accumulatedText, setAccumulatedText] = useState<string>('') // State to accumulate recognized text
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = true // Keep listening until explicitly stopped
      recognitionInstance.interimResults = false
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.results.length - 1][0].transcript
        // console.log('Recognized:', transcript)

        setAccumulatedText((prevText) => {
          const updatedText = prevText + ' ' + transcript // Use the previous state value to accumulate
          // console.log('Accumulated:', updatedText.trim())
          onRecognize(updatedText.trim()) // Pass the updated accumulated text to onRecognize
          return updatedText.trim() // Return the new state
        })

        // Clear any previous timeout, if applicable
        if (inactivityTimeout.current) {
          clearTimeout(inactivityTimeout.current)
        }

        // Restart the inactivity timeout for the next speech segment
        inactivityTimeout.current = setTimeout(() => {
          recognitionInstance.stop()
        }, 3000)
      }

      recognitionInstance.onend = () => {
        if (isListening) {
          // Restart recognition if it was interrupted due to a pause
          // console.log('Restarting recognition...')
          recognitionInstance.start()
        } else {
          // Clean up the timeout and stop listening
          setIsListening(false) // Ensure isListening is set to false
          if (inactivityTimeout.current) {
            clearTimeout(inactivityTimeout.current)
            inactivityTimeout.current = null
          }
        }
      }
      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event)
        setIsListening(false)
        if (inactivityTimeout.current) {
          clearTimeout(inactivityTimeout.current)
          inactivityTimeout.current = null
        }
      }

      setRecognition(recognitionInstance)
    } else {
      console.warn('Speech Recognition API not supported in this browser.')
    }
  }, [onRecognize, accumulatedText])

  const handleClick = () => {
    if (isListening) {
      // Stop the recognition and prevent restarting
      if (recognition) {
        recognition.stop()
        recognition.onend = () => {
          setIsListening(false) // Update the state only after the recognition has stopped
        }
      }
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current)
        inactivityTimeout.current = null
      }
    } else {
      // Start recognition and clear accumulated text
      setAccumulatedText('') // Clear accumulated text before starting a new session
      setIsListening(true)
      recognition?.start()
    }
  }

  return (
    <DaButton
      variant="plain"
      size="sm"
      className={cn(
        'flex cursor-pointer items-center rounded-lg p-1 px-2 text-da-primary-500 hover:bg-da-primary-100',
        isListening && 'bg-da-primary-100',
      )}
      onClick={handleClick}
    >
      {isListening ? (
        <>
          <BouncingDotsLoader />
          <TbPlayerStopFilled className="ml-1 size-4 text-da-primary-500" />
        </>
      ) : (
        <>
          <TbMicrophoneFilled className="mr-1 size-6 text-da-primary-500" />
          <p className="font-medium">Voice input</p>
        </>
      )}
    </DaButton>
  )
}

export default DaSpeechToText
