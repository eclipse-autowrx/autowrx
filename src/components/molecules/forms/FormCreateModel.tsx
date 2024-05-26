import { DaButton } from "@/components/atoms/DaButton"
import { DaInput } from "@/components/atoms/DaInput"
import { DaText } from "@/components/atoms/DaText"
import { isAxiosError } from "axios"
import { useState } from "react"
import { TbLoader } from "react-icons/tb"

interface FormCreateModelProps {
  
}

const FormCreateModel = ({ }: FormCreateModelProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const createNewModel = async (e: React.FormEvent<HTMLFormElement>) => {
  }

  return (
    <form onSubmit={createNewModel} className='flex flex-col w-[400px] min-w-[400px] min-h-[300px] block px-2 md:px-6 py-2 bg-da-white'>
      {/* Title */}
      <DaText variant='title' className='text-da-primary-500'>
        Create New Model
      </DaText>

      <div className='mt-4'></div>
      {/* Content */}
      <DaInput name='email' placeholder='Model Name' label='Model Name *' className='mt-4' />

      <div className="grow"></div>

      {/* Error */}
      {error && (
        <DaText variant='small' className='mt-2 text-da-accent-500'>
          {error}
        </DaText>
      )}
      {/* Action */}
      <DaButton disabled={loading} type='submit' variant='gradient' className='w-full mt-2'>
        {loading && <TbLoader className='animate-spin text-lg mr-2' />}
        Create Model
      </DaButton>
    </form>
  )
}

export default FormCreateModel
