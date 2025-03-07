import { useParams } from 'react-router-dom'
import useGetPrototype from './useGetPrototype'
import { instances } from '@/components/molecules/inventory/data'

const useCurrentInventoryItem = () => {
  const { inventory_id } = useParams()

  if (!inventory_id) {
    return {
      data: null,
    }
  }

  return {
    data: instances.find((instance) => instance.id === inventory_id),
  }
}

export default useCurrentInventoryItem
