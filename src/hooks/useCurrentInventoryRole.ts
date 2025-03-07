import { roles } from '@/components/molecules/inventory/data'
import { useParams } from 'react-router-dom'

const useCurrentInventoryRole = () => {
  const { role } = useParams()

  return roles
}

export default useCurrentInventoryRole
