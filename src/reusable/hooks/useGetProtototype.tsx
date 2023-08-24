import { getPrototypes } from "../../apis"
import { Model, Prototype } from "../../apis/models"
import useAsyncRefresh from "./useAsyncRefresh"
import { useCurrentModel } from "./useCurrentModel"

const useGetPrototype = (prototype_id: string): {
    prototype?: Prototype | null
    loading: boolean
} => {
    const model = useCurrentModel() as Model
    const {value: prototype, loading} = useAsyncRefresh(async () => {
        if (prototype_id === "") {
            // Exceptional case, avoid extra call
            return null
        }
        const prototypes = await getPrototypes(model.id)
        return prototypes.find(prototype => prototype.id === prototype_id) ?? null
    }, [model.id, prototype_id])

    return {prototype, loading}
}

export default useGetPrototype