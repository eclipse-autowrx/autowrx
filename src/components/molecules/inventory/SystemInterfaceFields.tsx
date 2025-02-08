import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import DaText from '@/components/atoms/DaText'
import DaTooltip from '@/components/atoms/DaTooltip'
import clsx from 'clsx'
import { useState } from 'react'
import { TbCheck, TbCircle, TbCircleDotFilled } from 'react-icons/tb'

const SystemInterfaceFields = () => {
  const [type, setType] = useState<'reference' | 'manual'>('reference')

  return (
    <div>
      <DaText variant="small-bold" className="!text-da-gray-darkest">
        Choose how to add interface data
      </DaText>
      <div className="flex gap-3 mt-1">
        <button
          onClick={() => setType('reference')}
          type="button"
          className={clsx(
            'h-10 px-3 flex items-center border rounded-lg shadow-sm gap-2 flex-1',
            type === 'reference' && 'bg-da-primary-500 text-white',
          )}
        >
          {type === 'reference' ? (
            <TbCircleDotFilled className="w-5 h-5" />
          ) : (
            <TbCircle className="w-5 h-5 text-da-primary-500" />
          )}
          Reference from Vehicle Signal
        </button>
        <button
          onClick={() => setType('manual')}
          type="button"
          className={clsx(
            'h-10 px-3 flex items-center border rounded-lg shadow-sm gap-2 flex-1',
            type === 'manual' && 'bg-da-primary-500 text-white',
          )}
        >
          {type === 'manual' ? (
            <TbCircleDotFilled className="w-5 h-5" />
          ) : (
            <TbCircle className="w-5 h-5 text-da-primary-500" />
          )}
          Enter interface data manually
        </button>
      </div>

      {type === 'reference' && (
        <>
          <div className="mt-3">
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Link to Vehicle Signal *
            </DaText>
            <div className="flex gap-2 mt-1">
              <DaInput
                className="flex-1"
                wrapperClassName="h-8 shadow"
                placeholder="https://playground.digital.auto/model/<model_id>/api/<api>"
                inputClassName="text-sm h-6 flex-1 text-da-gray-darkest"
              />
              <DaTooltip content="Check reference">
                <DaButton
                  type="button"
                  variant="outline-nocolor"
                  size="sm"
                  className="h-10 !text-da-gray-darkest"
                >
                  <TbCheck className="w-4 h-4 mr-1" /> Check
                </DaButton>
              </DaTooltip>
            </div>

            <DaText className="block !text-xs mt-1 !text-da-gray-dark">
              The Vehicle Signal link must be valid and accessible to you.
            </DaText>
          </div>
        </>
      )}
    </div>
  )
}

export default SystemInterfaceFields
