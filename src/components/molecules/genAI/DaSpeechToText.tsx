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
  const [accumulatedText, setAccumulatedText] = useState<string>('')
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null)
  const manuallyStopped = useRef<boolean>(false) // Track whether the mic was stopped manually

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = false
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.results.length - 1][0].transcript

        setAccumulatedText((prevText) => {
          const updatedText = prevText + ' ' + transcript
          onRecognize(updatedText.trim())
          return updatedText.trim()
        })

        if (inactivityTimeout.current) {
          clearTimeout(inactivityTimeout.current)
        }

        inactivityTimeout.current = setTimeout(() => {
          recognitionInstance.stop()
        }, 3000)
      }

      recognitionInstance.onend = () => {
        if (isListening && !manuallyStopped.current) {
          recognitionInstance.start()
        } else {
          setIsListening(false)
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
  }, [onRecognize])

  const handleClick = () => {
    if (isListening) {
      if (recognition) {
        manuallyStopped.current = true // Set the manual stop flag
        recognition.stop()
        recognition.onend = () => {
          setIsListening(false)
        }
      }
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current)
        inactivityTimeout.current = null
      }
    } else {
      setAccumulatedText('')
      onRecognize('')
      manuallyStopped.current = false // Reset the manual stop flag
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
