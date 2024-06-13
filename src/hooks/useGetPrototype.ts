import { useQuery } from "@tanstack/react-query"
import { getPrototype } from "@/services/prototype.service"

const useGetPrototype = (prototype_id: string) => {
  return useQuery({ queryKey: ["getPrototype", prototype_id], queryFn: () => getPrototype(prototype_id) })
}

export default useGetPrototype
