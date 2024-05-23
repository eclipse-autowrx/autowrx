import { RouteObject } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";
import PageHome from "@/pages/PageHome";
import PageAbout from "@/pages/PageAbout";
import PageLogin from "@/pages/PageLogin";
import PageComponent from "@/pages/PageComponent";
import PageMolecules from "@/pages/PageMolecules";
import PageOrganisms from "@/pages/PageOrganisms";

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
    path: "/components",
    element: <PageComponent />,
    children: [{ index: true, element: <PageComponent /> }],
  },
  {
    path: "/molecules",
    element: <PageMolecules />,
    children: [{ index: true, element: <PageMolecules /> }],
  },
  {
    path: "/organisms",
    element: <PageOrganisms />,
    children: [{ index: true, element: <PageOrganisms /> }],
  },
];

export default routesConfig;
