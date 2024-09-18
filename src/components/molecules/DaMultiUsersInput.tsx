import clsx from 'clsx'
import DaText from '../atoms/DaText'
import { TbX } from 'react-icons/tb'
import { InvitedUser } from '@/types/user.type'
import { DaSelect, DaSelectItem } from '../atoms/DaSelect'

type DaMultiUsersInputProps = {
  inputString: string
  setInputString: React.Dispatch<React.SetStateAction<string>>
  selectedUsers: InvitedUser[]
  onRemoveUser: (user: InvitedUser) => void
  inputRef: React.RefObject<HTMLInputElement>
  accessLevelId: string
  setAccessLevelId: React.Dispatch<React.SetStateAction<string>>
  className?: string
}

const DaMultiUsersInput = ({
  inputString,
  setInputString,
  selectedUsers,
  onRemoveUser,
  inputRef,
  accessLevelId,
  setAccessLevelId,
  className,
}: DaMultiUsersInputProps) => {
  return (
    <div
      className={clsx(
        'flex max-h-[160px] min-h-10 w-full gap-2 overflow-y-auto rounded-md border border-da-black/30 px-2 pt-[6px] outline-[3px] outline-da-primary-100 focus-within:outline',
        className,
      )}
    >
      <div className="flex flex-1 flex-col">
        {selectedUsers.length > 0 && (
          <div className="mb-[6px] flex flex-wrap gap-1">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="flex cursor-default items-center rounded border border-da-gray-medium/50 px-1 py-0.5"
              >
                <DaText variant="small" className="text-da-gray-dark">
                  {user.name}
                </DaText>
                <button
                  className="-m-0.5 ml-1 p-0.5"
                  onClick={() => onRemoveUser(user)}
                >
                  <TbX />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          value={inputString}
          onChange={(e) => setInputString(e.target.value)}
          autoFocus
          className="block w-full bg-transparent text-da-gray-dark outline-none"
          placeholder="Email of users"
        />

        <div className="min-h-[6px]" />
      </div>

      {selectedUsers.length > 0 && (
        <DaSelect
          wrapperClassName="ml-auto sticky self-start -top-[5px] -mt-[5px] -mb-1 -mr-1"
          className="h-7 border-none !shadow-none"
          defaultValue="vss-api-4.1"
          value={accessLevelId}
          onValueChange={(value) => setAccessLevelId(value)}
        >
          <DaSelectItem
            helperText="Can view and create prototype"
            value="model_contributor"
          >
            <DaText className="da-label-small text-da-gray-dark">
              Contributor
            </DaText>
          </DaSelectItem>
          <DaSelectItem
            helperText="Can view, create prototype and update model"
            value="model_member"
          >
            <DaText className="da-label-small text-da-gray-dark">Member</DaText>
          </DaSelectItem>
        </DaSelect>
      )}
    </div>
  )
}

export default DaMultiUsersInput
