import { useParams } from "react-router-dom"
import useGetPrototype from "./useGetPrototype"

const useCurrentModel = () => {
  const { prototype_id } = useParams()
  return useGetPrototype(prototype_id || '')
}

export default useCurrentModel