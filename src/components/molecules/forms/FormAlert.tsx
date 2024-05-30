import { DaButton } from '@/components/atoms/DaButton'
import { DaText } from '@/components/atoms/DaText'

const FormAlert = () => {
  return (
    <form className="flex flex-col space-y-8 w-[500px] min-w-[400px] px-2 md:px-6 py-4 bg-da-white">
      <DaText>Are you sure you want to delete user 'tamtest1'</DaText>
      <div className="ml-auto space-x-2">
        <DaButton type="button" variant="plain">
          Cancel
        </DaButton>
        <DaButton>Confirm</DaButton>
      </div>
    </form>
  )
}

export default FormAlert
