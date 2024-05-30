import UsersManagement from '@/components/organisms/UsersManagement'

const PageManageUsers = () => {
  return (
    <div className="flex w-full col-span-full px-5">
      <div className="mx-auto h-[calc(100vh-140px)] w-full max-w-4xl">
        <UsersManagement />
      </div>
    </div>
  )
}

export default PageManageUsers
