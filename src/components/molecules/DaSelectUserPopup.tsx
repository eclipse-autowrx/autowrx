import { useState, useEffect } from 'react'
import DaPopup from '../atoms/DaPopup'
import { DaInput } from '../atoms/DaInput'
import { TbX } from 'react-icons/tb'
import { useListUsers } from '@/hooks/useListUsers'
import { User } from '@/types/user.type'
import { DaText } from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'

interface DaSelectUserProps {
  popupState: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  selectUser: (userId: string) => void
  excludeUserIds: string[] // User already selected/existed
}

const DaSelectUserPopup = ({
  popupState,
  selectUser,
  excludeUserIds,
}: DaSelectUserProps) => {
  const { data, isLoading, error } = useListUsers()
  const [renderUsers, setRenderUsers] = useState<any>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!data || !data.results) {
      return
    }

    let tmpUsers = data.results.filter(
      (user: User) => !(excludeUserIds || []).includes(user.id),
    )
    if (search.trim() !== '') {
      tmpUsers = tmpUsers.filter(
        (user: User) =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()),
      )
    }
    setRenderUsers(tmpUsers)
  }, [data, excludeUserIds, search])

  return (
    <>
      <DaPopup state={popupState} trigger={<span></span>}>
        <div className="min-w-[500px] rounded select-none">
          <div className="text-xl font-bold border-da-gray-light py-1 px-3 flex items-center">
            <DaText variant="sub-title" className="text-da-primary-500">
              Select user
            </DaText>
            <div className="grow"></div>
            <DaButton
              variant="outline-nocolor"
              size="sm"
              className="text-da-primary-500"
              onClick={() => {
                popupState[1](false)
              }}
            >
              Close
            </DaButton>
          </div>
          {!loading && (
            <div className="mt-2 px-2 max-h-[400px] min-h-[400px] overflow-auto">
              <DaInput
                className="border-t-2 pt-3"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {renderUsers &&
                renderUsers.map((user: any) => (
                  <div
                    key={user.id}
                    className="border-b border-slate-200 flex mt-2"
                  >
                    <div className="py-1 grow">
                      <DaText
                        variant="regular-bold"
                        className="text-da-gray-meidum"
                      >
                        {user.name}
                      </DaText>
                      <div className="da-label-small italic">
                        {user.email}{' '}
                        {user.provider && (
                          <span className="">via @{user.provider}</span>
                        )}
                      </div>
                    </div>
                    <div
                      className=" items-center justify-center flex rounded-sm hover:text-da-accent-500 da-label-regular"
                      onClick={() => {
                        if (selectUser) {
                          selectUser(user.id)
                        }
                        popupState[1](false)
                      }}
                    >
                      Select
                    </div>
                  </div>
                ))}

              {search && renderUsers.length == 0 && (
                <DaText className="py-2 px-4 text-center text-da-gray-dark bg-da-gray-light rounded">
                  No user match '{search}'
                </DaText>
              )}
            </div>
          )}
        </div>
      </DaPopup>
    </>
  )
}

export default DaSelectUserPopup
