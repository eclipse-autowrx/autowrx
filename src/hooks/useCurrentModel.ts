import { useParams } from 'react-router-dom'
import useGetModel from './useGetModel'

const useCurrentModel = () => {
  const { model_id } = useParams()
  return useGetModel(model_id!)
}

export default useCurrentModel
