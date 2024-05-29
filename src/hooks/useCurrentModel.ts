import { useParams } from 'react-router-dom'
import useGetModel from './useGetModel'

const useCurrentModel = () => {
  const { id } = useParams()
  return useGetModel(id!)
}

export default useCurrentModel
