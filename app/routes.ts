import { type RouteConfig } from "@react-router/dev/routes";
import { nextRoutes, pageRouterStyle } from "rr-next-routes/react-router";

const generatedRoutes = nextRoutes({
  ...pageRouterStyle,
  folderName: "routes",
});

export default generatedRoutes satisfies RouteConfig;
