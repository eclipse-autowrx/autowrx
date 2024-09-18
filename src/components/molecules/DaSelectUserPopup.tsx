import { useState, useEffect } from 'react'
import DaPopup from '../atoms/DaPopup'
import { DaInput } from '../atoms/DaInput'
import { useListUsers } from '@/hooks/useListUsers'
import { User } from '@/types/user.type'
import { DaText } from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
// import { maskEmail } from '@/lib/utils'
import { DaAvatar } from '../atoms/DaAvatar'

interface DaSelectUserProps {
  popupState: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  selectUser: (userId: string) => void
  excludeUsers?: User[]
  includeFullDetails?: boolean
}

const DaSelectUserPopup = ({
  popupState,
  selectUser,
  excludeUsers,
  includeFullDetails = false,
}: DaSelectUserProps) => {
  const { data } = useListUsers({
    limit: 100,
    includeFullDetails,
  })
  const [renderUsers, setRenderUsers] = useState<any>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!data || !data) {
      return
    }

    let tmpUsers = data.filter(
      (user: User) =>
        !(excludeUsers || []).some(
          (excludedUser) => excludedUser && excludedUser.id === user.id,
        ),
    )
    if (search.trim() !== '') {
      tmpUsers = tmpUsers.filter(
        (user: User) =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email?.toLowerCase().includes(search.toLowerCase()),
      )
    }
    setRenderUsers(tmpUsers)
  }, [data, excludeUsers, search])

  return (
    <>
      <DaPopup state={popupState} trigger={<span></span>}>
        <div className="min-w-[500px] select-none rounded">
          <div className="flex items-center border-da-gray-light px-3 py-1 text-xl font-bold">
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
              <div className="-mx-4 mt-2 max-h-[400px] min-h-[400px] overflow-auto p-1 px-4 xl:max-h-[600px]">
                {renderUsers &&
                  renderUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-x-3 border-b border-slate-200 py-3"
                    >
                      <DaAvatar src={user?.image_file} />
                      <div className="grow py-1">
                        <DaText
                          variant="regular-bold"
                          className="text-da-gray-meidum"
                        >
                          {user.name}
                        </DaText>
                        {user.email && (
                          <div className="da-label-small italic">
                            {user?.email ?? ''} {''}
                            {user.provider && (
                              <span>
                                {''}via @{user.provider}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div
                        className="flex items-center justify-center"
                        onClick={() => {
                          if (selectUser) {
                            selectUser(user.id)
                          }
                          popupState[1](false)
                        }}
                      >
                        <DaText
                          variant="small-bold"
                          className="cursor-pointer rounded-md px-2 py-1 text-da-primary-500 hover:bg-da-primary-100"
                        >
                          Select
                        </DaText>
                      </div>
                    </div>
                  ))}

                {search && renderUsers.length == 0 && (
                  <DaText className="rounded bg-da-gray-light px-4 py-2 text-center text-da-gray-dark">
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
