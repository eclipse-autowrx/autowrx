import { useQuery } from "@tanstack/react-query"
import { getModel } from "@/services/model.service"

const useGetModel = (id: string) => {
  return useQuery({ queryKey: ["getModel", id], queryFn: () => getModel(id) })
}

export default useGetModel
