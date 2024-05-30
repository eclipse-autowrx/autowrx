import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaText } from '@/components/atoms/DaText'
import { TbLoader } from 'react-icons/tb'

const FormCreateUser = () => {
  return (
    <form className="flex flex-col w-[400px] min-w-[400px] min-h-[300px] px-2 md:px-6 py-4 bg-da-white">
      {/* Title */}
      <DaText variant="title" className="text-da-primary-500">
        Create New User
      </DaText>

      {/* Content */}
      <DaInput name="name" placeholder="Name" label="Name *" className="mt-4" />
      <DaInput
        name="email"
        placeholder="Email"
        label="Email *"
        className="mt-4"
      />

      <div className="grow"></div>

      {/* Error */}
      {/* {error && (
        <DaText variant="small" className="mt-2 text-da-accent-500">
          {error}
        </DaText>
      )} */}
      {/* Action */}
      <div className="space-x-2 ml-auto">
        <DaButton
          // disabled={loading}
          type="button"
          className="w-fit mt-8"
          variant="plain"
        >
          {/* {loading && <TbLoader className="animate-spin text-lg mr-2" />} */}
          Cancel
        </DaButton>
        <DaButton
          // disabled={loading}
          type="submit"
          className="w-fit mt-8"
        >
          {/* {loading && <TbLoader className="animate-spin text-lg mr-2" />} */}
          Create User
        </DaButton>
      </div>
    </form>
  )
}

export default FormCreateUser
