import { FC } from 'react'
import CodeEditor from '../molecules/CodeEditor'
import { DaButton } from '../atoms/DaButton'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'

const PrototypeTabCode: FC = ({}) => {
    const [prototype] = useModelStore((state) => [state.prototype as Prototype])

    if(!prototype) {
        return <div></div>
    }

    return <div className="w-full h-full grid grid-cols-2 place-content-stretch">
        <div className='col-span-full md:col-span-1 flex flex-col'>
            <div className='mb-1 py-1 px-2 flex bg-da-gray-light'>
                <div className='grow'></div>
                <DaButton size="sm">Deploy</DaButton>
            </div>
            <CodeEditor
                code={prototype.code || ''}
                setCode={ () => {}}
                editable={true}
                language="python"
                onBlur={() => {}}
            />
        </div>
        <div className='col-span-full md:col-span-1 flex items-center justify-center'>
            Col 2
        </div>
    </div>
}

export default PrototypeTabCode