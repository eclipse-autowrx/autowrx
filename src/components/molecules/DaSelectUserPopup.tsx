import { useState, useEffect } from 'react'
import DaPopup from '../atoms/DaPopup'
import { DaInput } from '../atoms/DaInput'
import { useListUsers } from '@/hooks/useListUsers'
import { User } from '@/types/user.type'
import { DaText } from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import { maskEmail } from '@/lib/utils'

interface DaSelectUserProps {
  popupState: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  selectUser: (userId: string) => void
  excludeUsers?: User[]
}

const DaSelectUserPopup = ({
  popupState,
  selectUser,
  excludeUsers,
}: DaSelectUserProps) => {
  const { data } = useListUsers()
  const [renderUsers, setRenderUsers] = useState<any>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!data || !data.results) {
      return
    }

    let tmpUsers = data.results.filter(
      (user: User) =>
        !(excludeUsers || []).some(
          (excludedUser) => excludedUser && excludedUser.id === user.id,
        ),
    )
    if (search.trim() !== '') {
      tmpUsers = tmpUsers.filter(
        (user: User) =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()),
      )
    }
    setRenderUsers(tmpUsers)
  }, [data, excludeUsers, search])

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
            <div className="mt-2 px-2">
              <DaInput
                className="border-t-2 pt-3"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="max-h-[400px] xl:max-h-[600px] min-h-[400px] overflow-auto mt-2 p-1">
                {renderUsers &&
                  renderUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="border-b border-slate-200 flex"
                    >
                      <div className="py-1 grow">
                        <DaText
                          variant="regular-bold"
                          className="text-da-gray-meidum"
                        >
                          {user.name}
                        </DaText>
                        <div className="da-label-small italic">
                          {maskEmail(user.email)}{' '}
                          {user.provider && (
                            <span className="">via @{user.provider}</span>
                          )}
                        </div>
                      </div>
                      <div
                        className=" items-center justify-center flex"
                        onClick={() => {
                          if (selectUser) {
                            selectUser(user.id)
                          }
                          popupState[1](false)
                        }}
                      >
                        <DaText
                          variant="small-bold"
                          className="text-da-primary-500 hover:bg-da-primary-100 px-2 py-1 rounded-md da-clickable"
                        >
                          Select
                        </DaText>
                      </div>
                    </div>
                  ))}

                {search && renderUsers.length == 0 && (
                  <DaText className="py-2 px-4 text-center text-da-gray-dark bg-da-gray-light rounded">
                    No user match '{search}'
                  </DaText>
                )}
              </div>
            </div>
          )}
        </div>
      </DaPopup>
    </>
  )
}

export default DaSelectUserPopup
