import { createRequestHandler } from "@react-router/node";
import * as build from "../build/server/index.js";

const handler = createRequestHandler({ build });

export default async (request, response) => {
  try {
    return await handler(request, response);
  } catch (error) {
    console.error("Handler error:", error);
    return response.status(500).json({ error: "Internal Server Error" });
  }
};

