import React, { useState, useEffect, useRef } from 'react'
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk'
import { TbMicrophoneFilled, TbPlayerStopFilled } from 'react-icons/tb'

type DaSpeechToTextProps = {
  onRecognize: (text: string) => void
  prompt?: string
}

const DaSpeechToText: React.FC<DaSpeechToTextProps> = ({
  onRecognize,
  prompt,
}) => {
  const [isListening, setIsListening] = useState(false)
  const [isMicActive, setIsMicActive] = useState(false)
  const [manuallyStopped, setManuallyStopped] = useState(false) // Use state for manual stop flag
  const [recognizer, setRecognizer] =
    useState<SpeechSDK.SpeechRecognizer | null>(null)
  const accumulatedTextRef = useRef('') // Use ref for accumulated text
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null) // Keep timer as ref

  const AZURE_SPEECH_KEY = import.meta.env.VITE_AZURE_SPEECH_SDK_KEY
  const AZURE_REGION = 'germanywestcentral'
  const INACTIVITY_DURATION = 10000 // in milliseconds

  const initializeRecognizer = () => {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      AZURE_SPEECH_KEY,
      AZURE_REGION,
    )
    speechConfig.speechRecognitionLanguage = 'en-US'

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
    const recognizerInstance = new SpeechSDK.SpeechRecognizer(
      speechConfig,
      audioConfig,
    )

    recognizerInstance.recognizing = (
      s: SpeechSDK.Recognizer,
      e: SpeechSDK.SpeechRecognitionEventArgs,
    ) => {
      console.debug(`Recognizing: ${e.result.text}`)
      setIsMicActive(true) // Microphone is active while recognizing

      // Use ref to prevent overwriting by recognizing events
      const interimText = `${accumulatedTextRef.current} ${e.result.text}`
        .replace(/\s+/g, ' ')
        .trim()
      onRecognize(interimText)

      // Reset inactivity timeout on each recognizing event
      resetInactivityTimeout()
    }

    recognizerInstance.recognized = (
      s: SpeechSDK.Recognizer,
      e: SpeechSDK.SpeechRecognitionEventArgs,
    ) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        console.debug(`Recognized: ${e.result.text}`)

        // Update the ref for accumulated text, so it is not overwritten by next recognizing event
        accumulatedTextRef.current =
          `${accumulatedTextRef.current} ${e.result.text}`
            .replace(/\s+/g, ' ')
            .trim()
        onRecognize(accumulatedTextRef.current)

        // Reset inactivity timeout on each recognized event
        resetInactivityTimeout()
      } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
        console.debug('No match found for the speech input.')
      }
    }

    recognizerInstance.canceled = (
      s: SpeechSDK.Recognizer,
      e: SpeechSDK.SpeechRecognitionCanceledEventArgs,
    ) => {
      console.error(
        `Recognition canceled: Reason=${e.reason}, ErrorDetails=${e.errorDetails}`,
      )
      handleStop()
    }

    recognizerInstance.sessionStopped = (
      s: SpeechSDK.Recognizer,
      e: SpeechSDK.SessionEventArgs,
    ) => {
      console.debug('Session stopped.')
      handleStop()
    }

    setRecognizer(recognizerInstance)
  }

  const handleStart = () => {
    console.debug('Starting recognition...')
    setManuallyStopped(false) // Reset manual stop flag

    if (!recognizer) {
      initializeRecognizer()
    }

    recognizer?.startContinuousRecognitionAsync(
      () => {
        setIsListening(true)
        resetInactivityTimeout() // Set the inactivity timeout
        setIsMicActive(true) // Start the microphone indicator
      },
      (error: string) => {
        console.error('Failed to start recognition:', error)
        handleStop()
      },
    )
  }

  const handleStop = () => {
    console.debug('Stopping recognition...')
    setManuallyStopped(true) // Set the manual stop flag

    recognizer?.stopContinuousRecognitionAsync(() => {
      setIsListening(false)
      clearInactivityTimeout() // Clear the timeout
      setIsMicActive(false) // Ensure microphone indicator turns off
    })
  }

  const resetInactivityTimeout = () => {
    clearInactivityTimeout() // Clear any existing timeout
    inactivityTimeout.current = setTimeout(() => {
      console.debug('Inactivity timeout reached, stopping recognition...')
      handleStop() // Stop completely on timeout
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
      accumulatedTextRef.current = '' // Clear ref variable
    }
  }, [prompt])

  // Restart if not manually stopped
  useEffect(() => {
    if (isListening && !manuallyStopped) {
      recognizer?.startContinuousRecognitionAsync()
    }
  }, [recognizer, isListening, manuallyStopped])

  return (
    <button onClick={handleClick} className="flex items-center p-2 border">
      {isListening ? (
        <>
          {isMicActive ? (
            <span className="w-2 h-2 mr-2 bg-red-500 rounded-full"></span>
          ) : (
            <TbPlayerStopFilled className="mr-2" />
          )}
          Stop
        </>
      ) : (
        <>
          <TbMicrophoneFilled className="mr-2" />
          Start
        </>
      )}
    </button>
  )
}

export default DaSpeechToText
