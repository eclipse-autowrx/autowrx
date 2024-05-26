import { useRoutes } from "react-router-dom";
import routesConfig from "./configs/routes";
import "non.geist";
import "non.geist/mono";

function App() {
  const routes = useRoutes(routesConfig);

  return routes;
}

export default App;
