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
    backgroundColor: '#005072', // Tailwind gray-500 color
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
  const stopTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        onRecognize(transcript)
        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        if (stopTimeout.current) {
          clearTimeout(stopTimeout.current)
          stopTimeout.current = null
        }
        setIsListening(false)
      }

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event)
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    } else {
      console.warn('Speech Recognition API not supported in this browser.')
    }
  }, [onRecognize])

  const handleClick = () => {
    if (isListening) {
      recognition?.stop()
      setIsListening(false)
    } else {
      recognition?.start()
      setIsListening(true)

      // Delay stopping recognition
      stopTimeout.current = setTimeout(() => {
        recognition?.stop()
        setIsListening(false)
      }, 3000)
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
          <p className="text-xs font-medium">Speech to prompt</p>
        </>
      )}
    </div>
  )
}

export default DaSpeechToText
