import "module-alias/register";
import express from "express";
import * as dotenv from "dotenv";
dotenv.config();
import cors, { CorsOptionsDelegate, CorsRequest } from "cors";
import cookieParser from "cookie-parser";
import globalErrorHandler from "./middleware/globalErrorHandler";
import { appRouter } from "./routes";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";
import path from "path";
import { initCronJobs } from "./cron/closeTicket";
import { initSoftwareCronJobs } from "./cron/autoUnassignSoftware";
const app = express();
app.use(express.json());

const allowedOrigins = [
  process.env.LIVE_FRONTEND_URL,
  process.env.LOCAL_FRONTEND_URL,
];

const corsOptionsDelegate: CorsOptionsDelegate = (
  req: CorsRequest,
  callback
) => {
  const origin = req.headers.origin;

  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      optionsSuccessStatus: 204,
    });
  } else {
    callback(new Error("Not allowed by CORS: " + origin), {
      origin: false,
    });
  }
};
app.use(cookieParser());
app.use(cors(corsOptionsDelegate));
app.use("/api", appRouter);
// Serve static files from the uploads folder (outside src)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

initCronJobs();
initSoftwareCronJobs();

app.get("/", (req, res) => {
  res.send("Welcome to the Asset Management System");
});
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(globalErrorHandler);

const PORT = process.env.NODE_ENV === "development" ? 3001 : 8082;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
