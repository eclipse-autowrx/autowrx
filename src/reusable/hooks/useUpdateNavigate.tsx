import { generatePath, matchPath, matchRoutes, Params, useLocation, useNavigate, useParams } from "react-router-dom"
import routes from "../../routes"

export const useCurrentPathPattern = () => {
    const location = useLocation()
    const result = matchRoutes(routes, location)
    if (result === null) {
        return "*"
    }
    const [{route}] = result
  
    return route.path ?? "*"
}

export const useParamsX = () => {
    const currentPattern = useCurrentPathPattern()
    const location = useLocation()
    return matchPath(currentPattern, location.pathname)?.params ?? {}
}

const useUpdateNavigate = () => {
    const currentPattern = useCurrentPathPattern()
    const currentParams = useParamsX()
    const navigate = useNavigate()

    return (params: Params) => {
        const mergedParams: Params = Object.assign(JSON.parse(JSON.stringify(currentParams)), params)
        const generated = generatePath(currentPattern, mergedParams)
        navigate(generated)
    }
}

export default useUpdateNavigate