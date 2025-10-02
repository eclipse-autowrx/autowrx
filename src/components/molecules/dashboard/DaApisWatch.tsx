// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { FC, useEffect, useState } from 'react'
import useRuntimeStore from '@/stores/runtimeStore'
import { shallow } from 'zustand/shallow'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string
    onEnter?: (value:string) => void
}

const ApiInput = React.forwardRef<HTMLInputElement, InputProps>(
    (
      {
        className,
        onEnter,
        ...props
      },
      ref,
    )  => {
    const [value, setValue] = useState("")
    return <input className={
                `w-16 flex px-2 py-1 h-6 ml-2 rounded
                text-da-gray-dark text-right font-semibold
                focus-visible:ring-0 focus-visible:outline-none
                disabled:cursor-not-allowed`}
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter")
                    if(onEnter) {
                        onEnter(value)
                        setValue("")
                    }
                }}
            {...props}/>
})

export interface DaApisWatchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    requestWriteSignalValue?: (obj: any) => void
}


const DaApisWatch: FC<DaApisWatchProps> = ({requestWriteSignalValue}) => {

    const [apisValue] = useRuntimeStore(
        (state) => [
            state.apisValue as any
        ],
        shallow,
    )

    return <div className="w-full mt-2">
        { apisValue && Object.keys(apisValue).map((key: string) => <div key={key} className={`px-1 flex items-center border-da-gray-medium 
            text-da-white da-label-tiny mb-1`}>
            <div className='grow px-1'>{key}</div>
            <div className='w-16 px-1 py-0.5 text-right border border-da-gray-medium rounded'>{String(apisValue[key]) || 'null'}</div>
            <ApiInput onEnter={(value:string) => {
                // console.log("onEntered", value)
                let sendValue = null
                const trimmedValue = value.trim()
                
                // Check if it's a boolean
                if(["true", "false"].includes(trimmedValue.toLowerCase())) {
                    sendValue = (trimmedValue.toLowerCase()=='true')
                } 
                // Check if it's a valid number (preserving original empty string behavior)
                else if (!isNaN(Number(value)) && value.trim() !== '') {
                    sendValue = Number(value)
                }
                // Otherwise, keep it as a string (but preserve original empty string as number behavior)
                else {
                    sendValue = value.trim() === '' ? Number(value) : trimmedValue
                }
                
                if(value.length > 0 && requestWriteSignalValue) {
                    let payload = {} as any
                    payload[`${key}`] = sendValue
                    requestWriteSignalValue(payload)
                }
            }}/>
        </div>)
        }
    </div>
}

export default DaApisWatch