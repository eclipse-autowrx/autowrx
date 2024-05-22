import { useRoutes } from "react-router-dom";
import routesConfig from "./configs/routes";
import { NavigationBar } from "./components/organisms/NavigationBar";
import { SiteFooter } from "./components/organisms/SiteFooter";
import "non.geist";
import "non.geist/mono";

function App() {
  const routes = useRoutes(routesConfig);

  return (
    <>
      <NavigationBar />
      <div className="w-full h-full min-h-[90vh] bg-slate-100">{routes}</div>
      <SiteFooter />
    </>
  );
}

export default App;
