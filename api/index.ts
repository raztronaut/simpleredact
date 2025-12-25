import { handle } from "hono/vercel";
import app from "../server/index";

// Vercel serverless function export
export default handle(app);
