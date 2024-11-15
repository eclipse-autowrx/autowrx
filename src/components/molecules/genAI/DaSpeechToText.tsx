import React, { useState, useEffect, useRef, lazy } from 'react'
import { TbMicrophoneFilled, TbPlayerStopFilled } from 'react-icons/tb'
import { cn } from '@/lib/utils'
import { retry } from '@/lib/retry'

import {
  AudioConfig,
  Recognizer,
  ResultReason,
  SessionEventArgs,
  SpeechConfig,
  SpeechRecognitionCanceledEventArgs,
  SpeechRecognitionEventArgs,
  SpeechRecognizer,
} from 'microsoft-cognitiveservices-speech-sdk'

type DaSpeechToTextProps = {
  onRecognize: (text: string) => void
  prompt?: string
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

const DaSpeechToText: React.FC<DaSpeechToTextProps> = ({
  onRecognize,
  prompt,
}) => {
  const [isListening, setIsListening] = useState(false)
  const [isMicActive, setIsMicActive] = useState(false)

  // useRef to store and immediately access the accumulated text and inactivity timeout
  const accumulatedTextRef = useRef('')
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null)

  // Refs for the recognizer and audio configuration
  // to have immediate access and avoid issues with asynchronous state updates
  const recognizerRef = useRef<SpeechRecognizer | null>(null)
  const audioConfigRef = useRef<AudioConfig | null>(null)

  const AZURE_SPEECH_KEY = import.meta.env.VITE_AZURE_SPEECH_SDK_KEY
  const AZURE_REGION = 'germanywestcentral'
  const INACTIVITY_DURATION = 8000 // in milliseconds

  const initializeRecognizer = () => {
    // Create a speech configuration instance
    const speechConfig = SpeechConfig.fromSubscription(
      AZURE_SPEECH_KEY,
      AZURE_REGION,
    )
    speechConfig.speechRecognitionLanguage = 'en-US'
    // Create an audio configuration instance using the default microphone
    audioConfigRef.current = AudioConfig.fromDefaultMicrophoneInput()
    // Create a speech recognizer instance
    recognizerRef.current = new SpeechRecognizer(
      speechConfig,
      audioConfigRef.current,
    )
    // Reference to the recognizer instance for easier access
    const recognizerInstance = recognizerRef.current
    // Event handler for intermediate recognition results
    recognizerInstance.recognizing = (
      s: Recognizer,
      e: SpeechRecognitionEventArgs,
    ) => {
      console.debug(`Recognizing: ${e.result.text}`)
      setIsMicActive(true) // Microphone is active while recognizing

      const intermediateRecognizedText =
        `${accumulatedTextRef.current} ${e.result.text}`
          .replace(/\s+/g, ' ')
          .trim()
      onRecognize(intermediateRecognizedText)

      resetInactivityTimeout() // Reset the inactivity timeout
    }
    // Event handler for final recognition results
    recognizerInstance.recognized = (
      s: Recognizer,
      e: SpeechRecognitionEventArgs,
    ) => {
      if (e.result.reason === ResultReason.RecognizedSpeech) {
        console.debug(`Recognized: ${e.result.text}`)

        accumulatedTextRef.current =
          `${accumulatedTextRef.current} ${e.result.text}`
            .replace(/\s+/g, ' ')
            .trim()
        onRecognize(accumulatedTextRef.current)

        resetInactivityTimeout() // Reset the inactivity timeout
      } else if (e.result.reason === ResultReason.NoMatch) {
        console.debug('No match found for the speech input.')
      }
    }
    // Event handler for recognition cancellation
    recognizerInstance.canceled = (
      s: Recognizer,
      e: SpeechRecognitionCanceledEventArgs,
    ) => {
      console.error(
        `Recognition canceled: Reason=${e.reason}, ErrorDetails=${e.errorDetails}`,
      )
      setIsListening(false)
      setIsMicActive(false)
      clearInactivityTimeout()
      cleanupResources()
    }

    recognizerInstance.sessionStopped = (
      s: Recognizer,
      e: SessionEventArgs,
    ) => {
      console.debug('Session stopped.')
      setIsListening(false)
      setIsMicActive(false)
      clearInactivityTimeout()
      cleanupResources()
    }
  }

  // Function to start speech recognition
  const handleStart = () => {
    console.debug('Starting recognition...')

    // Initialize the recognizer if it hasn't been already
    if (!recognizerRef.current) {
      initializeRecognizer()
    }

    // Start continuous speech recognitio
    recognizerRef.current?.startContinuousRecognitionAsync(
      () => {
        setIsListening(true)
        resetInactivityTimeout()
        setIsMicActive(true)
      },
      (error: string) => {
        console.error('Failed to start recognition:', error)
        handleStop()
      },
    )
  }

  // Function to stop speech recognition
  const handleStop = () => {
    console.debug('Stopping recognition...')

    recognizerRef.current?.stopContinuousRecognitionAsync(() => {
      setIsListening(false)
      clearInactivityTimeout()
      setIsMicActive(false)
      cleanupResources()
    })
  }

  const cleanupResources = () => {
    recognizerRef.current?.close()
    recognizerRef.current = null
    audioConfigRef.current?.close()
    audioConfigRef.current = null
  }

  const resetInactivityTimeout = () => {
    clearInactivityTimeout()
    inactivityTimeout.current = setTimeout(() => {
      console.debug('Inactivity timeout reached, stopping recognition...')
      handleStop()
    }, INACTIVITY_DURATION)
  }

  const clearInactivityTimeout = () => {
    if (inactivityTimeout.current) {
      clearTimeout(inactivityTimeout.current)
      inactivityTimeout.current = null
    }
  }

  const handleClick = () => {
    if (isListening) {
      handleStop()
    } else {
      handleStart()
    }
  }

  // Clear accumulated text when prompt is set to an empty string
  useEffect(() => {
    if (prompt === '') {
      console.debug('Clearing accumulated text')
      accumulatedTextRef.current = ''
    }
  }, [prompt])

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex cursor-pointer items-center rounded-lg p-1 px-2 text-da-primary-500 hover:bg-da-primary-100',
        isListening && 'bg-da-primary-100',
      )}
    >
      {isListening ? (
        <>
          {isMicActive ? (
            <>
              <BouncingDotsLoader />
              <TbPlayerStopFilled className="ml-1 size-4 text-red-500" />
            </>
          ) : (
            <>
              <TbPlayerStopFilled className="mr-2" />
              Stop
            </>
          )}
        </>
      ) : (
        <>
          <TbMicrophoneFilled className="mr-1 size-6 text-da-primary-500" />
          <p className="font-medium text-da-gray-medium">Voice input</p>
        </>
      )}
    </button>
  )
}

export default DaSpeechToText
