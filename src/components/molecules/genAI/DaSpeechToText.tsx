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
        const updatedText = accumulatedText + ' ' + transcript // Update accumulated text
        console.log('Recognized:', transcript)
        console.log('Accumulated:', updatedText)
        setAccumulatedText(updatedText.trim()) // Update state with the new accumulated text
        onRecognize(updatedText.trim()) // Pass the updated accumulated text to onRecognize

        // Reset the inactivity timeout when new speech is detected
        if (inactivityTimeout.current) {
          clearTimeout(inactivityTimeout.current)
        }
        inactivityTimeout.current = setTimeout(() => {
          recognitionInstance.stop()
          setIsListening(false)
        }, 5000) // 5 seconds timeout
      }

      recognitionInstance.onend = () => {
        if (isListening) {
          // Restart recognition automatically if still in listening mode
          recognitionInstance.start()
        } else {
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
      recognition?.stop()
      setIsListening(false)
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current)
        inactivityTimeout.current = null
      }
    } else {
      setAccumulatedText('') // Clear accumulated text before starting a new session
      recognition?.start()
      setIsListening(true)

      // Start the inactivity timeout when recognition starts
      inactivityTimeout.current = setTimeout(() => {
        recognition?.stop()
        setIsListening(false)
      }, 5000) // 5 seconds timeout
    }
  }

  return (
    <div
      className="flex cursor-pointer items-center rounded-lg bg-da-primary-100 p-1 px-2 text-da-primary-500 hover:opacity-80"
      onClick={handleClick}
    >
      {isListening ? (
        <>
          <BouncingDotsLoader />
          <TbPlayerStopFilled className="ml-1 size-4" />
        </>
      ) : (
        <>
          <TbMicrophoneFilled className="mr-1 size-3.5" />
          <p className="text-xs font-medium">Voice input</p>
        </>
      )}
    </div>
  )
}

export default DaSpeechToText
