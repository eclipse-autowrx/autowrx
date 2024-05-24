import { RouteObject } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";
import PageHome from "@/pages/PageHome";
import PageAbout from "@/pages/PageAbout";
import PageLogin from "@/pages/PageLogin";
import PageComponent from "@/pages/test-ui/PageComponent";
import PageMolecules from "@/pages/test-ui/PageMolecules";
import PageOrganisms from "@/pages/test-ui/PageOrganisms";
import PageTestHome from "@/pages/test-ui/PageTestHome";
import PageTestForm from "@/pages/test-ui/PageTestForm";

const routesConfig: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [{ index: true, element: <PageHome /> }],
  },
  {
    path: "/about",
    element: <RootLayout />,
    children: [{ index: true, element: <PageAbout /> }],
  },
  {
    path: "/login",
    element: <RootLayout />,
    children: [{ index: true, element: <PageLogin /> }],
  },
  {
    path: "/test-ui/forms",
    element: <RootLayout />,
    children: [{ index: true, element: <PageTestForm /> }],
  },
  {
    path: "/test-ui/home",
    element: <RootLayout />,
    children: [{ index: true, element: <PageTestHome /> }],
  },
  {
    path: "/test-ui/components",
    element: <PageComponent />,
    children: [{ index: true, element: <PageComponent /> }],
  },
  {
    path: "/test-ui/molecules",
    element: <PageMolecules />,
    children: [{ index: true, element: <PageMolecules /> }],
  },
  {
    path: "/test-ui/organisms",
    element: <PageOrganisms />,
    children: [{ index: true, element: <PageOrganisms /> }],
  },
];

export default routesConfig;
