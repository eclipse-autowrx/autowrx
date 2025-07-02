// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useRef } from 'react'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'

const PrototypeTabTestDesign = () => {
  const { data: prototype } = useCurrentPrototype()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const defaultUrl = 'https://digital-auto-assistant.fly.dev'
  const [iframeUrl, setIframeUrl] = useState<string>(
    localStorage.getItem('iframeUrl') || defaultUrl,
  )
  const [payload, setPayload] = useState<string>('')
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false)

  useEffect(() => {
    const fetchAndSetPayload = async () => {
      if (prototype) {
        const { name, description, code, customer_journey, requirements } =
          prototype

        // Extract signals from the code
        const signals = await extractSignalsFromCode(code)

        const parsedRequirements = JSON.parse(requirements ?? '[]')

        // If description exists and is an object, add the status field.
        // Otherwise, create a new description object.
        const updatedDescription =
          typeof description === 'object' && description !== null
            ? { ...description, status: '' }
            : { status: '' }

        // Create the filtered payload including the signals
        const filteredPayload = {
          name,
          description: updatedDescription,
          code,
          customer_journey,
          signals,
          requirements: parsedRequirements,
        }

        setPayload(JSON.stringify(filteredPayload))
      }
    }

    fetchAndSetPayload()
  }, [prototype])

  const extractSignalsFromCode = (code: string): string[] => {
    // Match both "vehicle" and "Vehicle" at the start of the signal path
    const signalPattern = /\bvehicle\.(\w+(\.\w+)+)/gi
    const matches = code.match(signalPattern)

    if (matches) {
      const standardizedSignals = matches.map(
        (signal) =>
          signal
            .replace(/^vehicle/i, 'Vehicle') // Capitalize "vehicle" to "Vehicle"
            .replace(/\.(set|get|subscribe)$/, ''), // Remove trailing .set, .get, .subscribe
      )
      return Array.from(new Set(standardizedSignals)) // Remove duplicates
    }

    return []
  }

  const sendPayloadToIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow && iframeLoaded) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'prototype-information', payload: payload },
        '*',
      )
    }
  }

  useEffect(() => {
    if (iframeLoaded && payload) {
      const intervalId = setInterval(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { type: 'prototype-information', payload: payload },
            '*',
          )
          clearInterval(intervalId)
        }
      }, 500)

      return () => clearInterval(intervalId)
    }
  }, [iframeLoaded, payload])

  useEffect(() => {
    const storedUrl = localStorage.getItem('iframeUrl')
    if (storedUrl) {
      setIframeUrl(storedUrl)
    }
  }, [])

  return (
    <div className="flex flex-col w-full h-full">
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        className="flex w-full h-full"
        title="Prototype Information Iframe"
        onLoad={() => {
          setIframeLoaded(true)
          sendPayloadToIframe()
        }}
      />
    </div>
  )
}

export default PrototypeTabTestDesign
