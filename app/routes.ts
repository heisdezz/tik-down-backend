import { type RouteConfig } from "@react-router/dev/routes";
import {
  nextRoutes,
  pageRouterStyle,
} from "rr-next-routes/react-router";

const generatedRoutes = nextRoutes({
  ...pageRouterStyle,
  folderName: "routes",
  routeFileNames: ["pages", "index"],
});

export default generatedRoutes satisfies RouteConfig;
