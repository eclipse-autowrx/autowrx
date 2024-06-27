import { useQuery } from '@tanstack/react-query'
import { listProposalPrototype } from '@/services/prototype.service'
import { Prototype } from '@/types/model.type'
import { List } from '@/types/common.type'

const useListPrototypeProposal = () => {
  return useQuery<List<Prototype>>({
    queryKey: ['listProposalPrototype'],
    queryFn: listProposalPrototype,
  })
}

export default useListPrototypeProposal
