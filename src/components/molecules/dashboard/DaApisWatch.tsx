import { FC, useEffect } from 'react'
import useRuntimeStore from '@/stores/runtimeStore'
import { shallow } from 'zustand/shallow'

const DaApisWatch: FC = ({}) => {

    const [apisValue] = useRuntimeStore(
        (state) => [
            state.apisValue as any
        ],
        shallow,
    )

    return <div className="w-full mt-2">
        { apisValue && Object.keys(apisValue).map((key) => <div key={key} className={`px-1 flex items-center border-da-gray-medium 
            text-da-white da-label-tiny mb-1`}>
            <div className='grow px-1'>{key}</div>
            <div className='w-20 px-1 py-0.5 text-right border border-da-gray-medium rounded'>{apisValue[key] || 'null'}</div>
        </div>)
        }
    </div>
}

export default DaApisWatch