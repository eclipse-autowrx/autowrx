import { useLocation, useRoutes } from 'react-router-dom'
import routesConfig from './configs/routes'
import 'non.geist'
import 'non.geist/mono'
import useSelfProfileQuery from './hooks/useSelfProfile'
import { useEffect } from 'react'
import { addLog } from './services/log.service'
import ReactGA from 'react-ga4'
import config from './configs/config'

ReactGA.initialize(config?.ga4?.measurementId)

function App() {
  const routes = useRoutes(routesConfig)
  const location = useLocation()

  const { data: currentUser } = useSelfProfileQuery()

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: window.location.pathname })
  }, [location.pathname])

  useEffect(() => {
    if (!currentUser) {
      return
    }
    //
    let userId = 'anonymous'
    let userName = 'Anonymous'
    if (currentUser) {
      userId = currentUser.id
      userName = currentUser.name
    }
    let lastAnonymousView = localStorage.getItem(`lastview-${userId}`)
    let lastVisitTime = new Date(Number(lastAnonymousView || 0))
    let now = new Date()
    if (now.getTime() - lastVisitTime.getTime() > 60000 * 60) {
      localStorage.setItem(`lastview-${userId}`, now.getTime().toString())
      addLog({
        name: `User ${userName} visited`,
        create_by: userId,
        description: `User ${userName} visited`,
        type: 'visit',
        ref_id: userId,
        ref_type: 'user',
      })
    }
  }, [currentUser])

  return routes
}

export default App
